const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const config = require('./config');

const app = express();
const port = 3000;

app.use(bodyParser.json());

// 📌 รับ Webhook จาก LINE
app.post('/webhook', async (req, res) => {
  try {
    const events = req.body.events;
    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const userMessage = event.message.text;
        const replyToken = event.replyToken;

        // ตรวจสอบข้อความจากผู้ใช้
        if (userMessage.toLowerCase() === 'wifi') {
          const guestUser = await createGuestUser();
          const replyMessage = `✅ Wi-Fi Account:\nUsername: ${guestUser.username}\nPassword: ${guestUser.password}`;
          await sendLineReply(replyToken, replyMessage);
        }
      }
    }
    res.sendStatus(200);
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.sendStatus(500);
  }
});

// 📌 ฟังก์ชันสร้าง Guest User บน Cisco ISE
async function createGuestUser() {
  try {
    const username = `guest${Date.now()}`;
    const password = Math.random().toString(36).slice(-8);

    const response = await axios.post(
      `${config.ISE_BASE_URL}/ers/config/guestuser`,
      {
        GuestUser: {
          name: username,
          guestType: 'Daily (default)',
          userInfo: { 
            userName: username, 
            password: password 
          }
        }
      },
      {
        auth: { username: config.ISE_USERNAME, password: config.ISE_PASSWORD },
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
      }
    );

    return { username, password };
  } catch (error) {
    console.error('Error creating guest user:', error);
    return { username: 'N/A', password: 'N/A' };
  }
}

// 📌 ฟังก์ชันตอบกลับ LINE
async function sendLineReply(replyToken, message) {
  try {
    await axios.post(
      'https://api.line.me/v2/bot/message/reply',
      {
        replyToken: replyToken,
        messages: [{ type: 'text', text: message }]
      },
      { headers: { Authorization: `Bearer ${config.LINE_CHANNEL_ACCESS_TOKEN}`, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending LINE reply:', error);
  }
}

// 📌 Start Server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
