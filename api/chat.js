export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "AI is not configured yet. Add GROQ_API_KEY in your Vercel project environment variables." });
  try {
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    if (!messages.length || messages.length > 40) return res.status(400).json({ error: "Please send a valid conversation." });
    const safeMessages = messages.map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, 12000)
    }));
    const upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: "You are Infinity AI, a helpful, clear, thoughtful assistant. Be accurate, friendly, and concise." }, ...safeMessages],
        temperature: 0.7,
        max_tokens: 1200
      })
    });
    const data = await upstream.json();
    if (!upstream.ok) return res.status(upstream.status).json({ error: data.error?.message || "The AI provider returned an error." });
    return res.status(200).json({ reply: data.choices?.[0]?.message?.content || "I could not create a response." });
  } catch {
    return res.status(500).json({ error: "Unexpected server error. Please try again." });
  }
}