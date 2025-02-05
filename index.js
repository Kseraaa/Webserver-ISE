import checkingStatus from "./checkingStatus.mjs";
import contact from "./contact.mjs";
import createUserRequest from "./createUserRequest.mjs";
import updateUserAccount from "./updateUserAccount.mjs";
import { LineHeaders } from "./utils.mjs";
import fetch from "node-fetch";

// นำเข้าเครื่องมือไลบรารีสำหรับการใช้งานใน Web Server
import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";

// ปิดการตรวจสอบ SSL (ใช้กับเซิร์ฟเวอร์ภายในเท่านั้น)
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// สร้าง instance ของ Express
const app = express();
const port = process.env.PORT || 3000;


// กำหนดให้ Express ใช้งาน body-parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// API Endpoint หลักสำหรับ LINE Bot
app.post("/", async (req, res) => {
    try {
        console.log("📌 ได้รับ Request แล้ว:", req.body);

        const replyToken = req.body.events?.[0]?.replyToken;
        const message = req.body.events?.[0]?.message?.text;
        const userId = req.body.events?.[0]?.source?.userId;

        if (!userId) {
            throw new Error("❌ ไม่พบ userId ใน request");
        }

        console.log("📌 Reply Token:", replyToken);
        console.log("📌 Message:", message);
        console.log("📌 User ID:", userId);

        // ดึงข้อมูล User Profile จาก LINE API
        const userProfile = await getUserProfile(userId);
        console.log("📌 User Profile:", userProfile);

        if (!userProfile?.userId) {
            throw new Error("❌ userProfile ไม่มี userId");
        }

        // กำหนด username และ password จาก userId
        const username = "user-" + userProfile.userId.slice(0, 6);
        const password = userProfile.userId.slice(6, 12);

        // การจัดการคำสั่งจาก LINE Bot
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
            default:
                console.log("❌ ไม่พบคำสั่งที่รองรับ:", message);
                break;
        }

        res.sendStatus(200);
    } catch (error) {
        console.error("❌ เกิดข้อผิดพลาด:", error.message);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});

/**
 * ฟังก์ชันดึงข้อมูล User Profile จาก LINE API
 */
async function getUserProfile(userId) {
  try {
      if (!userId) {
          throw new Error("❌ ไม่มี userId ส่งไปยัง LINE API");
      }

      console.log("📌 userId ที่ส่งไปยัง LINE API:", userId);

      const response = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
          method: "GET",
          headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.LINE_ACCESS_TOKEN}`
          }
      });

      if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`❌ LINE API ตอบกลับรหัส ${response.status}: ${errorText}`);
      }

      const userProfile = await response.json();
      console.log("📌 User Profile ที่ได้รับ:", userProfile);
      return userProfile;
  } catch (error) {
      console.error("❌ Error in getUserProfile:", error);
      throw error;
  }
}




// เริ่มต้นเซิร์ฟเวอร์
app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
});
