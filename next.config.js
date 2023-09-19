/** @type {import('next').NextConfig} */
const path = require("path"); // Import the 'path' module

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
      webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(__dirname);
    return config;
  },
  };
  
module.exports = nextConfig
