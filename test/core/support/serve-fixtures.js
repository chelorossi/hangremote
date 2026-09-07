import fs from "node:fs";
import http from "node:http";
import path from "node:path";

import { FIXTURE_PORT, FIXTURES_DIR } from "./paths.js";

const CONTENT_TYPES = { ".html": "text/html; charset=utf-8" };

const server = http.createServer((req, res) => {
  const filePath = path.join(FIXTURES_DIR, path.normalize(req.url).replace(/^(\.\.[/\\])+/, ""));

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404).end("not found");
      return;
    }
    const contentType = CONTENT_TYPES[path.extname(filePath)] ?? "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType }).end(data);
  });
});

server.listen(FIXTURE_PORT, "127.0.0.1", () => {
  // eslint-disable-next-line no-console
  console.log(`fixture server ready on http://127.0.0.1:${FIXTURE_PORT}`);
});
