const pdfParse = require("pdf-parse");

async function extractAndChunk(buffer) {
  const data = await pdfParse(buffer);
  const text = data.text;
  console.log("✓ PDF text extracted, length:", text.length);

  const words = text.split(/\s+/);
  const chunks = [];
  const chunkSize = 500;
  const overlap = 50;

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(" ");
    if (chunk.trim().length > 50) {
      chunks.push(chunk.trim());
    }
  }

  console.log("✓ Created", chunks.length, "chunks");
  return chunks;
}

module.exports = { extractAndChunk };
