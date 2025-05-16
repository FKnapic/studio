import type {NextConfig} from 'next';
import webpack from 'webpack'; // Import webpack

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
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
      // Handlebars require.extensions warning
      {
        module: /node_modules\/handlebars\//,
        message: /require\.extensions/,
      },
    ];

    // Prevent webpack from trying to resolve these optional dependencies,
    // which can cause "Module not found" warnings.
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /@opentelemetry\/exporter-jaeger/,
      })
    );

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
