import FormData from "form-data";

// base64: string base64 gambar dari client (bukan path file, agar cocok untuk serverless Vercel)
export default async function removeBg(base64, filename = "image.jpg") {
  if (!base64) throw new Error("Gambar wajib diisi");
  const buffer = Buffer.from(base64, "base64");
  const form = new FormData();
  form.append("image", buffer, { filename, contentType: "image/jpeg" });
  form.append("format", "png");
  form.append("model", "v1");

  const res = await fetch("https://api2.pixelcut.app/image/matte/v1", {
    method: "POST",
    headers: {
      ...form.getHeaders(),
      "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36",
      "Accept": "application/json, text/plain, */*",
      "x-locale": "en",
      "x-client-version": "web:pixa.com:4a5b0af2",
      "origin": "https://www.pixa.com",
      "referer": "https://www.pixa.com/",
    },
    body: form,
  });
  if (!res.ok) throw new Error("Gagal remove background (status " + res.status + ")");
  const arrBuf = await res.arrayBuffer();
  return Buffer.from(arrBuf).toString("base64");
}
