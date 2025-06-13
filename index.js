const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// Catch any uncaught exceptions to log them
process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION:", err.stack || err);
});

// Root route for basic health check
app.get("/", (req, res) => {
  console.log("🟢 GET / hit");
  res.send("Minimal server running");
});

// Webhook endpoint for Zoho SalesIQ
app.post("/webhook", (req, res) => {
  console.log("📩 Webhook called!");
  console.log("🔍 Request body:", JSON.stringify(req.body, null, 2));

  const handlerType = req.body?.handler;

  if (handlerType === "trigger") {
    console.log("✨ Trigger event received – sending minimal valid welcome message!");
    // Minimal payload that SalesIQ should accept
    return res.status(200).json({
      action: "reply",
      replies: [
        {
          type: "text",
          value: "Welcome to Gaura Electric! Ask me anything about our scooters."
        }
      ]
    });
  }

  // Fallback for other handler types
  console.log("⚠️ Unknown handler:", handlerType);
  return res.status(200).json({
    action: "reply",
    replies: [
      {
        type: "text",
        value: "Unknown request."
      }
    ]
  });
});

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
