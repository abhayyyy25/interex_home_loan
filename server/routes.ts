import type { Express } from "express";
import { setupPythonProxy } from "./python-proxy";

export async function registerRoutes(app: Express): Promise<void> {
  // Proxy all /api/* requests to Python FastAPI backend
  setupPythonProxy(app);

  console.log("[Routes] Python Proxy mounted at /api");
}
