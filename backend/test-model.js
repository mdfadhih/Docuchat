require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
  try {
    const result = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: "Hello world test",
      config: { outputDimensionality: 768 },
    });
    const dims = result.embeddings[0].values.length;
    console.log("✓ SUCCESS! Dimensions:", dims);
    console.log(dims === 768 ? "✓ Ready for Supabase!" : "✗ Still wrong dims");
  } catch (e) {
    console.log("✗ FAILED:", e.message);
  }
}

test();
