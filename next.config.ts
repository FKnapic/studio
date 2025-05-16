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
  // Temporarily remove custom webpack configuration to diagnose Internal Server Error
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
  //   if (!isServer && nextRuntime === 'nodejs') { // Ensure nextRuntime check if using newer Next.js versions
  //       // Check if webpack is available if we were to use it
  //       // config.plugins.push(
  //       //     new webpack.IgnorePlugin({
  //       //     resourceRegExp: /^fsevents$/,
  //       //     })
  //       // );
  //   }
    
  //   return config;
  // },
};

export default nextConfig;
