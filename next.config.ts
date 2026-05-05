import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Pin Turbopack's workspace root to this directory so it doesn't pick up
  // the parent repo's pnpm-lock.yaml (the worktree lives 2 levels deep
  // inside .claude/worktrees/...). Silences the "Detected additional
  // lockfiles" warning on every build.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
