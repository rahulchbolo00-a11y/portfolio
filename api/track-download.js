// api/track-download.js
// Vercel Serverless Function
// Called every time someone downloads the resume
// Stores count in Vercel KV (free Redis-compatible store)
//
// Setup: In Vercel Dashboard → Storage → Create KV Database → Connect to project
// That auto-sets KV_URL, KV_REST_API_URL, KV_REST_API_TOKEN env vars

import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  // Allow cross-origin (same domain, but just in case)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "POST") {
      // Increment total download counter
      const total = await kv.incr("resume:downloads:total");

      // Also track daily (useful to see trends)
      const today = new Date().toISOString().split("T")[0]; // e.g. "2025-01-15"
      await kv.incr(`resume:downloads:${today}`);

      return res.status(200).json({ success: true, total });
    }

    if (req.method === "GET") {
      // Returns current count — used to display on the page
      const total = (await kv.get("resume:downloads:total")) || 0;
      const today = new Date().toISOString().split("T")[0];
      const todayCount = (await kv.get(`resume:downloads:${today}`)) || 0;
      return res.status(200).json({ total, today: todayCount });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("KV error:", err);
    // Graceful fallback if KV not connected yet — site still works
    return res.status(200).json({ success: true, total: 0, note: "KV not configured yet" });
  }
}
