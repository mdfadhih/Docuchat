const express = require("express");
const multer = require("multer");
const { GoogleGenAI } = require("@google/genai");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post("/", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file received" });
    }

    console.log("✓ File received:", req.file.originalname);

    // 1. Parse PDF
    const { extractAndChunk } = require("../services/pdfParser");
    const chunks = await extractAndChunk(req.file.buffer);
    console.log("✓ Chunks:", chunks.length);

    // 2. DELETE all old documents before storing new ones
    const { clearAllChunks, storeChunks } = require("../services/vectorStore");
    await clearAllChunks();
    console.log("✓ Old documents cleared");

    // 3. Store new chunks
    await storeChunks(chunks, req.file.originalname);
    console.log("✓ Stored in Supabase");

    // 4. Generate document-specific suggestions
    const preview = chunks.slice(0, 2).join("\n\n").slice(0, 1500);
    let suggestions = [];

    try {
      const result = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Based on this document excerpt, generate exactly 3 short specific questions a user might ask.
Return ONLY a JSON array of 3 strings. No explanation, no markdown, just the raw array.
Example: ["What is X?", "How does Y work?", "What are the main points?"]

Document excerpt:
${preview}`,
      });

      const text = result.candidates[0].content.parts[0].text.trim();
      const cleaned = text.replace(/```json|```/g, "").trim();
      suggestions = JSON.parse(cleaned);
      if (!Array.isArray(suggestions)) throw new Error("Not an array");
      suggestions = suggestions.slice(0, 3);
      console.log("✓ Suggestions:", suggestions);
    } catch (suggErr) {
      console.error("Suggestions failed, using defaults:", suggErr.message);
      suggestions = [
        "Summarise this document",
        "What are the key points?",
        "What is this document about?",
      ];
    }

    res.json({
      success: true,
      filename: req.file.originalname,
      chunks: chunks.length,
      suggestions,
    });
  } catch (err) {
    console.error("✗ UPLOAD ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
