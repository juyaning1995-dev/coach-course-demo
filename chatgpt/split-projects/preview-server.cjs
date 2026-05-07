const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const host = "127.0.0.1";
const port = 8765;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const server = http.createServer((req, res) => {
  const urlPath = req.url === "/" ? "/index.html" : req.url;
  const safePath = path.normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(root, safePath);

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (statErr, stat) => {
    let target = filePath;
    if (!statErr && stat.isDirectory()) {
      target = path.join(filePath, "index.html");
    }

    fs.readFile(target, (readErr, data) => {
      if (readErr) {
        res.writeHead(readErr.code === "ENOENT" ? 404 : 500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(readErr.code === "ENOENT" ? "Not found" : "Server error");
        return;
      }
      const ext = path.extname(target).toLowerCase();
      res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
      res.end(data);
    });
  });
});

server.listen(port, host, () => {
  console.log(`Preview server running at http://${host}:${port}/`);
  console.log(`  Coach app: http://${host}:${port}/coach-app/`);
  console.log(`  User app:  http://${host}:${port}/user-app/`);
});
