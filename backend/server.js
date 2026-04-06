require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

// Middleware MUST come before routes
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://docuchat-navy.vercel.app/", // your Vercel URL
      /\.vercel\.app$/, // all Vercel preview URLs
    ],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test endpoint to confirm body parsing works
app.post("/test", (req, res) => {
  console.log("Body received:", req.body);
  res.json({ received: req.body });
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

// Routes
const uploadRoute = require("./routes/upload");
const queryRoute = require("./routes/query");

app.use("/api/upload", uploadRoute);
app.use("/api/query", queryRoute);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
