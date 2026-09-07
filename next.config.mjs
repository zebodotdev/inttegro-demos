/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produce a minimal, self-contained Node server for Docker and other
  // container platforms. OpenNext still owns the Cloudflare-specific build.
  output: 'standalone',
};

export default nextConfig;
