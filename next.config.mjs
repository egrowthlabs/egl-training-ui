/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignorar errores de ESLint durante el build en CI/Vercel
  // Los warnings de <img> y useEffect no deben bloquear el deploy
  eslint: {
    ignoreDuringBuilds: true,
  },

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
