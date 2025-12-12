import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { startPythonBackend } from "./start-python";
import http from "http";

const app: Express = express();
const server = http.createServer(app);

(async () => {
  // Try starting Python backend
  const pythonUp = await fetch("http://127.0.0.1:8000/health")
    .then(() => true)
    .catch(() => false);

  if (!pythonUp) startPythonBackend();

  app.use(
    cors({
      origin: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        "https://interex-home-loan-frontend.onrender.com",
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      exposedHeaders: ["set-cookie"],
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Register Routes (Proxy)
  await registerRoutes(app);

  // Setup Vite (only in dev)
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("SERVER ERROR:", err);
    res.status(err.status || 500).json({ message: err.message });
  });

  const PORT = Number(process.env.PORT || 5000);
  server.listen(PORT, "0.0.0.0", () => {
    log(`Server is running on http://localhost:${PORT}`);
  });
})();
