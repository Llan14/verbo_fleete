/** @type {import('next').NextConfig} */
const nextConfig = {
  //output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Permite las peticiones desde tu IP en modo desarrollo
  allowedDevOrigins: ['192.168.1.71', 'http://192.168.1.71:3000', 'localhost'],
};

module.exports = nextConfig;