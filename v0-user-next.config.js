/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["oaidalleapiprodscus.blob.core.windows.net", "cloud.leonardo.ai"],
  },
}

module.exports = nextConfig

