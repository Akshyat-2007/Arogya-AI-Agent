/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['sequelize', 'sqlite3', 'pg', 'pg-hstore']
};

export default nextConfig;
