import handler from "./api/index.js";
import http from "http";

const PORT = process.env.PORT || 3000;

http.createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const bodyRaw = Buffer.concat(chunks).toString("utf-8");
  let body = {};
  try { body = bodyRaw ? JSON.parse(bodyRaw) : {}; } catch {}
  const u = new URL(req.url, "http://localhost");
  const fakeReq = { method: req.method, headers: req.headers, body, query: Object.fromEntries(u.searchParams) };
  const fakeRes = {
    _status: 200,
    status(c) { this._status = c; return this; },
    json(d) { res.writeHead(this._status, { "Content-Type": "application/json" }); res.end(JSON.stringify(d)); },
  };
  try { await handler(fakeReq, fakeRes); }
  catch (e) { res.writeHead(500, { "Content-Type": "application/json" }); res.end(JSON.stringify({ e: String(e) })); }
}).listen(PORT, () => console.log("ALPEDIA lokal jalan di http://localhost:" + PORT));
