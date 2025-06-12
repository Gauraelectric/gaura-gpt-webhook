const express = require("express");
const axios = require("axios");
const app = express();

app.use(express.json());

const OPENAI_API_KEY = "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; // Replace with your OpenAI secret key
const ASSISTANT_ID = "asst_9rMkmRVBXUZzX8SQwN9iD9RW";

app.post("/", async (req, res) => {
  const question = req.body.question || req.body.input || req.body.text || req.body.message;

  try {
    // Step 1: Create thread
    const threadRes = await axios.post("https://api.openai.com/v1/threads", {}, {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2",
        "Content-Type": "application/json"
      }
    });
    const thread_id = threadRes.data.id;

    // Step 2: Add message to thread
    await axios.post(`https://api.openai.com/v1/threads/${thread_id}/messages`, {
      role: "user",
      content: question
    }, {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2",
        "Content-Type": "application/json"
      }
    });

    // Step 3: Run the assistant
    const runRes = await axios.post(`https://api.openai.com/v1/threads/${thread_id}/runs`, {
      assistant_id: ASSISTANT_ID
    }, {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2",
        "Content-Type": "application/json"
      }
    });

    const run_id = runRes.data.id;

    // Step 4: Poll until the run completes
    let status = "in_progress";
    while (status !== "completed") {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const statusRes = await axios.get(`https://api.openai.com/v1/threads/${thread_id}/runs/${run_id}`, {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2"
        }
      });
      status = statusRes.data.status;
    }

    // Step 5: Retrieve assistant message
    const msgRes = await axios.get(`https://api.openai.com/v1/threads/${thread_id}/messages`, {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2"
      }
    });

    const assistantMsg = msgRes.data.data.find(msg => msg.role === "assistant");
    const reply = assistantMsg.content[0]?.text?.value || "No response from assistant.";

    res.json({ reply });
  } catch (err) {
    console.error(err?.response?.data || err.message);
    res.status(500).json({ reply: "Sorry, something went wrong. Please try again later." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Webhook live on port ${PORT}`);
});