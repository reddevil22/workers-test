import { generateSW } from "workbox-build";

const buildSw = async () => {
  try {
    const swDest = "dist/sw.js";
    const { count, size, warnings } = await generateSW({
      swDest,
      globDirectory: "dist",
      globPatterns: ["**/*.{html,js,css,png,svg,json,woff2,woff}"],
      skipWaiting: true,
      clientsClaim: true,
      runtimeCaching: [
        {
          urlPattern: /\/*/, // cache navigation requests
          handler: "NetworkFirst",
          options: {
            cacheName: "html-cache",
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 24 * 60 * 60, // 1 day
            },
          },
        },
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
          handler: "CacheFirst",
          options: {
            cacheName: "image-cache",
            expiration: {
              maxEntries: 60,
              maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
            },
          },
        },
        {
          urlPattern: /\.(?:js|css)$/,
          handler: "StaleWhileRevalidate",
          options: {
            cacheName: "static-resources",
          },
        },
      ],
    });

    if (warnings && warnings.length) {
      console.warn(
        "Workbox warnings while generating service worker:",
        warnings
      );
    }

    console.log(
      `Generated ${swDest}, which will precache ${count} files, totaling ${size} bytes.`
    );
  } catch (err) {
    console.error("Failed to generate service worker with Workbox:", err);
    process.exit(1);
  }
};

buildSw();
