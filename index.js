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
    console.log("Incoming request body:", req.body);

    // For SalesIQ Zobot webhook:
    const userMessage = req.body?.message?.text || "Hello";


    // Step 1: Create thread
    const thread = await axios.post(
      "https://api.openai.com/v1/threads",
      {},
      {
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
          "Content-Type": "application/json"
        }
      }
    );

    const thread_id = thread.data.id;

    // Step 2: Post user message
    await axios.post(
      `https://api.openai.com/v1/threads/${thread_id}/messages`,
      {
        role: "user",
        content: userMessage
      },
      {
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
          "Content-Type": "application/json"
        }
      }
    );

    // Step 3: Run assistant
    const run = await axios.post(
      `https://api.openai.com/v1/threads/${thread_id}/runs`,
      {
        assistant_id: ASSISTANT_ID
      },
      {
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
          "Content-Type": "application/json"
        }
      }
    );

    // Step 4: Wait for run to complete
    let run_status = "in_progress";
    let run_result;

    while (run_status === "in_progress" || run_status === "queued") {
      await new Promise(resolve => setTimeout(resolve, 1500));
      run_result = await axios.get(
        `https://api.openai.com/v1/threads/${thread_id}/runs/${run.data.id}`,
        {
          headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
            "Content-Type": "application/json"
          }
        }
      );
      run_status = run_result.data.status;
    }

    // Step 5: Fetch response message
    const messages = await axios.get(
      `https://api.openai.com/v1/threads/${thread_id}/messages`,
      {
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
          "Content-Type": "application/json"
        }
      }
    );

    const responseMessage = messages.data.data.find(msg => msg.role === "assistant");

    const replyText = responseMessage?.content[0]?.text?.value || "No reply received.";

    // ✅ Final response formatted for Zoho SalesIQ
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
    console.error("Error:", error.message);
    res.status(500).json({
      action: "reply",
      replies: [
        {
          type: "text",
          value: "Oops! Something went wrong while processing your request."
        }
      ]
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
