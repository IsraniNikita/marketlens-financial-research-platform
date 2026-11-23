/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_PAGES === 'true'

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [],
  ...(isGitHubPages && {
    output: 'export',
    basePath: '/marketlens-financial-research-platform',
    trailingSlash: true,
  }),
  images: {
    unoptimized: isGitHubPages,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
}

module.exports = nextConfig
