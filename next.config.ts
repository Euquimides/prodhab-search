/**
 * @type {import('next').NextConfig}
 */

const nextConfig: import('next').NextConfig = {
    trailingSlash: true,
    output: 'export',
    images: {
        unoptimized: true,
    },
};

export default nextConfig;
