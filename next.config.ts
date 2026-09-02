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
  images: {
    remotePatterns: [{ protocol: "https", hostname: "avatars.githubusercontent.com" }],
  },
  async redirects() {
    return [
      // El anteproyecto de la mesa vivió antes en la raíz (/mesa-tarzzo
      // primero, /mesa-terrazo después). Ahora cuelga del área de
      // cliente para no abrir un subdominio: los enlaces viejos siguen
      // funcionando en vez de morir en un 404.
      { source: "/mesa-tarzzo", destination: "/customer/tarzzo/mesa", permanent: true },
      { source: "/mesa-terrazo", destination: "/customer/tarzzo/mesa", permanent: true },
    ];
  },
};

export default nextConfig;
