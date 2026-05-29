/**
 * coi-serviceworker — Dual-mode Cross-Origin Isolation shim
 * Adapted from https://github.com/gzuidhof/coi-serviceworker (MIT)
 *
 * When loaded as a <script>, it registers this same file as a Service Worker.
 * When running inside the Service Worker context, it intercepts fetches and
 * adds COOP + COEP headers so SharedArrayBuffer (FFmpeg.wasm) works on hosts
 * that don't support custom HTTP headers (e.g. GitHub Pages).
 */

/* ── Service Worker context ──────────────────────────────────────────────── */
if (typeof window === "undefined") {
  self.addEventListener("install", () => self.skipWaiting());

  self.addEventListener("activate", (e) =>
    e.waitUntil(self.clients.claim())
  );

  self.addEventListener("fetch", (e) => {
    const req = e.request;
    // Passthrough for opaque no-CORS cached requests to avoid errors.
    if (req.cache === "only-if-cached" && req.mode !== "same-origin") return;

    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.status === 0) return res;
          const headers = new Headers(res.headers);
          headers.set("Cross-Origin-Opener-Policy", "same-origin");
          headers.set("Cross-Origin-Embedder-Policy", "require-corp");
          headers.set("Cross-Origin-Resource-Policy", "cross-origin");
          return new Response(res.body, {
            status: res.status,
            statusText: res.statusText,
            headers,
          });
        })
        .catch((err) => { throw err; })
    );
  });

/* ── Page context: register this file as a Service Worker ───────────────── */
} else {
  (() => {
    // Already cross-origin isolated — nothing to do.
    if (self.crossOriginIsolated) return;

    if (!("serviceWorker" in navigator)) {
      console.warn("[coi-sw] Service Workers not supported. FFmpeg.wasm may fail.");
      return;
    }

    // Derive path relative to current base so it works under any basePath.
    const swPath =
      document.currentScript
        ? document.currentScript.src
        : location.origin + "/coi-serviceworker.js";

    // Scope must be at or below the SW script path (e.g. /easyvideo/ on GitHub Pages).
    const scope = swPath.replace(/[^/]+$/, "");
    navigator.serviceWorker
      .register(swPath, { scope })
      .then((reg) => {
        function reload() {
          if (!sessionStorage.getItem("coi-reload")) {
            sessionStorage.setItem("coi-reload", "1");
            location.reload();
          }
        }
        const sw = reg.installing || reg.waiting;
        if (sw) {
          sw.addEventListener("statechange", function () {
            if (this.state === "activated") reload();
          });
        } else if (reg.active) {
          reload();
        }
      })
      .catch((err) => console.warn("[coi-sw] Registration failed:", err));
  })();
}
