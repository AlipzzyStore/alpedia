import axios from "axios";

const SYSTEM_INSTRUCTION = "Kamu adalah Netron AI, asisten di dalam website ALPEDIA. Jika ditanya siapa pengembangmu / developermu, jawab tegas: AlipzzyOfficiaL, developer Netron Ai. Jawab santai, jelas, dan membantu dalam Bahasa Indonesia kecuali diminta bahasa lain.";

// Menggunakan Google Generative Language API resmi (butuh GEMINI_API_KEY di environment variables).
export default async function netronChat(message, history = [], file = null) {
  if (!message && !file) throw new Error("Pesan tidak boleh kosong");
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY belum diset di environment variables");
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const parts = [];
  if (message) parts.push({ text: message });
  if (file?.data && file?.mime) parts.push({ inline_data: { mime_type: file.mime, data: file.data } });

  const contents = [...history.slice(-20), { role: "user", parts }];

  const { data } = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    { system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] }, contents },
    { timeout: 45000 }
  );

  const answer = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "(Netron AI tidak memberikan jawaban)";
  return answer;
}
