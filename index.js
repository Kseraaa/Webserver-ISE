const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const config = require('./config');

const app = express();
const port = 3000;

app.use(bodyParser.json());

// 📌 Webhook รับข้อความจาก LINE
app.post('/webhook', async (req, res) => {
  try {
    const events = req.body.events;
    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const userMessage = event.message.text.trim();
        const replyToken = event.replyToken;

        if (userMessage === 'ขอใช้บริการ Wi-Fi') {
          const guestUser = await createGuestUser();
          const replyMessage = `✅ Wi-Fi Account:\n📌 Username: ${guestUser.username}\n🔑 Password: ${guestUser.password}\n📅 Expiry: ${guestUser.expiry}`;
          await sendLineReply(replyToken, replyMessage);
        } else {
          await sendLineReply(replyToken, '❓ กรุณาพิมพ์ "ขอใช้บริการ Wi-Fi" เพื่อรับบัญชี Wi-Fi');
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
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 4); // ตั้งอายุการใช้งาน 4 ชั่วโมง

    const response = await axios.post(
      `${config.ISE_BASE_URL}/ers/config/guestuser`,
      {
        GuestUser: {
          name: username,
          guestType: 'Daily (default)',
          userInfo: { 
            userName: username, 
            password: password 
          },
          guestAccessInfo: {
            validDays: 0, // กำหนดวันหมดอายุ (0 = ใช้งานได้ภายในวันเดียว)
            fromDate: new Date().toISOString(),
            toDate: expiryDate.toISOString()
          }
        }
      },
      {
        auth: { username: config.ISE_USERNAME, password: config.ISE_PASSWORD },
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
      }
    );

    return { username, password, expiry: expiryDate.toLocaleString() };
  } catch (error) {
    console.error('Error creating guest user:', error);
    return { username: 'N/A', password: 'N/A', expiry: 'N/A' };
  }
}

// 📌 ฟังก์ชันส่งข้อความตอบกลับไปที่ LINE
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
