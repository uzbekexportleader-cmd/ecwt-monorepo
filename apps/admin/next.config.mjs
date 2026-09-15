/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Monorepo paketlari TypeScript emas, kompilyatsiya qilingan JS sifatida keladi
  transpilePackages: ['@ecwt/types', '@ecwt/config', '@ecwt/ui', '@ecwt/api-client', '@ecwt/validation'],
};

export default nextConfig;
