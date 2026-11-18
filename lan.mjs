import http from "node:http";
import { networkInterfaces } from "node:os";
import { readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import worker from "./dist/server/index.js";

const root = new URL("./", import.meta.url);
const db = new DatabaseSync(
  process.env.GRUFT_DB_PATH || fileURLToPath(new URL("gruft.sqlite", root)),
);
db.exec(
  await readFile(new URL("drizzle/0000_rooms.sql", root), "utf8").then((sql) =>
    sql
      .replace("CREATE TABLE ", "CREATE TABLE IF NOT EXISTS ")
      .replace("CREATE INDEX ", "CREATE INDEX IF NOT EXISTS "),
  ),
);
const DB = {
  prepare(sql) {
    const statement = db.prepare(sql);
    return {
      bind(...data) {
        return {
          first: () => statement.get(...data),
          run: () => ({ meta: statement.run(...data) }),
        };
      },
    };
  },
};

const args = process.argv.slice(2);
const flag = (name) =>
  args.includes(name) ? args[args.indexOf(name) + 1] : null;
const port = Number(process.env.PORT || flag("--port") || 8788);
const host = flag("--host") || "0.0.0.0";
const server = http.createServer(async (req, res) => {
  try {
    const chunks = [];
    let length = 0;
    for await (const chunk of req) {
      length += chunk.length;
      if (length > 2048) {
        res.writeHead(413).end();
        return;
      }
      chunks.push(chunk);
    }
    const input = { method: req.method, headers: req.headers };
    if (chunks.length) input.body = Buffer.concat(chunks);
    const result = await worker.fetch(
      new Request("http://localhost" + req.url, input),
      { DB },
    );
    res.writeHead(result.status, Object.fromEntries(result.headers));
    res.end(Buffer.from(await result.arrayBuffer()));
  } catch (error) {
    console.error(error.message);
    res.writeHead(500).end("Die Gruft antwortet gleich wieder.");
  }
});
server.listen(port, host, () => {
  console.log(
    "Die Gruft ist bereit. Öffne auf dem Tablet eine der folgenden WLAN-Adressen.",
  );
  let interfaces = {};
  if (host === "0.0.0.0")
    try {
      interfaces = networkInterfaces();
    } catch {}
  for (const entries of Object.values(interfaces)) {
    for (const entry of entries ?? [])
      if (entry.family === "IPv4" && !entry.internal)
        console.log("  http://" + entry.address + ":" + port);
  }
  console.log("Auf diesem Computer: http://localhost:" + port);
});
