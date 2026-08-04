/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output para Docker/Railway — genera server.js mínimo
  output: 'standalone',

  // Imágenes externas permitidas
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'reline-vod-media.s3.us-east-2.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
    ],
  },
}

export default nextConfig
