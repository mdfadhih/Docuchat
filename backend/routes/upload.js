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

    // 2. Store in Supabase
    const { storeChunks } = require("../services/vectorStore");
    await storeChunks(chunks, req.file.originalname);
    console.log("✓ Stored in Supabase");

    // 3. Generate document-specific suggestions using first 2 chunks as context
    const preview = chunks.slice(0, 2).join("\n\n").slice(0, 1500);
    let suggestions = [];

    try {
      const result = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Based on this document excerpt, generate exactly 3 short, specific questions a user might ask about it.
Return ONLY a JSON array of 3 strings. No explanation, no markdown, just the array.
Example: ["What is X?", "How does Y work?", "What are the main points?"]

Document excerpt:
${preview}`,
      });

      const text = result.candidates[0].content.parts[0].text.trim();
      console.log("Suggestions raw:", text);

      // Parse the JSON array
      const cleaned = text.replace(/```json|```/g, "").trim();
      suggestions = JSON.parse(cleaned);

      // Validate it's an array of strings
      if (!Array.isArray(suggestions) || suggestions.length === 0) {
        throw new Error("Invalid suggestions format");
      }

      // Limit to 3
      suggestions = suggestions.slice(0, 3);
      console.log("✓ Suggestions generated:", suggestions);
    } catch (suggErr) {
      console.error(
        "Suggestion generation failed, using defaults:",
        suggErr.message,
      );
      // Fallback to generic suggestions
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
