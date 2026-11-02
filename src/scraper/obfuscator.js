// ALPEDIA Obfuscator Tools — JavaScript, HTML, Python, Lua
// "protect" (khusus JS & Lua) menambah integrity-check sederhana: jika source di-tamper, output tidak akan jalan normal.

function xorKey() { return 13 + Math.floor(Math.random() * 230); }

function toCharArray(str) {
  return [...str].map((c) => c.charCodeAt(0));
}

export function obfuscateJS(src, protect = false) {
  const k = xorKey();
  const enc = toCharArray(src).map((c) => c ^ k);
  const checksum = enc.reduce((a, b) => (a + b) % 65536, 0);
  const guard = protect
    ? `if((${JSON.stringify(enc)}.reduce((a,b)=>(a+b)%65536,0))!==${checksum})return;`
    : "";
  return `(function(){var _d=${JSON.stringify(enc)},_k=${k},_s='';${guard}for(var _i=0;_i<_d.length;_i++){_s+=String.fromCharCode(_d[_i]^_k)}(0,eval)(_s)})();`;
}

export function obfuscateHTML(src) {
  const encoded = Buffer.from(src, "utf-8").toString("base64");
  return `<script>document.open();document.write(decodeURIComponent(escape(atob('${encoded}'))));document.close();<\/script>`;
}

export function obfuscatePython(src) {
  const b64 = Buffer.from(src, "utf-8").toString("base64");
  return `import base64 as _b64\nexec(_b64.b64decode('${b64}').decode('utf-8'))`;
}

export function obfuscateLua(src, protect = false) {
  const bytes = [...Buffer.from(src, "utf-8")];
  const k = xorKey();
  const enc = bytes.map((b) => b ^ k);
  const sum = enc.reduce((a, b) => (a + b) % 65536, 0);
  const checkLine = protect
    ? `local chk=0 for i=1,#e do chk=(chk+e[i])%65536 end if chk~=${sum} then return end\n`
    : "";
  return `local e={${enc.join(",")}} local k=${k}\n${checkLine}local s={} for i=1,#e do s[i]=string.char(e[i]~k) end load(table.concat(s))()`;
}

export function obfuscate(lang, src, protect = false) {
  if (!src || !src.trim()) throw new Error("Kode kosong");
  switch (String(lang || "").toLowerCase()) {
    case "javascript": return obfuscateJS(src, protect);
    case "html": return obfuscateHTML(src);
    case "python": return obfuscatePython(src);
    case "lua": return obfuscateLua(src, protect);
    default: throw new Error("Bahasa tidak didukung");
  }
}
