const express = require("express");
const multer = require("multer");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("pdf"), async (req, res) => {
  try {
    // 1. Check file was received
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file received" });
    }
    console.log(
      "✓ File received:",
      req.file.originalname,
      "(" + req.file.size + " bytes)",
    );

    // 2. Parse PDF into text chunks
    const { extractAndChunk } = require("../services/pdfParser");
    const chunks = await extractAndChunk(req.file.buffer);
    console.log("✓ Extracted chunks:", chunks.length);

    // 3. Store embeddings in Supabase
    const { storeChunks } = require("../services/vectorStore");
    await storeChunks(chunks, req.file.originalname);
    console.log("✓ Stored in Supabase");

    res.json({
      success: true,
      filename: req.file.originalname,
      chunks: chunks.length,
    });
  } catch (err) {
    console.error("✗ UPLOAD ERROR:", err.message);
    console.error(err.stack);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
