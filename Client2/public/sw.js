const Cache_Name = "canvaskit-0.41.0-v3";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (Event) => {
  Event.waitUntil(
    caches
      .keys()
      .then((Keys) =>
        Promise.all(
          Keys.filter((Key) => Key !== Cache_Name).map((Key) => caches.delete(Key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (Event) => {
  const Url = new URL(Event.request.url);
  if (!Url.pathname.startsWith("/canvaskit-") || !Url.pathname.endsWith(".wasm")) {
    return;
  }
  Event.respondWith(
    caches.open(Cache_Name).then(async (Cache) => {
      const Hit = await Cache.match(Url.pathname);
      if (Hit) return Hit;
      const Response_Network = await fetch(Event.request);
      const Content_Type = Response_Network.headers.get("content-type") || "";
      // Nooit de HTML-fallback cachen.
      if (
        Response_Network.status === 200 &&
        !Content_Type.includes("text/html")
      ) {
        await Cache.put(Url.pathname, Response_Network.clone());
      }
      return Response_Network;
    })
  );
});