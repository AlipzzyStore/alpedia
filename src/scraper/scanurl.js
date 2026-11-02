import axios from "axios";

export default async function checkPhishing(url) {
  if (!url) throw new Error("URL wajib diisi");
  const apiUrl = `https://api.nexray.eu.cc/tools/webphishing?url=${encodeURIComponent(url)}`;
  const res = await axios.get(apiUrl, { timeout: 30000 });
  const data = res.data;
  if (!data.status || !data.result) throw new Error("Gagal mengecek URL. Pastikan link yang dimasukkan valid atau coba lagi nanti.");
  return data.result;
}
