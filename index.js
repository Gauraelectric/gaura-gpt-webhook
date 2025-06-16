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

    // ✅ Extract user message
    const userMessage = req.body?.message?.text || "Hello";
    console.log("💬 Parsed user message:", userMessage);

    // ✅ Create thread
    const threadRes = await axios.post(
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
    const thread_id = threadRes.data.id;

    // ✅ Post user message
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

    // ✅ Trigger assistant run
    const runRes = await axios.post(
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

    // ✅ Poll status — fast polling (max 5 attempts, 500ms delay)
    let runStatus = "in_progress";
    let runCheck;
    let attempts = 0;
    while ((runStatus === "in_progress" || runStatus === "queued") && attempts < 5) {
      await new Promise(resolve => setTimeout(resolve, 500));
      runCheck = await axios.get(
        `https://api.openai.com/v1/threads/${thread_id}/runs/${runRes.data.id}`,
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
            "Content-Type": "application/json"
          }
        }
      );
      runStatus = runCheck.data.status;
      attempts++;
    }

    let replyText = "I'm still thinking... Please ask again.";

    // ✅ Fetch messages only if completed
    if (runStatus === "completed") {
      const msgRes = await axios.get(
        `https://api.openai.com/v1/threads/${thread_id}/messages`,
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
            "Content-Type": "application/json"
          }
        }
      );

      const aiMessage = msgRes.data.data.find(msg => msg.role === "assistant");
      replyText = aiMessage?.content?.[0]?.text?.value || replyText;
    }

    console.log("🤖 Final AI reply:", replyText);

    // ✅ Respond to Zoho SalesIQ
    res.json({
      replies: [
        {
          type: "text",
          text: replyText
        }
      ]
    });
  } catch (err) {
    console.error("❌ Error in webhook:", err.message);
    res.status(500).json({
      replies: [
        {
          type: "text",
          text: "Sorry, there was an error processing your message. Please try again."
        }
      ]
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});
