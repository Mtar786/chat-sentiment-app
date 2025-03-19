// server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const Pusher = require('pusher');
const Sentiment = require('sentiment');

const app = express();
const port = process.env.PORT || 5000;
const sentiment = new Sentiment();

// Initialize Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_APP_KEY,
  secret: process.env.PUSHER_APP_SECRET,
  cluster: process.env.PUSHER_APP_CLUSTER,
  useTLS: true
});

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// In-memory chat history (optional)
const chatHistory = [];

// POST endpoint to receive a new chat message
app.post('/message', (req, res) => {
  const { user, message } = req.body;
  if (!user || !message) {
    return res.status(400).send({ error: 'User and message are required.' });
  }

  // Analyze the sentiment of the message
  const analysis = sentiment.analyze(message);
  const sentimentScore = analysis.score; // e.g. positive > 0, negative < 0

  // Create a chat object
  const chat = {
    user,
    message,
    sentiment: sentimentScore,
    timestamp: Date.now()
  };

  // (Optional) Save the chat to history
  chatHistory.push(chat);

  // Trigger a Pusher event so connected clients receive the new message
  pusher.trigger('chat-channel', 'new-message', { chat });

  return res.status(200).send({ status: 'Message sent', chat });
});

// GET endpoint to fetch chat history
app.get('/messages', (req, res) => {
  res.send({ messages: chatHistory });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
