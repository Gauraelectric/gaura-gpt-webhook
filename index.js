const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ASSISTANT_ID = process.env.ASSISTANT_ID;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini"; // Optional tracking/logging only

app.use(bodyParser.json());

app.post("/webhook", async (req, res) => {
  try {
    console.log("📩 Incoming request:", JSON.stringify(req.body, null, 2));
    const userMessage = req.body?.message?.text || req.body?.question || "Hello";

    console.log("💬 User input:", userMessage);
    console.log("🎯 Assistant ID:", ASSISTANT_ID);
    console.log("🤖 Model:", OPENAI_MODEL);

    // Step 1: Create thread
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

    // Step 2: Add user message to thread
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

    // Step 3: Run assistant
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

    // Step 4: Poll status up to 10 attempts (5s)
    let runStatus = "in_progress";
    let attempts = 0;
    let runCheck;
    while ((runStatus === "in_progress" || runStatus === "queued") && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 500));
      runCheck = await axios.get(
        `https://api.openai.com/v1/threads/${thread_id}/runs/${runRes.data.id}`,
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2"
          }
        }
      );
      runStatus = runCheck.data.status;
      attempts++;
    }

    let replyText = "Sorry, still processing... please try again.";

    // Step 5: If completed, fetch response
    if (runStatus === "completed") {
      const msgRes = await axios.get(
        `https://api.openai.com/v1/threads/${thread_id}/messages`,
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2"
          }
        }
      );

      const aiMessage = msgRes.data.data.find(msg => msg.role === "assistant");
      replyText = aiMessage?.content?.[0]?.text?.value || replyText;
    }

    console.log("✅ Final reply:", replyText);

    // Step 6: Send formatted response to SalesIQ
    res.json({
      replies: [
        {
          type: "text",
          text: replyText
        }
      ],
      agent_id: ASSISTANT_ID,
      model_used: OPENAI_MODEL
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
      agent_id: ASSISTANT_ID,
      model_used: OPENAI_MODEL
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
