const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// Log any uncaught exceptions to catch hidden errors.
process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION:", err.stack || err);
});

// Health-check route
app.get("/", (req, res) => {
  console.log("🟢 GET / hit");
  res.send("Minimal server running");
});

// Main webhook endpoint for Zoho SalesIQ.
app.post("/webhook", (req, res) => {
  console.log("📩 Webhook called!");
  console.log("🔍 Request body:", JSON.stringify(req.body, null, 2));

  const handlerType = req.body?.handler;

  if (handlerType === "trigger") {
    console.log("✨ Trigger event received – sending welcome message!");
    // Reply payload with both reply text and some suggestions.
    return res.status(200).json({
      action: "reply",
      replies: [
        {
          type: "text",
          value:
            "Welcome to Gaura Electric! I'm your digital assistant. Please explore our scooters, battery tech, and more. How can I help you today?"
        }
      ],
      suggestions: [
        { type: "text", value: "View Scooters" },
        { type: "text", value: "Know Battery Tech" },
        { type: "text", value: "Book Test Ride" }
      ]
    });
  } else if (handlerType === "message") {
    console.log("💬 Message event received – sending message reply.");
    return res.status(200).json({
      action: "reply",
      replies: [
        {
          type: "text",
          value: "Thank you for your message. How can I assist you further?"
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
        value: "I'm not sure how to help with that."
      }
    ]
  });
});

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
