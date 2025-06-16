You said:
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

    // ✅ Extract user message from SalesIQ payload
    const userMessage = req.body?.message?.text || "Hello";
    console.log("💬 Parsed user message:", userMessage);

    // ✅ Step 1: Create a thread for this conversation
    const threadResponse = await axios.post(
      "https://api.openai.com/v1/threads",
      {},
      {
        headers: {
          Authorization: Bearer ${OPENAI_API_KEY},
          "OpenAI-Beta": "assistants=v2",
          "Content-Type": "application/json"
        }
      }
    );
    const thread_id = threadResponse.data.id;

    // ✅ Step 2: Post user's message to OpenAI
    await axios.post(
      https://api.openai.com/v1/threads/${thread_id}/messages,
      {
        role: "user",
        content: userMessage
      },
      {
        headers: {
          Authorization: Bearer ${OPENAI_API_KEY},
          "OpenAI-Beta": "assistants=v2",
          "Content-Type": "application/json"
        }
      }
    );

    // ✅ Step 3: Run assistant to generate response
    const runResponse = await axios.post(
      https://api.openai.com/v1/threads/${thread_id}/runs,
      {
        assistant_id: ASSISTANT_ID
      },
      {
        headers: {
          Authorization: Bearer ${OPENAI_API_KEY},
          "OpenAI-Beta": "assistants=v2",
          "Content-Type": "application/json"
        }
      }
    );

    // ✅ Step 4: Poll OpenAI until response is ready
    let runStatus = "in_progress";
    let runCheck;
    
    while (runStatus === "in_progress" || runStatus === "queued") {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      runCheck = await axios.get(
        https://api.openai.com/v1/threads/${thread_id}/runs/${runResponse.data.id},
        {
          headers: {
            Authorization: Bearer ${OPENAI_API_KEY},
            "OpenAI-Beta": "assistants=v2",
            "Content-Type": "application/json"
          }
        }
      );
      runStatus = runCheck.data.status;
    }

    // ✅ Step 5: Fetch AI response from OpenAI
    const messagesResponse = await axios.get(
      https://api.openai.com/v1/threads/${thread_id}/messages,
      {
        headers: {
          Authorization: Bearer ${OPENAI_API_KEY},
          "OpenAI-Beta": "assistants=v2",
          "Content-Type": "application/json"
        }
      }
    );

    const aiResponse = messagesResponse.data.data.find((msg) => msg.role === "assistant");
    const replyText = aiResponse?.content?.[0]?.text?.value || "No reply received.";
    console.log("🤖 AI replyText:", replyText);

    // ✅ Format response for Zoho SalesIQ
    res.json({
      statusCode: 200, // ✅ Explicit status code for SalesIQ compatibility
      message: replyText // ✅ Some bots prefer "message" over "replies"
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({
      statusCode: 500, // Explicit error handling
      message: "Oops! Something went wrong while processing your message."
    });
  }
});

app.listen(port, () => {
  console.log(🚀 Server is live on port ${port});
});     
