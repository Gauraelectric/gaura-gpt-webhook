
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/', async (req, res) => {
    console.log("🔔 Webhook hit from Zoho:");
    console.log("📩 Payload:", req.body);

    const userInput = req.body.text || req.body.question || "Hello";

    const systemPrompt = `
You are a smart support assistant for Gaura Electric Vehicles. You must only respond based on Gaura's official documents, product specs, warranty policies, and service info.
If you're unsure, reply in Tamil: 'மன்னிக்கவும், தயவுசெய்து எங்கள் டீலர்ஷிப்‑ஐத் தொடர்பு கொள்ளவும்.'
`;

    try {
        const response = await axios.post("https://api.openai.com/v1/chat/completions", {
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userInput }
            ]
        }, {
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            }
        });

        const reply = response.data.choices[0].message.content;
        console.log("✅ GPT Reply:", reply);

        res.json({ replies: [reply] });

    } catch (err) {
        console.error("❌ GPT Error:", err.message);
        res.json({ replies: ["மன்னிக்கவும், சேவையில் சிக்கல் ஏற்பட்டது. பிறகு முயற்சிக்கவும்."] });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
