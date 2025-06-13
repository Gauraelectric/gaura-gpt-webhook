const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION:", err.stack || err);
});

app.post("/webhook", (req, res) => {
  console.log("📩 Webhook called!");
  console.log("🔍 Request body:", JSON.stringify(req.body, null, 2));

  res.json({
    action: "reply",
    replies: [
      {
        type: "text",
        value: "✅ Test: Webhook received your POST successfully!"
      }
    ]
  });
});

app.get("/", (req, res) => {
  console.log("🟢 GET / hit");
  res.send("🧪 Test server running");
});

app.listen(port, () => {
  console.log(`✅ Minimal test server live on port ${port}`);
});
