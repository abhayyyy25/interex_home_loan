import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupPythonProxy } from "./python-proxy";

export async function registerRoutes(app: Express): Promise<Server> {
  // Proxy all /api/* requests to Python FastAPI backend
  setupPythonProxy(app);

  const httpServer = createServer(app);

  return httpServer;
}
