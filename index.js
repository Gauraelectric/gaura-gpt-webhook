const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// Log any uncaught exceptions so we catch hidden errors
process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION:", err.stack || err);
});

// Health-check route
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
    return res.status(200).json({
      action: "reply",
      replies: [
        {
          type: "text",
          value: "Welcome to Gaura Electric! Ask me anything about our scooters."
        }
      ]
    });
    
  } else if (handlerType === "message") {
    console.log("💬 Message event received – sending a response tailored for messages.");
    return res.status(200).json({
      action: "reply",
      replies: [
        {
          type: "text",
          value: "Thank you for your message. How may I assist you further?"
        }
      ]
    });
  }
  
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
