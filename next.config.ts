/**
 * @type {import('next').NextConfig}
 */

const isProd = process.env.NODE_ENV === 'production';
const isCustomDomain = process.env.CUSTOM_DOMAIN === 'true';
const nextConfig: import('next').NextConfig = {
    trailingSlash: true,
    output: 'export',
    ...(isProd && !isCustomDomain && { distDir: 'out/privatasearch' }),
    images: {
        unoptimized: true,
    },
    basePath: isProd && !isCustomDomain ? '/privatasearch' : '',
};

export default nextConfig;