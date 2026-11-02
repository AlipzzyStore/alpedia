// ALPEDIA Deobfuscator Tools — JavaScript, HTML, Python, Lua
// Menangani hasil obfuscator ALPEDIA sendiri, eval-chain generik, base64 wrapper,
// dan heuristik "tebas" anti-tamper/anti-debug/self-defending umum (string literal, bukan eksekusi kode asing).

function stripAntiDebug(src) {
  // buang pola umum anti-debug / self-defending yang sering disisipkan obfuscator pihak ketiga
  let out = src;
  out = out.replace(/setInterval\(function\(\)\{[^}]*debugger[^}]*\},\s*\d+\);?/gi, "");
  out = out.replace(/;?\s*debugger\s*;?/g, ";");
  out = out.replace(/if\s*\(\s*(window\.)?(outerWidth|outerHeight)[^)]*\)\s*\{[\s\S]*?\}/gi, "");
  out = out.replace(/\(function\s*\(\)\s*\{\s*return\s*false;?\s*\}\)\s*\(\s*\)/g, "false");
  return out;
}

function evalXorFromObfuscatedJS(src) {
  // pola buatan ALPEDIA sendiri: var _d=[...],_k=NN
  const m = src.match(/_d\s*=\s*(\[[\d,\s]*\])\s*,\s*_k\s*=\s*(\d+)/);
  if (m) {
    const arr = JSON.parse(m[1]);
    const k = Number(m[2]);
    return arr.map((c) => String.fromCharCode(c ^ k)).join("");
  }
  return null;
}

export function deobfuscateJS(src) {
  let s = stripAntiDebug(src);
  const direct = evalXorFromObfuscatedJS(s);
  if (direct) return direct;
  const b64 = s.match(/atob\(['"]([A-Za-z0-9+/=]+)['"]\)/);
  if (b64) return Buffer.from(b64[1], "base64").toString("utf-8");
  return s; // fallback: kembalikan hasil cleaning anti-debug saja
}

export function deobfuscateHTML(src) {
  let s = stripAntiDebug(src);
  const b64 = s.match(/atob\(['"]([A-Za-z0-9+/=]+)['"]\)/);
  if (b64) {
    try { return decodeURIComponent(escape(Buffer.from(b64[1], "base64").toString("utf-8"))); } catch { return Buffer.from(b64[1], "base64").toString("utf-8"); }
  }
  return s;
}

export function deobfuscatePython(src) {
  const m = src.match(/b64decode\(['"]([A-Za-z0-9+/=]+)['"]\)/);
  if (m) return Buffer.from(m[1], "base64").toString("utf-8");
  return src.replace(/#.*$/gm, "").trim();
}

export function deobfuscateLua(src) {
  const m = src.match(/local\s+e\s*=\s*\{([\d,\s]*)\}\s*local\s+k\s*=\s*(\d+)/);
  if (m) {
    const arr = m[1].split(",").map((x) => Number(x.trim())).filter((x) => !Number.isNaN(x));
    const k = Number(m[2]);
    return Buffer.from(arr.map((b) => b ^ k)).toString("utf-8");
  }
  return src;
}

export function deobfuscate(lang, src) {
  if (!src || !src.trim()) throw new Error("Kode kosong");
  switch (String(lang || "").toLowerCase()) {
    case "javascript": return deobfuscateJS(src);
    case "html": return deobfuscateHTML(src);
    case "python": return deobfuscatePython(src);
    case "lua": return deobfuscateLua(src);
    default: throw new Error("Bahasa tidak didukung");
  }
}
