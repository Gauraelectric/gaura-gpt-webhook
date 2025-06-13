
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ASSISTANT_ID = process.env.ASSISTANT_ID;

app.use(bodyParser.json());

app.post('/webhook', async (req, res) => {
    const userMessage = req.body.text;

    try {
        // Step 1: Create a thread
        const threadRes = await axios.post('https://api.openai.com/v1/threads', {}, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'OpenAI-Beta': 'assistants=v2',
                'Content-Type': 'application/json'
            }
        });

        const threadId = threadRes.data.id;

        // Step 2: Add the user message
        await axios.post(`https://api.openai.com/v1/threads/${threadId}/messages`, {
            role: 'user',
            content: userMessage
        }, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'OpenAI-Beta': 'assistants=v2',
                'Content-Type': 'application/json'
            }
        });

        // Step 3: Run the assistant
        const runRes = await axios.post(`https://api.openai.com/v1/threads/${threadId}/runs`, {
            assistant_id: ASSISTANT_ID
        }, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'OpenAI-Beta': 'assistants=v2',
                'Content-Type': 'application/json'
            }
        });

        const runId = runRes.data.id;

        // Step 4: Poll for run completion
        let runStatus;
        do {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const checkRes = await axios.get(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'OpenAI-Beta': 'assistants=v2',
                    'Content-Type': 'application/json'
                }
            });
            runStatus = checkRes.data.status;
        } while (runStatus !== 'completed');

        // Step 5: Get the assistant's response
        const messagesRes = await axios.get(`https://api.openai.com/v1/threads/${threadId}/messages`, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'OpenAI-Beta': 'assistants=v2',
                'Content-Type': 'application/json'
            }
        });

        const messages = messagesRes.data.data;
        const reply = messages.reverse().find(msg => msg.role === 'assistant');

        res.json({ reply: reply ? reply.content[0].text.value : "No reply from assistant." });

    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
        res.status(500).send('Error handling the webhook request.');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
