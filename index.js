const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION:", err.stack || err);
});

// ✅ Root route for health check
app.get("/", (req, res) => {
  console.log("🟢 GET / hit");
  res.send("🚀 Webhook is live");
});

// ✅ Webhook endpoint for Zoho SalesIQ
app.post("/webhook", (req, res) => {
  console.log("📩 Webhook called!");
  console.log("🔍 Request body:", JSON.stringify(req.body, null, 2));

  const handlerType = req.body?.handler;

  if (handlerType === "trigger") {
    console.log("✨ Trigger event received – sending welcome message!");
    return res.status(200).json({
      action: "reply",
      replies: [
        {
          type: "text",
          value: "👋 Welcome to Gaura Electric! I'm your AI assistant. Ask me anything about our scooters, batteries, or services."
        }
      ],
      suggestions: [
        { type: "text", value: "View scooters" },
        { type: "text", value: "Battery warranty" },
        { type: "text", value: "Book test ride" }
      ]
    });
  }

  // Optional: fallback for other handlers
  console.log("⚠️ Unknown handler:", handlerType);
  return res.status(200).json({
    action: "reply",
    replies: [
      {
        type: "text",
        value: "I'm not sure how to respond to that yet, but I'm here to help!"
      }
    ]
  });
});

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
