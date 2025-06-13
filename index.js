const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const { OpenAI } = require("openai");
const cors = require("cors");

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/webhook", async (req, res) => {
  try {
    const userInput = req.body.text || req.body.message || req.body.query;

    if (!userInput) {
      return res.status(400).json({ error: "Missing user input" });
    }

    // Step 1: Create a new thread
    const thread = await openai.beta.threads.create();

    // Step 2: Add the user's message to the thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: userInput,
    });

    // Step 3: Run the assistant on the thread
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID,
    });

    // Step 4: Poll until the run completes
    let result;
    while (true) {
      result = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      if (result.status === "completed") break;
      if (result.status === "failed") {
        return res.status(500).json({ error: "Assistant run failed" });
      }
      await new Promise((r) => setTimeout(r, 1000));
    }

    // Step 5: Retrieve the final messages
    const messages = await openai.beta.threads.messages.list(thread.id);
    const finalMessage = messages.data.find((msg) => msg.role === "assistant");

    const reply =
      finalMessage?.content?.[0]?.text?.value ||
      "Sorry, I couldn't find the answer. Please check with our dealership.";

    res.json({ reply });
  } catch (err) {
    console.error("Error in webhook:", err);
    res.status(500).json({ error: "Failed to process request." });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
