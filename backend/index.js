require('dotenv').config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = 5000;

// --- Gemini API setup ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

app.use(cors());
app.use(express.json());

// --- In-memory vector store ---
let docs = []; // { id, text, embedding, filename }

const upload = multer({ dest: "uploads/" });

async function getEmbeddings(text) {
  const model = genAI.getGenerativeModel({ model: "embedding-001" });
  const result = await model.embedContent({ content: { parts: [{ text }] } });
  return result.embedding.values;
}

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function chunkText(text, size = 1500) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + size));
    i += size;
  }
  return chunks;
}

// --- Upload and process documents ---
app.post("/api/upload", upload.array("documents"), async (req, res) => {
  const files = req.files;
  let added = [];
  for (const file of files) {
    let text = "";
    if (file.mimetype === "application/pdf") {
      const data = await pdfParse(fs.readFileSync(file.path));
      text = data.text;
    } else if (file.mimetype.startsWith("text/")) {
      text = fs.readFileSync(file.path, "utf8");
    } else {
      text = "";
    }
    if (text.length < 10) continue;
    // Chunk and embed
    const chunks = chunkText(text);
    for (const chunk of chunks) {
      const embedding = await getEmbeddings(chunk);
      docs.push({
        id: docs.length + 1,
        text: chunk,
        embedding,
        filename: file.originalname,
      });
    }
    added.push(file.originalname);
    fs.unlinkSync(file.path); // cleanup
  }
  res.json({ status: "ok", files: added });
});

// --- Ask endpoint ---
app.post("/api/ask", async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: "No question provided" });

  // Embed question
  const qEmbedding = await getEmbeddings(question);

  // Retrieve top 3 chunks
  const scored = docs.map(d => ({
    ...d,
    score: cosineSimilarity(qEmbedding, d.embedding)
  }));
  const topChunks = scored.sort((a, b) => b.score - a.score).slice(0, 3);

  const context = topChunks.map(c => c.text).join("\n---\n");

  // Compose prompt
  const prompt = `Use the following context to answer the user's question.\n\nContext:\n${context}\n\nQuestion: ${question}\n\nAnswer:`;

  // Gemini answer
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const result = await model.generateContent(prompt);
  const answer = result.response.text();

  res.json({ answer, context: topChunks.map(c => c.filename) });
});

app.listen(PORT, () => {
  console.log(`RAG backend running on http://localhost:${PORT}`);
});