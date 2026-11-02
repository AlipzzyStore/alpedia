import axios from "axios";
import FormData from "form-data";

const API_URL = "https://fgsi.dpdns.org/api/tools/enchantVideo";
const DEFAULT_API_KEY = process.env.HDVIDEO_API_KEY || "fgsiapi-20c1605c-6d";
const PENDING_STATUSES = new Set(["pending", "processing", "queued", "running"]);
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Menerima Buffer video (base64 dari browser, bukan file di disk — cocok untuk serverless Vercel)
async function createEnhanceTask(buffer, filename, apiKey = DEFAULT_API_KEY) {
  const form = new FormData();
  form.append("file", buffer, filename || "video.mp4");
  const response = await axios.post(API_URL, form, {
    headers: { ...form.getHeaders(), apikey: apiKey },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    timeout: 60000,
  });
  const payload = response.data;
  if (!payload?.status || !payload?.data?.pollUrl) throw new Error(payload?.message || "Gagal membuat task HD video");
  return { taskId: payload.data.taskId, createdAt: payload.data.createdAt, pollUrl: payload.data.pollUrl };
}

async function pollEnhanceTask(pollUrl, { apiKey = DEFAULT_API_KEY, pollIntervalMs = 3000, timeoutMs = 50000, maxTransientErrors = 5 } = {}) {
  const startedAt = Date.now();
  let transientErrors = 0, lastPayload = null;
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await axios.get(pollUrl, { headers: { apikey: apiKey }, timeout: 20000 });
      const payload = response.data;
      const status = String(payload?.data?.status || "").trim().toLowerCase();
      lastPayload = payload;
      transientErrors = 0;
      if (status === "success") {
        const result = payload?.data?.result;
        if (!result?.res_url) throw new Error("HD video selesai tetapi url hasil tidak ditemukan");
        return { taskId: payload?.data?.taskId, ...result };
      }
      if (["failed", "error", "cancelled", "canceled"].includes(status)) {
        const err = new Error(payload?.message || payload?.data?.message || `HD video gagal dengan status ${status}`);
        err.isTerminal = true; throw err;
      }
      if (!payload?.status && !PENDING_STATUSES.has(status)) { const err = new Error(payload?.message || "Polling HD video gagal"); err.isTerminal = true; throw err; }
    } catch (error) {
      if (error?.isTerminal) throw error;
      transientErrors += 1;
      if (transientErrors >= maxTransientErrors) throw new Error(error?.response?.data?.message || error?.message || "Polling HD video gagal");
    }
    await delay(pollIntervalMs);
  }
  throw new Error(lastPayload?.message || "Timeout menunggu hasil HD video — coba video yang lebih pendek");
}

// base64: string base64 video dari client; filename opsional
export default async function videoenhancer(base64, filename) {
  if (!base64) throw new Error("Video wajib diisi");
  const buffer = Buffer.from(base64, "base64");
  const task = await createEnhanceTask(buffer, filename);
  const result = await pollEnhanceTask(task.pollUrl);
  return { taskId: task.taskId, resultUrl: result.res_url, ...result };
}
