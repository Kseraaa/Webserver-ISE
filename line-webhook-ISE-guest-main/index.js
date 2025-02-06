import dotenv from "dotenv";
import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import checkingStatus from "./checkingStatus.mjs";
import contact from "./contact.mjs";
import createUserRequest from "./createUserRequest.mjs";
import updateUserAccount from "./updateUserAccount.mjs";
import { LineHeaders } from "./utils.mjs";

// นำเข้าเครื่องมือไลบรารีสำหรับการใช้งานใน Web Server
dotenv.config();

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;


// สร้าง Instance ของ expess-js สำหรับสร้าง API
const app = express();

// กำหนด Port สำหรับการทำงานเป็น 3000 หรือสามารถกำหนดใน .env ได้ผ่าน 'PORT=หมายเลข PORT'
const port = process.env.PORT || 3000;

// กำหนดค่าให้ Node-js ไม่สนใจความถูกต้องของ SSL Cert ในการติดต่อ API ต่างๆ 

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

    /*
    *   ทำการสร้าง username เเละ password จาก userId ที่เป็นอัตลักษณ์ของผู้ใช้ใน LINE
    *   (userId สามารถใช้จากตัวเเปร userId โดยตรงได้ หรือจะใช้อัตลักษณือย่างอื่นของผู้ใช้ในการสร้างได้)
    *   username -> เก็บ username โดยจะอยู่ในรูปเเบบ 'user-XXXXXX' (XXXXXX เป็น 6 ตัวอักษรเเรกจาก userId)
    *   password -> เก็บ password โดยจะเป็นตัวอักษร 6 ตัว จาก userId (ตั้งเเต่ตัวที่ 7 ไปตัวที่ 12)
    *   **สามารถปรับได้ตามความเหมาะสม
    */
    const username = "user-" + userProfile.userId.slice(0, 6);
    const password = userProfile.userId.slice(6, 12);
    
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
        console.log("get user status = " + response.status);
        return response.data;
    } catch (e) {
        console.error(e);
    }
}

app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
});
