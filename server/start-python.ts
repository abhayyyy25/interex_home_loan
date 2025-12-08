/**
 * Start Python FastAPI backend as a child process
 */
import { spawn, type ChildProcess } from "child_process";
import { log } from "./vite";

let pythonProcess: ChildProcess | null = null;

export function startPythonBackend(): void {
  log("[Python Backend] Starting FastAPI server on port 8000...");
  
  // Determine Python executable path based on OS
  const isWindows = process.platform === "win32";
  const pythonCmd = isWindows ? "venv\\Scripts\\python.exe" : "python3";
  
  // Start Python backend
  pythonProcess = spawn(pythonCmd, ["backend/run.py"], {
    stdio: ["ignore", "pipe", "pipe"],
    detached: false,
    shell: isWindows, // Use shell on Windows for better compatibility
  });

  pythonProcess.stdout?.on("data", (data) => {
    const message = data.toString().trim();
    if (message) {
      console.log(`[Python] ${message}`);
    }
  });

  pythonProcess.stderr?.on("data", (data) => {
    const message = data.toString().trim();
    if (message && !message.includes("WARNING") && !message.includes("INFO")) {
      console.error(`[Python Error] ${message}`);
    }
  });

  pythonProcess.on("close", (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[Python Backend] Process exited with code ${code}`);
    }
  });

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    if (pythonProcess) {
      log("[Python Backend] Shutting down...");
      pythonProcess.kill();
    }
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    if (pythonProcess) {
      pythonProcess.kill();
    }
    process.exit(0);
  });

  log("[Python Backend] Started successfully");
}

export function stopPythonBackend(): void {
  if (pythonProcess) {
    pythonProcess.kill();
    pythonProcess = null;
  }
}
