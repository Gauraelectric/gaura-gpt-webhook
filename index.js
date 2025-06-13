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
    const userMessage = req.body.message || req.body.text || "Hi";
    const threadRes = await axios.post(
      "https://api.openai.com/v1/threads",
      {},
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
          "Content-Type": "application/json",
        },
      }
    );

    const threadId = threadRes.data.id;

    await axios.post(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      { role: "user", content: userMessage },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
          "Content-Type": "application/json",
        },
      }
    );

    const run = await axios.post(
      `https://api.openai.com/v1/threads/${threadId}/runs`,
      { assistant_id: ASSISTANT_ID },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
          "Content-Type": "application/json",
        },
      }
    );

    let status = "in_progress";
    let runResult;
    while (status === "in_progress") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runResult = await axios.get(
        `https://api.openai.com/v1/threads/${threadId}/runs/${run.data.id}`,
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
          },
        }
      );
      status = runResult.data.status;
    }

    const messages = await axios.get(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
        },
      }
    );

    const reply = messages.data.data.find((msg) => msg.role === "assistant");
    const responseText =
      reply?.content?.[0]?.text?.value || "Sorry, no response found.";

    res.json({ reply: responseText });
  } catch (error) {
    console.error("Error processing request:", error.message);
    res.status(500).json({ error: "Failed to process request." });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});