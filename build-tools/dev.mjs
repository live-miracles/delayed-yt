import concurrently from "concurrently";
import { execa } from "execa";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const PORT = 3000;
const MAX_PORT_TRIES = 20;
const ROOT = resolve("public");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".ts": "text/plain; charset=utf-8",
};

// Plain static server. No live reload: just refresh the page by hand to pick up
// rebuilt files. `no-store` makes sure the refresh never serves a stale copy.
function createStaticServer() {
  const server = createServer(async (req, res) => {
    try {
      let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
      if (path.endsWith("/")) path += "index.html";
      const file = normalize(join(ROOT, path));
      if (!file.startsWith(ROOT)) {
        res.writeHead(403).end("Forbidden");
        return;
      }
      if (!(await stat(file)).isFile()) throw new Error("not a file");
      res.writeHead(200, {
        "Content-Type": TYPES[extname(file)] ?? "application/octet-stream",
        "Cache-Control": "no-store",
      });
      createReadStream(file).pipe(res);
    } catch {
      res.writeHead(404).end("Not found");
    }
  });
  return server;
}

// Try PORT, then PORT+1, PORT+2, ... if a port is already in use.
async function listen(server) {
  for (let port = PORT; port < PORT + MAX_PORT_TRIES; port++) {
    try {
      await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(port, () => {
          server.off("error", reject);
          resolve();
        });
      });
      return port;
    } catch (err) {
      if (err.code !== "EADDRINUSE") throw err;
      console.log(`[server] port ${port} is in use, trying ${port + 1}...`);
    }
  }
  throw new Error(`No free port found in ${PORT}-${PORT + MAX_PORT_TRIES - 1}`);
}

await execa("npm", ["run", "build"], { stdio: "inherit" });

const server = createStaticServer();
const port = await listen(server);
console.log(`[server] http://localhost:${port}  (refresh manually to update)`);

const { result } = concurrently(
  [
    {
      name: "ts",
      command: "tsc -p tsconfig.app.json --watch --preserveWatchOutput",
    },
    {
      name: "css",
      command:
        "tailwindcss -i ./public/input.css -o ./public/output.css --watch",
    },
  ],
  {
    killOthersOn: ["failure", "success"],
    prefix: "name",
  },
);

try {
  await result;
} finally {
  server.close();
}
