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
      {
        module: /@opentelemetry\/sdk-node/, // Specific module causing the warning
        message: /Can't resolve '@opentelemetry\/exporter-jaeger'/, // Specific message to ignore
      },
      {
        module: /handlebars/, // Specific module causing the warning
        message: /require\.extensions is not supported by webpack/, // Specific message to ignore
      },
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
