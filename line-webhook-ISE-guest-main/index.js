import dotenv from "dotenv";
import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import checkingStatus from "./checkingStatus.mjs";
import contact from "./contact.mjs";
import createUserRequest from "./createUserRequest.mjs";
import updateUserAccount from "./updateUserAccount.mjs";
import { LineHeaders } from "./utils.mjs";

//library สำหรับอ่านไฟล์ .env
dotenv.config();

// กำหนดค่าให้ Node-js ไม่สนใจความถูกต้องของ SSL Cert ในการติดต่อ API ต่างๆ 
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// สร้าง Instance ของ expess-js สำหรับสร้าง API
const app = express();

// กำหนด Port สำหรับการทำงานเป็น 3000 หรือสามารถกำหนดใน .env ได้ผ่าน 'PORT=หมายเลข PORT'
const port = process.env.PORT || 3000;

// กำหนดให้ใช้ body-parser ร่วมกับ express-js ในการอ่านเขียนข้อมูลผ่าน API
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// กำหนด API endpoint "/" เป็น endpoint หลักสำหรับใช้งานเป็น Webhook ให้กับ LINE Bot
app.post("/", async (req, res) => {
    /*
    *   จัดเก็บข้อมูลจากการ Request มาจากผู้ใช้ที่ใช้งาน LINE Bot
    *   ReplyToken -> เก็บ Token สำหรับใช้ให้ LINE API ตอบกลับไปยังผู้ใช้คนนั้น ๆ ที่กำลังใช้งาน
    *   message -> เก็บข้อความหรือคำสั่งที่ผู้ใช้ป้อนให้กับ LINE Bot
    *   userId -> เก็บ LINE userId ของผู้ใช้
    */
    const replyToken = req.body.events[0].replyToken;
    const message = req.body.events[0].message.text;
    const userId = req.body.events[0].source.userId;

    // ดึงเเละจัดเก็บข้อมูลส่วนตัวของผู้ใช้ผ่านการเรียกใช้งานฟังก์ชัน getUserProfile(userId: string)
    const userProfile = await getUserProfile(userId);

    //สร้าง username = user+เลข4ตัวเลขของ userID
    //สร้าง password = user2ตัวเเรก + เลข4ตัวสุดท้ายของ userID
    const username = "user-" + userProfile.userId.slice(0, 4);
    const password = userProfile.userId.slice(0, 2) + userProfile.userId.replace(/\D/g, "").slice(-4);

    console.log(username, password);

    // ส่วนสำหรับการเเบ่งการทำงานตามคำสั่งต่าง ๆ ที่ผู้ใช้ request 
    switch (message) {
        case "ขอใช้บริการ":
            createUserRequest(replyToken, username, password);
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
    }

    // เมื่อเสร็จสิ้นกระบวนการ ทำการส่งรหัสสถานะเป็น 200 ให้กับ LINE Bot
    res.sendStatus(200);
});

/*
*   ฟังก์ชันสำหรับการดึงข้อมูลอัตลักษณ์ของผู้ใช้จาก LINE API
*   (https://developers.line.biz/en/reference/messaging-api/#get-profile)
*/
async function getUserProfile(userId) {
    try {
        const response = await axios.get(`https://api.line.me/v2/bot/profile/${userId}`, {
            headers: LineHeaders
        });
        console.log(userId)
        console.log("get user status = " + response.status);
        return response.data;
    } catch (e) {
        console.error(e);
    }
}

app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
});