// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withNativewind } = require("nativewind/metro");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// --- canvaskit wasm comprimeren in dev (Codespaces-tunnel is traag) ---
const Wasm_File_Name = "canvaskit-0.41.0.wasm";
const Wasm_Path = path.join(__dirname, "public", Wasm_File_Name);

// Gecomprimeerde versies worden één keer berekend en onthouden.
const Cache = {};

const Get_Compressed = (Encoding) => {
  if (Cache[Encoding]) return Cache[Encoding];
  const Source = fs.readFileSync(Wasm_Path);
  Cache[Encoding] =
    Encoding === "br"
      ? zlib.brotliCompressSync(Source, {
          params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9 },
        })
      : zlib.gzipSync(Source, { level: 9 });
  return Cache[Encoding];
};

const Previous = config.server?.enhanceMiddleware;

config.server = {
  ...config.server,
  enhanceMiddleware: (Middleware, Server) => {
    const Base = Previous ? Previous(Middleware, Server) : Middleware;
    return (Request, Response, Next) => {
      const Url = (Request.url || "").split("?")[0];

      // CanvasKit wasm: gecomprimeerd en lang gecachet.
      if (Url.endsWith("/" + Wasm_File_Name) && fs.existsSync(Wasm_Path)) {
        const Accepted = String(Request.headers["accept-encoding"] || "");
        const Encoding = Accepted.includes("br")
          ? "br"
          : Accepted.includes("gzip")
          ? "gzip"
          : null;
        if (Encoding) {
          const Body = Get_Compressed(Encoding);
          Response.setHeader("Content-Type", "application/wasm");
          Response.setHeader("Content-Encoding", Encoding);
          Response.setHeader("Content-Length", Body.length);
          Response.setHeader("Cache-Control", "public, max-age=86400");
          Response.setHeader("Vary", "Accept-Encoding");
          Response.end(Body);
          return;
        }
      }

      // Alleen dev: Fluid-chunk kort laten cachen zodat reloads niet elke
      // keer ~2s kosten. Na een wijziging in Fluid.tsx: hard herladen
      // (Ctrl + Shift + R), anders zie je tot 2 minuten de oude versie.
      if (Url.endsWith("/Fluid.bundle")) {
        Response.setHeader("Cache-Control", "private, max-age=120");
      }

      return Base(Request, Response, Next);
    };
  },
};

module.exports = withNativewind(config);