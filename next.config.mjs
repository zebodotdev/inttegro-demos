/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produce a minimal, self-contained Node server for Docker and other
  // container platforms. OpenNext still owns the Cloudflare-specific build.
  output: 'standalone',
  // The demo suite has its own root lockfile for the shared browser bundle.
  // Keep Turbopack scoped to this application instead of inferring the suite
  // root from that sibling lockfile.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
