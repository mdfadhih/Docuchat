const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function getEmbedding(text) {
  try {
    const result = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: text,
      config: {
        outputDimensionality: 768, // ← reduce from 3072 to 768
      },
    });

    const embedding = result.embeddings[0].values;
    console.log("✓ Embedding generated, dimensions:", embedding.length);
    return embedding;
  } catch (err) {
    console.error("✗ Embedding error:", err.message);
    throw err;
  }
}

module.exports = { getEmbedding };
