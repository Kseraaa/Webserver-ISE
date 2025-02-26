import dotenv from "dotenv";
import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import checkingStatus from "./checkingStatus.mjs";
import contact from "./contact.mjs";
import createUserRequest from "./createUserRequest.mjs";
import updateUserAccount from "./updateUserAccount.mjs";
import { LineHeaders } from "./utils.mjs";

// 📌 โหลดค่าจาก `.env`
dotenv.config();

// 📌 ปิดการตรวจสอบ SSL (ใช้ใน Dev Mode เท่านั้น)
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());



// 📌 ฟังก์ชันดึงข้อมูลโปรไฟล์ผู้ใช้จาก LINE
async function getUserProfile(userId) {
    try {
        const response = await axios.get(`https://api.line.me/v2/bot/profile/${userId}`, { headers: LineHeaders });
        return response.data;
    } catch (error) {
        console.error("❌ ไม่สามารถดึงข้อมูลโปรไฟล์ LINE:", error.message);
        return null;
    }
}

// 📌 Webhook หลักจาก LINE
app.post("/", async (req, res) => {
    const event = req.body.events[0];
    if (!event || !event.message || !event.source) return res.sendStatus(200);

    const replyToken = event.replyToken;
    const message = event.message.text;
    const userId = event.source.userId;

    const userProfile = await getUserProfile(userId);
    if (!userProfile) return res.sendStatus(200);

    const username = "user-" + userProfile.userId.slice(0, 5);
    const password = userProfile.userId.slice(0, 2) + userProfile.userId.replace(/\D/g, "").slice(-4);
    const firstName = userProfile.displayName.normalize("NFKD").replace(/[^\w]/g, "");
    const phoneNumber = "+660918618713";

    console.log(`👤 Username: ${username}`);
    console.log(`👤 FirstName: ${firstName}`);

    // 📌 รับเบอร์โทรจากข้อความ
    switch (message) {
        case "ขอใช้บริการ":
            createUserRequest(replyToken, username, password, firstName, phoneNumber);
            break;
        case "ตรวจสอบสถานะ":
            checkingStatus(replyToken, username);
            break;
        case "ติดต่อสอบถาม":
            contact(replyToken);
            break;
        case "ขยายเวลา":
            updateUserAccount(replyToken, username, password);
            break;
        default:
            sendLineMessage(replyToken, "🔍 กรุณาส่งคำสั่งที่ถูกต้อง เช่น 'ขอใช้บริการ' หรือ 'ตรวจสอบสถานะ'");
    }

    res.sendStatus(200);
});

// 📌 ฟังก์ชันส่งข้อความไปยัง Line
async function sendLineMessage(replyToken, text) {
    await axios.post("https://api.line.me/v2/bot/message/reply", {
        replyToken,
        messages: [{ type: "text", text }]
    }, { headers: LineHeaders });
}

app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
});
