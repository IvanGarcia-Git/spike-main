/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // output: 'standalone', // Comentado para desarrollo local
  // Asegúrate de que la API_URL esté configurada correctamente en Vercel
  env: {
    API_URL: process.env.API_URL,
  }
};

export default nextConfig;
