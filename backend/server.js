require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

// CORS — allow your Vercel domain + localhost
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin) return callback(null, true);

      const allowed = ["http://localhost:5173", "http://localhost:3001"];

      // Allow ANY vercel.app subdomain
      if (origin.endsWith(".vercel.app")) return callback(null, true);
      // Allow any onrender.com (for testing)
      if (origin.endsWith(".onrender.com")) return callback(null, true);
      // Allow specific origins
      if (allowed.includes(origin)) return callback(null, true);

      // Block everything else
      callback(new Error("CORS not allowed: " + origin));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// Test endpoints
app.post("/test", (req, res) => {
  res.json({ received: req.body });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
const uploadRoute = require("./routes/upload");
const queryRoute = require("./routes/query");

app.use("/api/upload", uploadRoute);
app.use("/api/query", queryRoute);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
