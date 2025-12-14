/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  output: 'standalone',
  transpilePackages: ['@react-pdf/renderer'],
  env: {
    API_URL: process.env.API_URL,
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    return {
      // beforeFiles: se evalúan antes de que Next.js verifique si hay archivos/rutas
      beforeFiles: [],
      // afterFiles: se evalúan después de verificar archivos, pero antes de rutas dinámicas
      afterFiles: [],
      // fallback: solo se aplica si no hay archivo/ruta que coincida
      fallback: [
        // Solo redirigir al backend si no existe una API route en el frontend
        {
          source: '/api/:path*',
          destination: `${backendUrl}/:path*`,
        },
      ],
    };
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
