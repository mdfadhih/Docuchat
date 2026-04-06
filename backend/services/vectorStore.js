const { createClient } = require("@supabase/supabase-js");
const { getEmbedding } = require("./embeddings");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

// ── Clear ALL documents (call before uploading a new PDF) ──
async function clearAllChunks() {
  const { error } = await supabase.from("documents").delete().neq("id", 0); // delete all rows (neq 0 matches everything)

  if (error) {
    console.error("Clear error:", error.message);
    throw new Error("Failed to clear documents: " + error.message);
  }

  const { count } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true });

  console.log("Documents after clear:", count);
}

// ── Store new chunks ──
async function storeChunks(chunks, filename) {
  console.log("Storing", chunks.length, "chunks...");
  for (let i = 0; i < chunks.length; i++) {
    const embedding = await getEmbedding(chunks[i]);
    const { error } = await supabase.from("documents").insert({
      content: chunks[i],
      embedding,
      metadata: { filename },
    });
    if (error) throw new Error("Insert failed: " + error.message);
    console.log(`Stored chunk ${i + 1}/${chunks.length}`);
  }
}

// ── Search similar chunks ──
async function searchSimilar(query, limit = 4) {
  console.log("Searching:", query.slice(0, 50));

  const embeddingArr = await getEmbedding(query);
  console.log("Dims:", embeddingArr.length);

  const { data: allDocs, error } = await supabase
    .from("documents")
    .select("id, content, metadata, embedding");

  if (error) throw new Error(error.message);
  if (!allDocs || allDocs.length === 0) {
    console.log("No documents in database");
    return [];
  }

  console.log("Total docs:", allDocs.length);

  const queryVec = Array.from(embeddingArr).map(Number);

  function cosineSim(a, queryVec) {
    let b;
    if (typeof a === "string") {
      b = a
        .replace(/[\[\]]/g, "")
        .split(",")
        .map(Number);
    } else if (Array.isArray(a)) {
      b = a.map(Number);
    } else {
      return 0;
    }
    let dot = 0,
      normA = 0,
      normB = 0;
    for (let i = 0; i < queryVec.length; i++) {
      dot += queryVec[i] * b[i];
      normA += queryVec[i] * queryVec[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  const scored = allDocs.map((doc) => ({
    id: doc.id,
    content: doc.content,
    metadata: doc.metadata,
    score: cosineSim(doc.embedding, queryVec),
  }));

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, limit);

  console.log(
    "Top scores:",
    top.map((d) => d.score.toFixed(4)),
  );
  return top;
}

module.exports = { clearAllChunks, storeChunks, searchSimilar };
