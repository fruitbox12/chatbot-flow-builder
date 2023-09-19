/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false, // Turn off React strict mode
    // TypeScript configuration
    typescript: {
      // Ignore build errors during development
      ignoreBuildErrors: true,
    },
    
    eslint: {
      // Ignore ESLint errors during development
      ignoreDuringBuilds: true,
    },
  };
  
module.exports = nextConfig
