app.post("/webhook", (req, res) => {
  console.log("📩 Webhook called!");
  console.log("🔍 Request body:", JSON.stringify(req.body, null, 2));

  const handlerType = req.body?.handler;

  if (handlerType === "trigger") {
    console.log("✨ Trigger event received – sending welcome message!");
    return res.json({
      action: "reply",
      replies: [
        {
          type: "text",
          value: "👋 Welcome to Gaura Electric! I'm here to assist you—ask me anything about our scooters or services."
        }
      ]
    });
  }

  // Optional fallback if it's a different handler (e.g. message)
  return res.json({
    action: "reply",
    replies: [
      {
        type: "text",
        value: "⚠️ Unknown handler type received."
      }
    ]
  });
});
