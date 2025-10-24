import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import { App } from "./App";
import { queryClient } from "./queryClient";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);

// Use workbox-window for controlled service worker registration and updates
if (import.meta.env.PROD && typeof window !== "undefined") {
  // lazy-import workbox-window to avoid importing it in dev bundles
  import("workbox-window")
    .then(({ Workbox }) => {
      const wb = new Workbox("/sw.js");

      wb.addEventListener("waiting", () => {
        // When there's an updated SW waiting, you can notify the user
        console.log("A new service worker is waiting.");
        // Auto-skip waiting (optional):
        // wb.messageSW({type: 'SKIP_WAITING'});
      });

      wb.addEventListener("activated", (event) => {
        if (event.isUpdate) {
          console.log("Service worker activated after an update.");
        } else {
          console.log("Service worker activated for the first time.");
        }
      });

      wb.register()
        .then((registration) => {
          console.log("Workbox service worker registered:", registration);
        })
        .catch((err) => {
          console.warn("Workbox service worker registration failed:", err);
        });
    })
    .catch((err) => {
      console.warn("Failed to load workbox-window:", err);
    });
}
