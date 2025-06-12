const express = require('express');
const axios = require('axios');
const app = express();
require('dotenv').config();

app.use(express.json());

app.post('/', async (req, res) => {
  const userInput = req.body.input?.text || "";

  const systemPrompt = `You are a support assistant for Gaura Electric Vehicles. Answer only based on company data (models, pricing, warranty, Tamil FAQs, and policies). If the user types in Tamil, reply in Tamil. If English, reply in English. If you're unsure, say: “மன்னிக்கவும், தயவுசெய்து எங்கள் டீலர்ஷிப்‑ஐத் தொடர்பு கொள்ளவும்.” / “Please check with our dealership.”`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userInput }
        ],
        temperature: 0.2
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const reply = response.data.choices[0].message.content;
    res.json({ replies: [reply] });

  } catch (error) {
    console.error("GPT Error:", error.message);
    res.json({ replies: ["Sorry, something went wrong. Please try again later."] });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
