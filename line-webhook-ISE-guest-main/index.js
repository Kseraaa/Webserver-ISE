import dotenv from "dotenv";
import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import checkingStatus from "./checkingStatus.mjs";
import contact from "./contact.mjs";
import createUserRequest from "./createUserRequest.mjs";
import updateUserAccount from "./updateUserAccount.mjs";
import { LineHeaders } from "./utils.mjs";
import slugify from "slugify";
import UserPhone from "./UserPhone.js";


// โหลดค่าตัวแปรจากไฟล์ .env
dotenv.config();
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0; // ปิดการตรวจสอบ SSL

const app = express();
const port = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({ extended: false }));//รองรับข้อมูลจากฟอร์มแบบ x-www-form-urlencoded
app.use(bodyParser.json());// รองรับข้อมูล JSON

//ฟังก์ชันบันทึกเบอร์โทร
async function savePhoneNumber(userId, phoneNumber, displayName) {
    try {
        let user = await UserPhone.findOne({ userId });

        if (user) {
            user.phoneNumber = phoneNumber;
            user.displayName = displayName; // ใช้ displayName แทน firstName
        } else {
            user = new UserPhone({ userId, phoneNumber, displayName });
        }

        await user.save();
        console.log(`✅ เบอร์โทรของ ${userId} ถูกบันทึกแล้ว: ${phoneNumber}`);
    } catch (err) {
        console.error("❌ เกิดข้อผิดพลาดในการบันทึกเบอร์โทร:", err);
    }
}


// ฟังก์ชันดึงเบอร์โทร
async function getPhoneNumber(userId) {
    try {
        const user = await UserPhone.findOne({ userId });
        return user ? user.phoneNumber : null;
    } catch (err) {
        console.error("❌ เกิดข้อผิดพลาดในการดึงเบอร์โทร:", err);
        return null;
    }
}


// ฟังก์ชันดึงข้อมูลโปรไฟล์ LINE
async function getUserProfile(userId) {
    try {
        const response = await axios.get(`https://api.line.me/v2/bot/profile/${userId}`, { headers: LineHeaders });
        return response.data;
    } catch (error) {
        console.error("ไม่สามารถดึงข้อมูลโปรไฟล์ LINE:", error.message);
        return null;
    }
}

app.post("/", async (req, res) => {
    const event = req.body.events[0];//ดึง event จาก request
    if (!event || !event.message || !event.source) return res.sendStatus(200); 

    const replyToken = event.replyToken;
    const message = event.message.text;
    const userId = event.source.userId;

    // ดึงข้อมูลโปรไฟล์ของผู้ใช้จากไลน์
    const userProfile = await getUserProfile(userId);
    if (!userProfile) return res.sendStatus(200);

    const username = "U-" + userProfile.userId.slice(0, 5); //กำหนด username ที่จะตั้งเป็น U+USERID 5 ตัวแรก
    const password = userProfile.userId.slice(0, 2) + userProfile.userId.replace(/\D/g, "").slice(-4);// กำหนด password เป็น USERID 2 ตัวแรก + ตัวเลขจาก USERID 4 ตัวท้าย
    const firstName = slugify(userProfile.displayName, {
        replacement: "", // ลบอักขระที่ไม่ต้องการ
        remove: /[^\p{L}0-9]/gu, // ใช้ Unicode Property Escapes เพื่อรองรับทุกภาษา
        lower: false, // ไม่ต้องแปลงเป็นตัวพิมพ์เล็ก
    });

    console.log(`Username: ${username}`);
    console.log(`FirstName: ${firstName}`);

    // 📌 ตรวจสอบว่าเป็นเบอร์มือถือหรือไม่
    const phoneMatch = message.match(/\d{10}/);
    if (phoneMatch) {
        const phoneNumber = `+66${phoneMatch[0].slice(1)}`;
        savePhoneNumber(userId, phoneNumber, userProfile.displayName);
        return sendLineMessage(replyToken, `📲 บันทึกเบอร์ ${phoneNumber} เรียบร้อย! กรุณากดขอใช้บริการอีกครั้ง`);
    }

    switch (message) {
        case "ขอใช้บริการ":
            const storedPhone = await getPhoneNumber(userId);
            if (!storedPhone) {
                return sendLineMessage(replyToken, "⚠️ กรุณาพิมพ์เบอร์มือถือก่อน เช่น 0987654321");
            }
            createUserRequest(replyToken, username, password, firstName, storedPhone);
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
