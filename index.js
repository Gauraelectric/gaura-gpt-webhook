const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-3.5-turbo";

app.use(bodyParser.json());

app.post("/webhook", async (req, res) => {
  try {
    const userMessage = req.body?.message?.text || "Hello";

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a support assistant for Gaura Electric Vehicles. Answer questions based only on official products and policies. If unsure, say 'Please check with the dealership.'"
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

    const replyText = response.data.choices[0].message.content;

    res.json({
      replies: [
        {
          type: "text",
          text: replyText
        }
      ]
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({
      replies: [
        {
          type: "text",
          text: "Sorry, something went wrong. Please try again later."
        }
      ]
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});
