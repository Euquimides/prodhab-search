/**
 * @type {import('next').NextConfig}
 */

const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
    basePath: isProd ? '/prodhab-search' : '', // Set basePath for production
    // distDir: 'out/prodhab-search', // Custom output directory for local testing
    trailingSlash: true, // Ensure URLs end with a slash
    output: 'export',
    images: {
        unoptimized: true,
    },
    env: {
        BASE_PATH: isProd ? '/prodhab-search' : '', // Expose basePath as an environment variable
    },
};

export default nextConfig;