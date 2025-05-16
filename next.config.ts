import type {NextConfig} from 'next';
import webpack from 'webpack'; // Import webpack

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer, nextRuntime }) => {
    // Suppress warnings for specific modules/messages
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      // Add any other warnings you want to ignore here if necessary
    ];

    // fsevents is a macOS-specific optional dependency of chokidar.
    // It's safe to ignore on other systems.
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^fsevents$/,
      })
    );

    return config;
  },
};

export default nextConfig;
