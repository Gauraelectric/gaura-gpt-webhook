require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 3000;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ASSISTANT_ID = process.env.ASSISTANT_ID;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("✅ Gaura GPT Webhook is live!");
});

app.post("/webhook", async (req, res) => {
  try {
    console.log("📩 Incoming request:", JSON.stringify(req.body, null, 2));
    const userMessage = req.body?.message?.text || req.body?.question || "Hello";

    // 1. Create thread
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

    // 2. Post user message
    await axios.post(
      `https://api.openai.com/v1/threads/${thread_id}/messages`,
      { role: "user", content: userMessage },
      { headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "OpenAI-Beta": "assistants=v2", "Content-Type": "application/json" } }
    );

    // 3. Run assistant
    const runRes = await axios.post(
      `https://api.openai.com/v1/threads/${thread_id}/runs`,
      { assistant_id: ASSISTANT_ID },
      { headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "OpenAI-Beta": "assistants=v2", "Content-Type": "application/json" } }
    );
    const runId = runRes.data.id;

    // 4. Poll until completed (or timeout after ~20 seconds)
    let status = "in_progress";
    let runCheck;
    for (let i = 0; i < 10 && (status === "in_progress" || status === "queued"); i++) {
      await new Promise(r => setTimeout(r, 500));
      runCheck = await axios.get(
        `https://api.openai.com/v1/threads/${thread_id}/runs/${runId}`,
        { headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "OpenAI-Beta": "assistants=v2" } }
      );
      status = runCheck.data.status;
    }

    let replyText = "Sorry, still processing... please try again.";

    if (status === "completed") {
      const msgRes = await axios.get(
        `https://api.openai.com/v1/threads/${thread_id}/messages`,
        { headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "OpenAI-Beta": "assistants=v2" } }
      );
      const aiMsg = msgRes.data.data.find(m => m.role === "assistant");
      replyText = aiMsg?.content?.[0]?.text?.value || replyText;
    }

    console.log("✅ Final reply:", replyText);

    res.json({
      replies: [{ type: "text", text: replyText }],
      agent_id: ASSISTANT_ID,
      model_used: OPENAI_MODEL
    });

  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({
      replies: [{ type: "text", text: "Sorry, something went wrong." }],
      agent_id: ASSISTANT_ID,
      model_used: OPENAI_MODEL
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
