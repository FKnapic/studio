import type {NextConfig} from 'next';
// import webpack from 'webpack'; // Temporarily remove webpack import

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
  // Temporarily remove custom webpack configuration
  // webpack: (config, { isServer, nextRuntime }) => {
  //   // Suppress warnings for specific modules/messages
  //   config.ignoreWarnings = [
  //     ...(config.ignoreWarnings || []),
  //     {
  //       module: /@opentelemetry\/sdk-node/,
  //       message: /Can't resolve '@opentelemetry\/exporter-jaeger'/,
  //     },
  //     {
  //       module: /handlebars/,
  //       message: /require\.extensions is not supported by webpack/,
  //     },
  //   ];

  //   // fsevents is a macOS-specific optional dependency of chokidar.
  //   // It's safe to ignore on other systems.
  //   if (!isServer) { // Only apply IgnorePlugin for client-side builds if needed, or remove if fsevents is not an issue
  //       config.plugins.push(
  //           new webpack.IgnorePlugin({
  //           resourceRegExp: /^fsevents$/,
  //           })
  //       );
  //   }
    
  //   return config;
  // },
};

export default nextConfig;
