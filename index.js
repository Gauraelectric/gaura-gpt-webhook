const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// Catch unexpected errors
process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION:", err.stack || err);
});

// Root health-check route
app.get("/", (req, res) => {
  console.log("🟢 GET / hit");
  res.send("🧪 Test server running");
});

// Zobot webhook route
app.post("/webhook", (req, res) => {
  console.log("📩 Webhook called!");
  console.log("🔍 Request body:", JSON.stringify(req.body, null, 2));

  const handlerType = req.body?.handler;

  if (handlerType === "trigger") {
    console.log("✨ Trigger event received – sending welcome message!");
    return res.json({
      action: "reply",
      replies: [
        {
          type: "text",
          value: "👋 Welcome to Gaura Electric! I'm your AI assistant—ask me anything about scooters, batteries, or features."
        }
      ]
    });
  }

  // Optional: respond to other handlers like 'message'
  res.json({
    action: "reply",
    replies: [
      {
        type: "text",
        value: "⚠️ Received unsupported handler. I'm listening though!"
      }
    ]
  });
});

// Start server
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
