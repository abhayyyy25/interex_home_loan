import { type Express } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import type { Request, Response } from "express";
import type { IncomingMessage } from "http";

const PYTHON_BACKEND_URL = "http://localhost:8000";

export function setupPythonProxy(app: Express) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: PYTHON_BACKEND_URL,
      changeOrigin: true,
      ws: false,
      pathRewrite: { "^/api": "" },

      onProxyReq: (proxyReq, req: Request, res: Response) => {
        const cookie = req.headers.cookie;
        if (cookie) {
          proxyReq.setHeader("Cookie", cookie);
          console.log("[Proxy] Forwarding Cookie:", cookie);
        } else {
          console.log("[Proxy] No cookies in request");
        }

        // Body fix
        if (
          ["POST", "PUT", "PATCH"].includes(req.method) &&
          req.body &&
          Object.keys(req.body).length > 0
        ) {
          const body = JSON.stringify(req.body);
          proxyReq.setHeader("Content-Type", "application/json");
          proxyReq.setHeader("Content-Length", Buffer.byteLength(body));
          proxyReq.write(body);
        }
      },

      onProxyRes: (proxyRes, req: Request, res: Response) => {
        const setCookieHeader = proxyRes.headers["set-cookie"];
        if (setCookieHeader) {
          res.setHeader("set-cookie", setCookieHeader);
          console.log("[Proxy] Passing Set-Cookie from backend");
        }
      },

      onError: (err, req, res) => {
        console.error("[Proxy Error]", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Proxy error", details: err.message }));
      }
    })
  );

  console.log("[Proxy] All /api requests → Python backend");
}
