const express = require("express");
const { GoogleGenAI } = require("@google/genai");
const { searchSimilar } = require("../services/vectorStore");

const router = express.Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post("/", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: "Question is required" });
    }

    console.log("Question:", question);

    const relevantChunks = await searchSimilar(question);
    console.log("Chunks returned:", relevantChunks.length);

    const context =
      relevantChunks.length > 0
        ? relevantChunks.map((c) => c.content).join("\n\n---\n\n")
        : "No specific context found.";

    const prompt = `Answer the question using ONLY the context below.
If the answer is not in the context, say "I could not find that in the document."

CONTEXT:
${context}

QUESTION: ${question}

ANSWER:`;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // ── Step 1: Send citations FIRST before streaming answer ──
    const citations = relevantChunks.map((c, i) => ({
      index: i + 1,
      content: c.content,
      preview: c.content.slice(0, 300) + (c.content.length > 300 ? "..." : ""),
      score: c.score ? Math.round(c.score * 100) : null,
      filename: c.metadata?.filename || "document",
    }));

    res.write(`data: ${JSON.stringify({ type: "citations", citations })}\n\n`);

    // ── Step 2: Stream the AI answer ──
    const streamResult = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    for await (const chunk of streamResult) {
      const text = chunk.text;
      if (text)
        res.write(`data: ${JSON.stringify({ type: "text", text })}\n\n`);
    }

    res.write("data: [DONE]\n\n");
    res.end();
    console.log("Streamed successfully with", citations.length, "citations");
  } catch (err) {
    console.error("QUERY ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
