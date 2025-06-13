const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ASSISTANT_ID = process.env.ASSISTANT_ID;

app.use(bodyParser.json());

app.post("/webhook", async (req, res) => {
  try {
    console.log("📩 Incoming request body:", JSON.stringify(req.body, null, 2));

    const handlerType = req.body?.handler;

    // ✅ Handle initial welcome trigger
    if (handlerType === "trigger") {
      console.log("✨ Trigger event received – sending welcome message!");
      return res.json({
        action: "reply",
        replies: [
          {
            type: "text",
            value: "Hi there! I'm your AI assistant. Ask me anything about Gaura Electric scooters or battery tech!"
          }
        ]
      });
    }

    // ✅ Handle user message
    const userMessage = req.body?.message?.text || "Hello";
    console.log("💬 Parsed user message:", userMessage);

    // Create a thread
    const threadResponse = await axios.post(
      "https://api.openai.com/v1/threads",
      {},
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
          "Content-Type": "application/json"
        }
      }
    );
    const thread_id = threadResponse.data.id;

    // Post the user message to thread
    await axios.post(
      `https://api.openai.com/v1/threads/${thread_id}/messages`,
      {
        role: "user",
        content: userMessage
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
          "Content-Type": "application/json"
        }
      }
    );

    // Run assistant
    const runResponse = await axios.post(
      `https://api.openai.com/v1/threads/${thread_id}/runs`,
      {
        assistant_id: ASSISTANT_ID
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
          "Content-Type": "application/json"
        }
      }
    );

    let runStatus = "in_progress";
    let runCheck;

    while (runStatus === "in_progress" || runStatus === "queued") {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      runCheck = await axios.get(
        `https://api.openai.com/v1/threads/${thread_id}/runs/${runResponse.data.id}`,
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
            "Content-Type": "application/json"
          }
        }
      );
      runStatus = runCheck.data.status;
    }

    // Get assistant response
    const messagesResponse = await axios.get(
      `https://api.openai.com/v1/threads/${thread_id}/messages`,
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
          "Content-Type": "application/json"
        }
      }
    );

    const aiResponse = messagesResponse.data.data.find((msg) => msg.role === "assistant");
    let replyText = aiResponse?.content?.[0]?.text?.value || "No reply received.";

    // 🔧 Sanitize reply (remove markdown/newlines/citations)
    replyText = replyText
      .replace(/\*\*/g, "")                     // remove bold markers
      .replace(/【.*?†source】/g, "")           // remove source markers
      .replace(/\n/g, " ")                     // flatten line breaks
      .trim();

    console.log("🚀 Outgoing response to SalesIQ:", replyText);

    // Return clean reply
    res.json({
      action: "reply",
      replies: [
        {
          type: "text",
          value: replyText
        }
      ]
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({
      action: "reply",
      replies: [
        {
          type: "text",
          value: "Oops! I ran into an issue fetching your answer. Please try again."
        }
      ]
    });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
