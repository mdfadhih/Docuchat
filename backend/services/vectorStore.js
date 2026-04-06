const { createClient } = require("@supabase/supabase-js");
const { getEmbedding } = require("./embeddings");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

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

async function searchSimilar(query, limit = 4) {
  console.log("Searching:", query.slice(0, 50));

  const embeddingArr = await getEmbedding(query);
  console.log("Dims:", embeddingArr.length);

  const { data: allDocs, error } = await supabase
    .from("documents")
    .select("id, content, metadata, embedding");

  if (error) throw new Error(error.message);
  if (!allDocs || allDocs.length === 0) return [];

  console.log("Total docs fetched:", allDocs.length);

  const queryVec = Array.from(embeddingArr).map(Number);

  function cosineSim(a, queryVec) {
    // embedding from Supabase comes back as array or string — handle both
    let b;
    if (typeof a === "string") {
      // parse "[0.1,0.2,...]" string format
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
  console.log("Results:", top.length);

  return top;
}

module.exports = { storeChunks, searchSimilar };
