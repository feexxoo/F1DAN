const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const twilio = require('twilio');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Twilio credentials
const accountSid = 'JY2QJ2SMJDSJM2XSNWG9JUEH';
const authToken = 'b2e483ce5eea92c5dfa29d7d60131192';
const twilioPhone = '+16476966889';
const yourPhone = '+14376632772'; // Your personal number to receive texts

const client = twilio(accountSid, authToken);

app.post('/send-alert', (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).send('Missing required fields');
  }

  const smsBody = `🚨 Inquiry from F1DAN.ca:\nName: ${name}\nEmail: ${email}\nMessage: ${message}`;

  client.messages
    .create({
      body: smsBody,
      from: twilioPhone,
      to: yourPhone,
    })
    .then(msg => {
      console.log(`✅ Text sent successfully: ${msg.sid}`);
      res.status(200).send('Text sent!');
    })
    .catch(err => {
      console.error('❌ Failed to send SMS:', err.message);
      res.status(500).send('Failed to send SMS');
    });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 F1DAN SMS Alert Server running at http://localhost:${PORT}`);
});
