// ALPEDIA — API utama. Dibaca Vercel sebagai satu serverless function (hemat kuota function Vercel).
// Semua request /api/* diarahkan kesini lewat vercel.json, dengan nama route di query ?r=...
import { Redis } from "@upstash/redis";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { obfuscate } from "../src/scraper/obfuscator.js";
import { deobfuscate } from "../src/scraper/deobfuscator.js";
import instagramDownloader from "../src/scraper/downloader_ig.js";
import ttdown from "../src/scraper/downloader_tt.js";
import ssyoutubeDownload from "../src/scraper/downloader_yt.js";
import videoenhancer from "../src/scraper/hdvideo.js";
import removeBg from "../src/scraper/removebg.js";
import tiktokSearchVideo from "../src/scraper/tiktoksearch.js";
import checkPhishing from "../src/scraper/scanurl.js";
import netronChat from "../src/scraper/netronai.js";

const db = Redis.fromEnv();
const JWT_SECRET = process.env.JWT_SECRET || "ganti-ini-di-env-vercel";
const ADMIN_PIN = process.env.ADMIN_PIN || "1234";

function userToken(username) {
  return jwt.sign({ u: username }, JWT_SECRET, { expiresIn: "7d" });
}
function adminToken() {
  return jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: "2h" });
}
function verifyToken(req) {
  try {
    const h = req.headers.authorization || "";
    return jwt.verify(h.startsWith("Bearer ") ? h.slice(7) : "", JWT_SECRET);
  } catch { return null; }
}
function randCode() { return Math.random().toString(36).slice(2, 10).toUpperCase(); }
function parseMaybe(x) { return typeof x === "string" ? JSON.parse(x) : x; }

async function logActivity(username, action) {
  const entry = JSON.stringify({ u: username, a: action, t: Date.now() });
  await db.lpush("alpedia:log", entry);
  await db.ltrim("alpedia:log", 0, 299);
  await db.lpush("alpedia:act:" + username, entry);
  await db.ltrim("alpedia:act:" + username, 0, 49);
}

export default async function handler(req, res) {
  const route = req.query.r || "";
  const body = req.body || {};
  const reply = (data, code = 200) => res.status(code).json(data);
  const me = verifyToken(req);

  try {
    // ---------- ADMIN LOGIN (pakai PIN, tidak butuh akun user) ----------
    if (route === "admin/login") {
      if (String(body.pin) !== String(ADMIN_PIN)) return reply({ e: "PIN salah" }, 401);
      return reply({ t: adminToken() });
    }

    // ---------- STATE PUBLIK (dipanggil tiap beberapa detik untuk simulasi realtime) ----------
    const maintenance = await db.get("alpedia:maintenance");
    if (route === "state") {
      let banned = false;
      if (me?.u) {
        await db.set("alpedia:online:" + me.u, 1, { ex: 30 }); // auto-expired "online" marker
        const u = await db.get("alpedia:user:" + me.u);
        banned = !u || !!u.banned;
      }
      const bc = await db.get("alpedia:broadcast");
      return reply({ maintenance: !!maintenance, broadcast: bc, banned });
    }

    // ---------- ADMIN PANEL ----------
    if (route.startsWith("admin/")) {
      const adminMe = verifyToken(req);
      if (!adminMe?.admin) return reply({ e: "Unauthorized, silakan masukkan PIN lagi" }, 401);
      const action = route.slice("admin/".length);

      if (action === "users") {
        const usernames = await db.smembers("alpedia:users");
        const onlineKeys = await db.keys("alpedia:online:*");
        const online = onlineKeys.map((k) => k.replace("alpedia:online:", ""));
        const users = (await Promise.all(usernames.map((n) => db.get("alpedia:user:" + n)))).filter(Boolean);
        return reply({
          onlineCount: online.length,
          users: users.map((u) => ({ username: u.username, phone: u.phone, banned: !!u.banned, online: online.includes(u.username) })),
        });
      }
      if (action === "ban" || action === "unban") {
        const u = await db.get("alpedia:user:" + body.username);
        if (u) { u.banned = action === "ban"; await db.set("alpedia:user:" + body.username, u); }
        return reply({ ok: true });
      }
      if (action === "broadcast") {
        await db.set("alpedia:broadcast", { id: Date.now(), text: String(body.text || "").slice(0, 500) });
        return reply({ ok: true });
      }
      if (action === "maintenance-on") { await db.set("alpedia:maintenance", true); return reply({ ok: true }); }
      if (action === "maintenance-off") { await db.del("alpedia:maintenance"); return reply({ ok: true }); }
      if (action === "chats") return reply({ items: (await db.lrange("alpedia:chat", 0, 99)).map(parseMaybe) });
      if (action === "logs") return reply({ items: (await db.lrange("alpedia:log", 0, 99)).map(parseMaybe) });
      return reply({ e: "Aksi admin tidak dikenal" }, 404);
    }

    // ---------- MAINTENANCE GATE untuk semua route user biasa ----------
    if (maintenance) return reply({ e: "ALPEDIA sedang maintenance" }, 503);

    // ---------- AUTH ----------
    if (route === "auth/register") {
      const { username, password, phone } = body;
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(username || "")) return reply({ e: "Username 3-20 karakter, huruf/angka/underscore" }, 400);
      if (!password || password.length < 6) return reply({ e: "Password minimal 6 karakter" }, 400);
      if (await db.get("alpedia:user:" + username)) return reply({ e: "Username sudah dipakai" }, 400);
      const recoveryCode = randCode();
      const record = {
        username, phone: String(phone || "").slice(0, 20),
        passwordHash: await bcrypt.hash(password, 8),
        recoveryHash: await bcrypt.hash(recoveryCode, 8),
        banned: false, createdAt: Date.now(),
      };
      await db.set("alpedia:user:" + username, record);
      await db.sadd("alpedia:users", username);
      await logActivity(username, "register");
      return reply({ token: userToken(username), recoveryCode });
    }

    if (route === "auth/login") {
      const u = await db.get("alpedia:user:" + body.username);
      if (!u || !(await bcrypt.compare(body.password || "", u.passwordHash))) return reply({ e: "Username atau password salah" }, 400);
      if (u.banned) return reply({ e: "Akun kamu dibanned oleh admin" }, 403);
      await logActivity(body.username, "login");
      return reply({ token: userToken(body.username) });
    }

    if (route === "auth/forgot") {
      const u = await db.get("alpedia:user:" + body.username);
      if (!u || !(await bcrypt.compare(body.recoveryCode || "", u.recoveryHash))) return reply({ e: "Kode recovery salah" }, 400);
      if (!body.newPassword || body.newPassword.length < 6) return reply({ e: "Password baru minimal 6 karakter" }, 400);
      u.passwordHash = await bcrypt.hash(body.newPassword, 8);
      await db.set("alpedia:user:" + body.username, u);
      await logActivity(body.username, "reset password");
      return reply({ ok: true });
    }

    // ---------- SEMUA ROUTE DI BAWAH INI WAJIB LOGIN ----------
    if (!me?.u) return reply({ e: "Silakan login terlebih dahulu" }, 401);
    const current = await db.get("alpedia:user:" + me.u);
    if (!current || current.banned) return reply({ e: "Akun tidak valid atau dibanned" }, 403);

    if (route === "auth/logout") { await db.del("alpedia:online:" + me.u); await logActivity(me.u, "logout"); return reply({ ok: true }); }

    if (route === "profil/me") {
      const activity = (await db.lrange("alpedia:act:" + me.u, 0, 19)).map(parseMaybe);
      return reply({ username: current.username, phone: current.phone, createdAt: current.createdAt, activity });
    }
    if (route === "profil/update") {
      current.phone = String(body.phone || current.phone).slice(0, 20);
      await db.set("alpedia:user:" + me.u, current);
      await logActivity(me.u, "update profil");
      return reply({ ok: true });
    }
    if (route === "profil/password") {
      if (!(await bcrypt.compare(body.oldPassword || "", current.passwordHash))) return reply({ e: "Password lama salah" }, 400);
      if (!body.newPassword || body.newPassword.length < 6) return reply({ e: "Password baru minimal 6 karakter" }, 400);
      current.passwordHash = await bcrypt.hash(body.newPassword, 8);
      await db.set("alpedia:user:" + me.u, current);
      await logActivity(me.u, "ganti password");
      return reply({ ok: true });
    }

    // ---------- 1. OBFUSCATOR ----------
    if (route === "tools/obfuscate") {
      await logActivity(me.u, "pakai Obfuscator (" + body.lang + ")");
      return reply({ result: obfuscate(body.lang, body.source, !!body.protect) });
    }

    // ---------- 2. DEOBFUSCATOR ----------
    if (route === "tools/deobfuscate") {
      await logActivity(me.u, "pakai Deobfuscator (" + body.lang + ")");
      return reply({ result: deobfuscate(body.lang, body.source) });
    }

    // ---------- 3. DOWNLOADER SOSMED (deteksi otomatis IG / TikTok / YouTube) ----------
    if (route === "tools/downloader") {
      const url = String(body.url || "").trim();
      await logActivity(me.u, "pakai Downloader Sosmed");
      if (/instagram\.com/i.test(url)) {
        const d = await instagramDownloader(url);
        return reply({ platform: "instagram", title: d.title, thumbnail: d.thumbnail, items: d.media.map((m, i) => ({ label: (m.type === "video" ? "MP4" : "Foto") + " " + (i + 1), url: m.url })) });
      }
      if (/tiktok\.com/i.test(url)) {
        const d = await ttdown(url);
        return reply({ platform: "tiktok", title: d.title, thumbnail: d.cover || "", items: d.downloads.map((x) => ({ label: x.label, url: x.url })) });
      }
      if (/youtube\.com|youtu\.be/i.test(url)) {
        const d = await ssyoutubeDownload(url);
        return reply({ platform: "youtube", title: d.meta?.title || "", thumbnail: d.meta?.thumbnail || "", items: d.downloads.map((x) => ({ label: (x.quality || "") + " " + (x.format || "") + (x.audio ? " (audio)" : ""), url: x.url })) });
      }
      return reply({ e: "Link tidak dikenali. Dukungan saat ini: Instagram, TikTok, YouTube." }, 400);
    }

    // ---------- 4. HD VIDEO ----------
    if (route === "tools/hdvideo") {
      await logActivity(me.u, "pakai HD Video");
      const result = await videoenhancer(body.base64, body.filename);
      return reply({ resultUrl: result.resultUrl });
    }

    // ---------- 5. REMOVE BG ----------
    if (route === "tools/removebg") {
      await logActivity(me.u, "pakai Remove BG");
      const outBase64 = await removeBg(body.base64, body.filename);
      return reply({ image: "data:image/png;base64," + outBase64 });
    }

    // ---------- 6. TIKTOK SEARCH ----------
    if (route === "tools/tiktoksearch") {
      await logActivity(me.u, "pakai TikTok Search");
      const items = await tiktokSearchVideo(body.query || "");
      return reply({ items: items.slice(0, 20).map((i) => ({ title: i.title, cover: i.cover, link: i.link, author: i.author.nickname, plays: i.stats.plays })) });
    }

    // ---------- 7. SCANNING URL ----------
    if (route === "tools/scanurl") {
      await logActivity(me.u, "pakai Scanning URL");
      return reply({ result: await checkPhishing(body.url) });
    }

    // ---------- 8. NETRON AI ----------
    if (route === "tools/netronai") {
      await logActivity(me.u, "chat dengan Netron AI");
      const answer = await netronChat(body.message, body.history || [], body.file || null);
      await db.lpush("alpedia:chat", JSON.stringify({ u: me.u, q: body.message, a: answer, t: Date.now() }));
      await db.ltrim("alpedia:chat", 0, 299);
      return reply({ answer });
    }

    return reply({ e: "Route tidak ditemukan" }, 404);
  } catch (error) {
    const msg = error?.response?.data?.error?.message || error?.response?.data?.message || error?.message || String(error);
    return reply({ e: msg }, 400);
  }
}
