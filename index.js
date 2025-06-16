const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini"; // Flexible model config
const ASSISTANT_ID = process.env.ASSISTANT_ID; // For reference/tracking/logging

app.use(bodyParser.json());

app.post("/webhook", async (req, res) => {
  try {
    console.log("📩 Incoming request body:", JSON.stringify(req.body, null, 2));

    const userMessage = req.body?.message?.text || "Hello";
    console.log("💬 User message:", userMessage);

    const completion = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful customer support assistant for Gaura Electric Vehicles. Only respond based on company policy, products (G5, G6, Warrior, Sniper, Partner), warranty, and service. If you're not sure, say: 'Please check with the dealership.'"
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const replyText = completion.data.choices?.[0]?.message?.content?.trim() || "Sorry, I don’t have that information.";

    console.log("🤖 AI Response:", replyText);

    res.json({
      replies: [
        {
          type: "text",
          text: replyText
        }
      ],
      agent_id: ASSISTANT_ID || "gpt-agent" // Optional agent ID for tracking
    });
  } catch (err) {
    console.error("❌ Error:", err.message);
    res.status(500).json({
      replies: [
        {
          type: "text",
          text: "Sorry, something went wrong while processing your request."
        }
      ],
      agent_id: ASSISTANT_ID || "gpt-agent"
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
