"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

/**
 * Dev-only live terminal. Walks `[data-fs-path]` elements to build a virtual
 * filesystem and operates on the live DOM through unix-y commands.
 *
 * Backtick (`) toggles open/closed, Esc closes. Tab autocompletes paths,
 * arrows navigate history, Ctrl-L clears.
 */

type FsType = "dir" | "file";

interface FsNode {
  name: string;
  path: string;
  type: FsType;
  children: Record<string, FsNode>;
  el: HTMLElement | null;
}

interface BufferLine {
  v: string;
  c?: "fg" | "muted" | "cyan" | "err";
  prompt?: string;
  suggest?: string;
  after?: { v: string; c?: BufferLine["c"] };
  after2?: { v: string; c?: BufferLine["c"] };
}

interface RmUndo {
  restore: () => void;
  path: string;
}

declare global {
  interface Window {
    __rmUndo?: RmUndo[];
  }
}

/* ── VFS ─────────────────────────────────────────────────── */
function buildVFS(rootEl: ParentNode): FsNode {
  const nodes = Array.from(rootEl.querySelectorAll<HTMLElement>("[data-fs-path]"));
  const root: FsNode = { name: "/", path: "/", type: "dir", children: {}, el: null };
  for (const el of nodes) {
    const raw = (el.getAttribute("data-fs-path") || "").replace(/^\/+|\/+$/g, "");
    if (!raw) continue;
    const parts = raw.split("/").filter(Boolean);
    let cur = root;
    let acc = "";
    for (let i = 0; i < parts.length; i++) {
      const isLast = i === parts.length - 1;
      const seg = parts[i];
      acc += "/" + seg;
      if (!cur.children[seg]) {
        cur.children[seg] = {
          name: seg,
          path: acc,
          type: isLast ? ((el.getAttribute("data-fs-type") || "file") as FsType) : "dir",
          children: {},
          el: isLast ? el : null,
        };
      }
      if (isLast && !cur.children[seg].el) {
        cur.children[seg].el = el;
        cur.children[seg].type = (el.getAttribute("data-fs-type") || "file") as FsType;
      }
      cur = cur.children[seg];
    }
  }
  return root;
}

function resolvePath(cwd: string, path: string): string {
  if (!path) return cwd;
  const parts = path.startsWith("/")
    ? path.split("/").filter(Boolean)
    : (cwd + "/" + path).split("/").filter(Boolean);
  const out: string[] = [];
  for (const p of parts) {
    if (p === ".") continue;
    if (p === "..") out.pop();
    else out.push(p);
  }
  return "/" + out.join("/");
}

function findNode(root: FsNode, abs: string): FsNode | null {
  if (abs === "/" || abs === "") return root;
  const parts = abs.split("/").filter(Boolean);
  let cur: FsNode = root;
  for (const p of parts) {
    if (!cur.children || !cur.children[p]) return null;
    cur = cur.children[p];
  }
  return cur;
}

function listChildren(node: FsNode): FsNode[] {
  return Object.values(node.children || {}).sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

function readFile(node: FsNode | null): string {
  if (!node || !node.el) return "";
  const override = node.el.getAttribute("data-fs-content");
  if (override != null) return override;
  return (node.el.innerText || node.el.textContent || "").trim();
}

function writeFile(node: FsNode, content: string): boolean {
  if (!node.el) return false;
  node.el.style.transition = "background .25s, outline-color .25s";
  node.el.style.outline = "1px solid rgba(0,212,255,.7)";
  node.el.style.outlineOffset = "4px";
  setTimeout(() => {
    if (node.el) node.el.style.outline = "none";
  }, 600);
  const target =
    (node.el.querySelector<HTMLElement>("[data-fs-text]") as HTMLElement | null) ?? node.el;
  target.innerText = content;
  return true;
}

function removeNode(node: FsNode): boolean {
  if (!node.el) return false;
  const el = node.el;
  el.style.transition = "opacity .35s, transform .35s, filter .35s";
  el.style.opacity = "0";
  el.style.filter = "blur(4px)";
  el.style.transform = "scale(.97)";
  setTimeout(() => {
    el.style.display = "none";
  }, 380);
  return true;
}

function moveNode(srcNode: FsNode, dstNode: FsNode): boolean {
  if (!srcNode.el || !dstNode.el || !dstNode.el.parentNode) return false;
  dstNode.el.parentNode.insertBefore(srcNode.el, dstNode.el);
  srcNode.el.style.transition = "background .3s";
  srcNode.el.style.background = "rgba(124,58,237,.18)";
  setTimeout(() => {
    if (srcNode.el) srcNode.el.style.background = "";
  }, 700);
  return true;
}

/* ── Parser ──────────────────────────────────────────────── */
function tokenize(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === q) {
        q = null;
        continue;
      }
      cur += c;
    } else if (c === '"' || c === "'") {
      q = c;
    } else if (c === " " || c === "\t") {
      if (cur) {
        out.push(cur);
        cur = "";
      }
    } else if (c === ">") {
      if (cur) {
        out.push(cur);
        cur = "";
      }
      out.push(">");
    } else {
      cur += c;
    }
  }
  if (cur) out.push(cur);
  return out;
}

/* ── Commands ────────────────────────────────────────────── */
type CmdContext = {
  getRoot: () => FsNode;
  getCwd: () => string;
  setCwd: (p: string) => void;
  addLines: (lines: BufferLine | BufferLine[]) => void;
  setTheme: (key: string, value: string) => void;
  clearBuffer: () => void;
  getHistory: () => string[];
};

type CmdFn = (args: string[]) => void | Promise<void>;
type CmdMap = Record<string, CmdFn>;

function makeCommands(ctx: CmdContext): CmdMap {
  const { getRoot, getCwd, setCwd, addLines, setTheme, clearBuffer, getHistory } = ctx;
  const cmds: CmdMap = {};

  cmds.help = () => {
    addLines([
      { v: "commands", c: "muted" },
      { v: "  ls [path]              list directory contents" },
      { v: "  cd <path>              change directory (also scrolls)" },
      { v: "  pwd                    print working directory" },
      { v: "  tree [path]            recursive listing" },
      { v: "  cat <file>             read a file" },
      { v: "  grep <pat> <file>      search inside a file" },
      { v: '  echo "x" > <file>      overwrite file content (modifies DOM)' },
      { v: "  rm <path>              remove node from DOM (with undo timer)" },
      { v: "  undo                   restore the last rm" },
      { v: "  mv <src> <dst>         move node before another" },
      { v: "  theme <key> <value>    e.g. theme accent #ff00ff" },
      { v: "  whoami / uptime / date / hostname" },
      { v: "  tour                   guided demo — watch the dom change", c: "cyan" },
      { v: "  history / clear        history · clear screen" },
      { v: "  help                   this message" },
      { v: "" },
      { v: "tip: TAB autocompletes paths · ↑↓ history · Esc closes terminal", c: "muted" },
    ]);
  };

  cmds.pwd = () => addLines([{ v: getCwd() }]);

  cmds.ls = (args) => {
    const target = args[0] ? resolvePath(getCwd(), args[0]) : getCwd();
    const node = findNode(getRoot(), target);
    if (!node)
      return addLines([
        { v: `ls: ${args[0] || target}: no such file or directory`, c: "err" },
      ]);
    if (node.type !== "dir") return addLines([{ v: node.name }]);
    const kids = listChildren(node);
    if (!kids.length) return addLines([{ v: "(empty)", c: "muted" }]);
    addLines([
      {
        v: kids.map((k) => (k.type === "dir" ? k.name + "/" : k.name)).join("   "),
        c: "fg",
      },
    ]);
  };

  cmds.cd = (args) => {
    const p = args[0] || "/";
    const abs = resolvePath(getCwd(), p);
    const node = findNode(getRoot(), abs);
    if (!node)
      return addLines([{ v: `cd: ${p}: no such file or directory`, c: "err" }]);
    if (node.type !== "dir")
      return addLines([{ v: `cd: ${p}: not a directory`, c: "err" }]);
    setCwd(abs === "" ? "/" : abs);
    if (node.el) node.el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  cmds.tree = (args) => {
    const start = args[0] ? resolvePath(getCwd(), args[0]) : getCwd();
    const node = findNode(getRoot(), start);
    if (!node)
      return addLines([
        { v: `tree: ${args[0]}: no such file or directory`, c: "err" },
      ]);
    const out: BufferLine[] = [];
    const walk = (n: FsNode, prefix = "", last = true) => {
      out.push({
        v:
          prefix +
          (prefix ? (last ? "└─ " : "├─ ") : "") +
          (n.type === "dir" ? n.name + "/" : n.name),
        c: n.type === "dir" ? "cyan" : "fg",
      });
      if (n.type === "dir") {
        const kids = listChildren(n);
        kids.forEach((k, i) =>
          walk(k, prefix + (prefix ? (last ? "   " : "│  ") : ""), i === kids.length - 1)
        );
      }
    };
    walk(node);
    addLines(out);
  };

  cmds.cat = (args) => {
    if (!args[0]) return addLines([{ v: "cat: missing file operand", c: "err" }]);
    const abs = resolvePath(getCwd(), args[0]);
    const node = findNode(getRoot(), abs);
    if (!node)
      return addLines([{ v: `cat: ${args[0]}: no such file or directory`, c: "err" }]);
    if (node.type === "dir")
      return addLines([{ v: `cat: ${args[0]}: is a directory`, c: "err" }]);
    const text = readFile(node);
    addLines(text.split("\n").map((l) => ({ v: l })));
  };

  cmds.grep = (args) => {
    const [pat, file] = args;
    if (!pat || !file)
      return addLines([{ v: "usage: grep <pattern> <file>", c: "err" }]);
    const node = findNode(getRoot(), resolvePath(getCwd(), file));
    if (!node)
      return addLines([{ v: `grep: ${file}: no such file or directory`, c: "err" }]);
    const text = readFile(node);
    const re = new RegExp(pat, "i");
    const hits = text.split("\n").filter((l) => re.test(l));
    if (!hits.length) return addLines([{ v: "(no matches)", c: "muted" }]);
    addLines(hits.map((l) => ({ v: l.replace(re, (m) => "" + m + "") })));
  };

  cmds.echo = (args) => {
    const idx = args.indexOf(">");
    if (idx === -1) {
      addLines([{ v: args.join(" ") }]);
      return;
    }
    const text = args.slice(0, idx).join(" ");
    const file = args[idx + 1];
    if (!file) return addLines([{ v: "echo: missing file after >", c: "err" }]);
    const abs = resolvePath(getCwd(), file);
    const node = findNode(getRoot(), abs);
    if (!node)
      return addLines([{ v: `echo: ${file}: no such file or directory`, c: "err" }]);
    if (node.type === "dir")
      return addLines([{ v: `echo: ${file}: is a directory`, c: "err" }]);
    writeFile(node, text);
    addLines([{ v: `wrote ${text.length} bytes → ${abs}`, c: "cyan" }]);
  };

  cmds.rm = (args) => {
    const recursive = args.includes("-rf") || args.includes("-r");
    const targets = args.filter((a) => !a.startsWith("-"));
    if (!targets.length) return addLines([{ v: "rm: missing operand", c: "err" }]);
    if (targets.some((t) => /^\/?$/.test(t)) && recursive) {
      addLines([
        { v: "rm -rf / : permission denied (and: nice try)", c: "err" },
        { v: "this is a real portfolio. you cannot delete the universe.", c: "muted" },
      ]);
      return;
    }
    for (const t of targets) {
      const abs = resolvePath(getCwd(), t);
      const node = findNode(getRoot(), abs);
      if (!node) {
        addLines([{ v: `rm: ${t}: no such file or directory`, c: "err" }]);
        continue;
      }
      if (node.type === "dir" && !recursive) {
        addLines([{ v: `rm: ${t}: is a directory (use -rf)`, c: "err" }]);
        continue;
      }
      removeNode(node);
      addLines([{ v: `removed '${abs}'  ⟲ undo with: undo`, c: "cyan" }]);
      const el = node.el;
      const restore = () => {
        if (el) {
          el.style.display = "";
          el.style.opacity = "";
          el.style.filter = "";
          el.style.transform = "";
        }
      };
      if (!window.__rmUndo) window.__rmUndo = [];
      window.__rmUndo.push({ restore, path: abs });
      if (window.__rmUndo.length > 8) window.__rmUndo.shift();
    }
  };

  cmds.undo = () => {
    const u = (window.__rmUndo || []).pop();
    if (!u) return addLines([{ v: "nothing to undo", c: "muted" }]);
    u.restore();
    addLines([{ v: `restored '${u.path}'`, c: "cyan" }]);
  };

  cmds.mv = (args) => {
    const [src, dst] = args;
    if (!src || !dst) return addLines([{ v: "usage: mv <src> <dst>", c: "err" }]);
    const sNode = findNode(getRoot(), resolvePath(getCwd(), src));
    const dNode = findNode(getRoot(), resolvePath(getCwd(), dst));
    if (!sNode)
      return addLines([{ v: `mv: ${src}: no such file or directory`, c: "err" }]);
    if (!dNode)
      return addLines([{ v: `mv: ${dst}: no such file or directory`, c: "err" }]);
    moveNode(sNode, dNode);
    addLines([{ v: `moved '${src}' before '${dst}'`, c: "cyan" }]);
  };

  cmds.theme = (args) => {
    const [key, value] = args;
    if (!key || !value)
      return addLines([
        { v: "usage: theme <key> <value>   keys: accent, violet, bg", c: "err" },
      ]);
    setTheme(key, value);
    addLines([{ v: `theme.${key} = ${value}`, c: "cyan" }]);
  };

  cmds.whoami = () =>
    addLines([
      {
        v: "ernesto.cobos · cloud_architect+devsecops · uid=1000(operator) groups=1000(prod),27(sudo)",
      },
    ]);
  cmds.uptime = () =>
    addLines([{ v: "9 years, 4 months · load avg: 0.42, 0.51, 0.38" }]);
  cmds.date = () => addLines([{ v: new Date().toString() }]);
  cmds.hostname = () => addLines([{ v: "cobos.io" }]);

  cmds.history = () => {
    const h = getHistory();
    if (!h.length) return addLines([{ v: "(empty)", c: "muted" }]);
    addLines(h.map((c, i) => ({ v: String(i + 1).padStart(4) + "  " + c })));
  };

  cmds.clear = () => clearBuffer();

  cmds.tour = async () => {
    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
    const step = async (note: string, cmd?: string) => {
      if (note) addLines([{ v: "» " + note, c: "muted" }]);
      await sleep(500);
      if (cmd) {
        addLines([{ prompt: getCwd(), v: cmd }]);
        await sleep(300);
        const tokens = tokenize(cmd);
        const fn = cmds[tokens[0]];
        if (fn) await fn(tokens.slice(1));
        await sleep(700);
      }
    };
    addLines([{ v: "─ starting tour ───────────────────", c: "cyan" }]);
    await step("the portfolio dom is mapped as a filesystem", "tree /");
    await step("let's peek inside the about section", "cat about/headline.md");
    await step(
      "we can edit the dom — watch the page change",
      'echo "¡hola desde la terminal!" > about/bio.md'
    );
    await step("we can also remove nodes (with undo)", "rm work/idp.md");
    await step("and bring them back", "undo");
    await step("the theme is hot-swappable", "theme accent #ff6b9d");
    await step("back to default", "theme accent #00D4FF");
    addLines([
      { v: "─ tour complete ───────────────────", c: "cyan" },
      { v: "now you try. type 'help' for the full command list.", c: "muted" },
    ]);
  };

  return cmds;
}

/* ── Component ───────────────────────────────────────────── */
interface Props {
  rootSelector?: string;
  accent?: string;
  violet?: string;
}

export default function LiveTerminal({
  rootSelector = ".cobos-art",
  accent = "#00D4FF",
  violet = "#7C3AED",
}: Props) {
  const [open, setOpen] = useState(false);
  const [cwd, setCwd] = useState("/");
  const [buffer, setBuffer] = useState<BufferLine[]>([
    { v: "cobos.io · live console · v3.0 · dev only", c: "cyan" },
    { v: "" },
    {
      v: "this is a real terminal. it operates on the portfolio DOM as if it were",
      c: "muted",
    },
    {
      v: "a unix filesystem. you can read, edit, remove and reorder live elements.",
      c: "muted",
    },
    { v: "" },
    { v: "quick start — click any of these or type them:", c: "muted" },
    { v: "  $ tour", c: "cyan", suggest: "tour" },
    { v: "  $ ls", c: "cyan", suggest: "ls" },
    { v: "  $ cat about/bio.md", c: "cyan", suggest: "cat about/bio.md" },
    {
      v: '  $ echo "¡hola!" > about/bio.md',
      c: "cyan",
      suggest: 'echo "¡hola!" > about/bio.md',
    },
    { v: "  $ rm work/enkiflow.md", c: "cyan", suggest: "rm work/enkiflow.md" },
    {
      v: "  $ theme accent #ff6b9d",
      c: "cyan",
      suggest: "theme accent #ff6b9d",
    },
    { v: "" },
    {
      v: "type ",
      c: "muted",
      after: { v: "help", c: "cyan" },
      after2: {
        v: " for the full command list. backtick (`) toggles me. esc closes.",
        c: "muted",
      },
    },
    { v: "" },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const root = useMemo(() => {
    if (!open) return buildVFS(document.body);
    const host = document.querySelector(rootSelector);
    return buildVFS(host || document.body);
  }, [rootSelector, open]);

  const addLines = useCallback((lines: BufferLine | BufferLine[]) => {
    setBuffer((b) => [...b, ...(Array.isArray(lines) ? lines : [lines])]);
  }, []);

  const clearBuffer = useCallback(() => setBuffer([]), []);

  const setTheme = useCallback((key: string, value: string) => {
    const map: Record<string, string> = {
      accent: "--cyan",
      violet: "--violet",
      bg: "--bg",
    };
    const cssVar = map[key];
    if (cssVar) document.documentElement.style.setProperty(cssVar, value);
  }, []);

  const cmds = useMemo(
    () =>
      makeCommands({
        getRoot: () => root,
        getCwd: () => cwd,
        setCwd,
        addLines,
        setTheme,
        clearBuffer,
        getHistory: () => history,
      }),
    [root, cwd, addLines, setTheme, clearBuffer, history]
  );

  const run = useCallback(
    async (line: string) => {
      const trimmed = line.trim();
      addLines([{ prompt: cwd, v: trimmed }]);
      if (!trimmed) return;
      setHistory((h) => [...h, trimmed]);
      const tokens = tokenize(trimmed);
      const [name, ...args] = tokens;
      const fn = cmds[name];
      if (!fn) {
        addLines([{ v: `${name}: command not found · type 'help'`, c: "err" }]);
        return;
      }
      try {
        await fn(args);
      } catch (e) {
        addLines([{ v: String(e), c: "err" }]);
      }
    },
    [cmds, cwd, addLines]
  );

  // Backquote (`) toggles · Esc closes.
  // Use e.code (physical key) instead of e.key so it works on layouts where
  // backtick is a dead key (Spanish, Portuguese, French, etc.). e.code is
  // locale-independent.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName ?? "";
      const isBackquote = e.code === "Backquote" || e.key === "`";
      if (isBackquote && !["INPUT", "TEXTAREA"].includes(tag) && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [buffer, open]);

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      run(input);
      setInput("");
      setHistIdx(-1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      const next = histIdx < 0 ? history.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(next);
      setInput(history[next]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx < 0) return;
      const next = histIdx + 1;
      if (next >= history.length) {
        setHistIdx(-1);
        setInput("");
      } else {
        setHistIdx(next);
        setInput(history[next]);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const tokens = tokenize(input);
      if (!tokens.length) return;
      const last = tokens[tokens.length - 1];
      const slash = last.lastIndexOf("/");
      const base = slash >= 0 ? last.slice(0, slash + 1) : "";
      const stub = slash >= 0 ? last.slice(slash + 1) : last;
      const baseAbs = base ? resolvePath(cwd, base) : cwd;
      const node = findNode(root, baseAbs);
      if (!node || node.type !== "dir") return;
      const kids = listChildren(node).filter((k) => k.name.startsWith(stub));
      if (kids.length === 1) {
        const replacement = base + kids[0].name + (kids[0].type === "dir" ? "/" : " ");
        tokens[tokens.length - 1] = replacement;
        setInput(tokens.join(" "));
      } else if (kids.length > 1) {
        addLines([{ prompt: cwd, v: input }]);
        addLines([
          {
            v: kids
              .map((k) => k.name + (k.type === "dir" ? "/" : ""))
              .join("   "),
          },
        ]);
      }
    } else if (e.key === "l" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      clearBuffer();
    }
  };

  const openWithHelp = () => {
    setOpen(true);
    window.setTimeout(() => {
      run("help");
    }, 80);
  };

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const closedPillStyle: CSSProperties = {
    position: "fixed",
    bottom: 52,
    right: 16,
    zIndex: 55,
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontFamily: "var(--font-jetbrains-mono, ui-monospace)",
    fontSize: 11,
    color: accent,
    background: "rgba(6,6,10,.85)",
    border: `1px solid ${accent}66`,
    borderRadius: 8,
    padding: "8px 14px",
    boxShadow: `0 8px 24px rgba(0,0,0,.5), 0 0 24px ${accent}33`,
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
  };

  if (!open) {
    return (
      <div style={closedPillStyle}>
        <button
          type="button"
          onClick={openWithHelp}
          aria-label="Open terminal help"
          className="tap"
          style={{
            color: accent,
            background: "rgba(0,212,255,.08)",
            border: `1px solid ${accent}66`,
            borderRadius: 5,
            padding: "3px 8px",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 11,
            lineHeight: 1,
          }}
        >
          [?] help
        </button>
        {!isMobile && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open terminal console"
            className="tap"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: accent,
              background: "transparent",
              border: "none",
              padding: "2px 4px",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 11,
            }}
          >
            <span style={{ color: "var(--muted)" }}>open console</span>
            <span style={{ color: "var(--muted)" }}>·</span>
            <kbd
              aria-label="backquote key"
              style={{
                background: "rgba(255,255,255,.08)",
                border: "1px solid rgba(255,255,255,.18)",
                borderRadius: 4,
                padding: "1px 7px",
                color: "#F8FAFC",
                fontSize: 12,
                minWidth: 18,
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              `
            </kbd>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        left: 16,
        right: 16,
        top: 16,
        height: "min(480px, 80vh)",
        zIndex: 70,
        pointerEvents: "auto",
        background: "rgba(6,6,10,.95)",
        backdropFilter: "blur(12px) saturate(140%)",
        WebkitBackdropFilter: "blur(12px) saturate(140%)",
        border: `1px solid ${accent}55`,
        borderRadius: 12,
        boxShadow: `0 30px 80px rgba(0,0,0,.6), 0 0 80px ${accent}1A`,
        display: "flex",
        flexDirection: "column",
        animation: "lt-slide-in .25s ease-out",
        overflow: "hidden",
        maxWidth: 1280,
        margin: "0 auto",
      }}
    >
      <style>{`
        @keyframes lt-slide-in {
          from { transform: translateY(-20px); opacity: 0 }
          to { transform: translateY(0); opacity: 1 }
        }
        .lt-input { all: unset; flex: 1; color: #F8FAFC; font-family: var(--font-jetbrains-mono, ui-monospace); font-size: 13px; caret-color: ${accent}; }
        .lt-input::placeholder { color: rgba(255,255,255,.3); }
        .lt-line { font-family: var(--font-jetbrains-mono, ui-monospace); font-size: 13px; line-height: 1.7; white-space: pre-wrap; word-break: break-word; }
        .lt-c-fg { color: #F8FAFC; }
        .lt-c-muted { color: rgba(255,255,255,.45); }
        .lt-c-cyan { color: ${accent}; }
        .lt-c-err { color: #F87171; }
        .lt-suggest:hover { text-shadow: 0 0 8px ${accent}; }
      `}</style>

      {/* Chrome bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 16px",
          borderBottom: "1px solid rgba(255,255,255,.08)",
          background: "rgba(255,255,255,.02)",
        }}
      >
        <span style={{ width: 11, height: 11, borderRadius: 999, background: "#444" }} />
        <span style={{ width: 11, height: 11, borderRadius: 999, background: "#444" }} />
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close terminal"
          className="tap"
          style={{
            width: 11,
            height: 11,
            borderRadius: 999,
            background: accent,
            boxShadow: `0 0 10px ${accent}`,
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono, ui-monospace)",
            fontSize: 12,
            color: "rgba(255,255,255,.55)",
            marginLeft: 12,
          }}
        >
          ~/cobos.io · zsh · {cwd}
        </span>
        <span
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 12,
            alignItems: "center",
            fontFamily: "var(--font-jetbrains-mono, ui-monospace)",
            fontSize: 11,
            color: "rgba(255,255,255,.4)",
          }}
        >
          <button
            type="button"
            onClick={() => run("help")}
            aria-label="Show help"
            className="tap"
            style={{
              color: accent,
              background: "rgba(0,212,255,.06)",
              border: `1px solid ${accent}55`,
              borderRadius: 4,
              padding: "2px 8px",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 11,
              lineHeight: 1,
            }}
          >
            [?] help
          </button>
          <span>
            <kbd
              style={{
                background: "rgba(255,255,255,.06)",
                border: "1px solid rgba(255,255,255,.14)",
                borderRadius: 3,
                padding: "1px 5px",
                color: "#F8FAFC",
                fontSize: 10,
              }}
            >
              tab
            </kbd>{" "}
            autocomplete
          </span>
          <span>
            <kbd
              style={{
                background: "rgba(255,255,255,.06)",
                border: "1px solid rgba(255,255,255,.14)",
                borderRadius: 3,
                padding: "1px 5px",
                color: "#F8FAFC",
                fontSize: 10,
              }}
            >
              esc
            </kbd>{" "}
            close
          </span>
          <span style={{ color: accent }}>● live</span>
        </span>
      </div>

      {/* Buffer */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px" }}>
        {buffer.map((l, i) => (
          <div key={i} className="lt-line">
            {l.prompt != null ? (
              <>
                <span className="lt-c-cyan">{l.prompt} $</span>{" "}
                <span className="lt-c-fg">{l.v}</span>
              </>
            ) : l.suggest ? (
              <span
                onClick={() => {
                  setInput(l.suggest!);
                  inputRef.current?.focus();
                }}
                className={"lt-suggest lt-c-" + (l.c || "cyan")}
                style={{ cursor: "pointer", display: "inline-block" }}
                title="click to insert"
              >
                {l.v}
              </span>
            ) : (
              <span className={"lt-c-" + (l.c || "fg")}>
                {l.v && l.v.includes("")
                  ? l.v.split("").map((part, j) =>
                      j % 2 === 1 ? (
                        <mark
                          key={j}
                          style={{
                            background: `${accent}33`,
                            color: accent,
                            padding: "0 2px",
                            borderRadius: 2,
                          }}
                        >
                          {part}
                        </mark>
                      ) : (
                        <span key={j}>{part}</span>
                      )
                    )
                  : l.v}
                {l.after && (
                  <span className={"lt-c-" + (l.after.c || "fg")}>{l.after.v}</span>
                )}
                {l.after2 && (
                  <span className={"lt-c-" + (l.after2.c || "fg")}>{l.after2.v}</span>
                )}
              </span>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 18px",
          borderTop: "1px solid rgba(255,255,255,.08)",
          background: "rgba(0,0,0,.3)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono, ui-monospace)",
            fontSize: 13,
            color: accent,
          }}
        >
          {cwd} <span style={{ color: violet }}>$</span>
        </span>
        <input
          ref={inputRef}
          className="lt-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="try: tour · ls · cat about/bio.md · echo 'x' > about/bio.md · rm work/enkiflow.md"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>
    </div>
  );
}
