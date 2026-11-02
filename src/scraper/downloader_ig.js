import axios from "axios";
import { UA } from "./_http.js";

export default async function instagramDownloader(url) {
  const endpoint = "https://api.azbry.com/api/download/instagramv2";
  const response = await axios.get(endpoint, { params: { url }, headers: UA, timeout: 30000 });
  const data = response.data;
  if (!data || !data.status || !Array.isArray(data.links) || data.links.length === 0) {
    throw new Error("Gagal mengambil media dari API Instagram");
  }
  const media = data.links.map((item) => {
    const itemType = String(item.type || "").toLowerCase();
    const itemUrl = String(item.url || "").toLowerCase();
    const isVideo = itemType === "video" || itemType === "mp4" || itemUrl.includes(".mp4");
    return { type: isVideo ? "video" : "image", url: item.url, thumbnail: item.thumbnail || "" };
  });
  const firstLink = data.links[0] || {};
  const captionText = firstLink.text && firstLink.text !== "null" ? firstLink.text.trim() : "";
  const authorName = data.author && data.author !== "Unknown" ? data.author : "-";
  const thumbUrl = firstLink.thumbnail || data.thumbnail || "";
  return { status: true, username: authorName, title: captionText || authorName, caption: captionText, thumbnail: thumbUrl, avatar: data.avatar || "", media };
}
