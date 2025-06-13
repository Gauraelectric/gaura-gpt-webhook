const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// Catch and log any uncaught exceptions.
process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION:", err.stack || err);
});

// Health-check route.
app.get("/", (req, res) => {
  console.log("🟢 GET / hit");
  res.send("Minimal server running");
});

// Main webhook endpoint for Zoho SalesIQ.
app.post("/webhook", (req, res) => {
  console.log("📩 Webhook called!");
  console.log("🔍 Request body:", JSON.stringify(req.body, null, 2));

  const handler = req.body.handler; // Expecting "trigger" or "message"

  // Handle the "trigger" event (welcome message).
  if (handler === "trigger") {
    console.log("✨ Trigger event received – sending welcome message!");
    return res.status(200).json({
      action: "reply",
      replies: [
        {
          type: "text",
          value:
            "Welcome to Gaura Electric! I'm your digital assistant. How can I help you today?"
        }
      ]
    });
  }
  // Handle the "message" event (visitor has sent a question).
  else if (handler === "message") {
    const question = req.body.question;
    console.log("💬 Message event received – question:", question);

    if (question && question.trim() !== "") {
      // Example: Echo the visitor's question back.
      return res.status(200).json({
        action: "reply",
        replies: [
          {
            type: "text",
            value: `You asked: ${question}`
          }
        ]
      });
    } else {
      // Fallback when the question is missing or blank.
      return res.status(200).json({
        action: "reply",
        replies: [
          {
            type: "text",
            value:
              "I did not receive a valid question. Please type your query again."
          }
        ]
      });
    }
  }
  // Handle an unknown or missing handler type.
  else {
    console.log("⚠️ Unknown handler:", handler);
    return res.status(200).json({
      action: "reply",
      replies: [
        {
          type: "text",
          value: "Unknown handler. Please try again."
        }
      ]
    });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
