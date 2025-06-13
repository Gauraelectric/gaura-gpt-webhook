const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// Health-check route for quick testing
app.get("/", (req, res) => {
  console.log("🟢 GET / hit");
  res.send("Server is running.");
});

// Main webhook endpoint for Zoho SalesIQ
app.post("/webhook", (req, res) => {
  console.log("📩 Webhook called!");
  console.log("🔍 Request body:", JSON.stringify(req.body, null, 2));

  const handler = req.body.handler;

  if (handler === "trigger") {
    // For welcome events—SalesIQ is expecting a simple welcome message.
    console.log("✨ Trigger event received – sending welcome message!");
    return res.status(200).json({
      action: "reply",
      replies: [
        {
          type: "text",
          value: "Welcome to Gaura Electric! I'm your digital assistant. How can I help you today?"
        }
      ]
    });
  } else if (handler === "message") {
    // For messages (visitor-initiated)
    const question = req.body.question;
    console.log("💬 Message event received – question:", question);

    if (question && question.trim() !== "") {
      // Process the question as needed. For now, echoing it.
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
      // Fallback when no valid question is received.
      return res.status(200).json({
        action: "reply",
        replies: [
          {
            type: "text",
            value: "I did not receive any question. Could you please type your query again?"
          }
        ]
      });
    }
  } else {
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
