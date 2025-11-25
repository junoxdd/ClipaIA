/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure we can mix static export with API routes if using Next.js properly
  // For this hybrid setup, Vercel handles the python API via 'api/' folder automatically.
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig