import { ISEHeaders, ISE_ENDPOINT, LineHeaders } from "./utils.mjs";
import checkingStatus from "./checkingStatus.mjs";
import { DateTime } from "luxon";  // ✅ ใช้ luxon แทน moment
import request from "request";

// ฟังก์ชันสำหรับสร้าง Guest User บน Cisco ISE
function createUserRequest(replyToken, username, password) {
    // ✅ ตั้งค่าเวลาตาม Time Zone ไทย (Asia/Bangkok)
    const fromDate = DateTime.now().setZone("Asia/Bangkok");
    const toDate = fromDate.plus({ days: 1 });

    // ✅ Debug ค่าเวลาที่ถูกส่งไปยัง Cisco ISE
    console.log("📡 เวลาที่ถูกส่งไปยัง Cisco ISE:");
    console.log("📅 fromDate:", fromDate.toFormat("MM/dd/yyyy HH:mm"));
    console.log("📅 toDate  :", toDate.toFormat("MM/dd/yyyy HH:mm"));

    // ✅ สร้าง payload
    const payload = {
        GuestUser: {
            name: username,
            guestType: "Guest-Daily",
            status: "ACTIVE",
            guestInfo: {
                userName: username,
                password: password,
                enabled: true,
            },
            guestAccessInfo: {
                validDays: 1,
                location: "THAILAND",
                fromDate: fromDate.toFormat("MM/dd/yyyy HH:mm"), // ✅ ใช้ luxon แปลงเวลา
                toDate: toDate.toFormat("MM/dd/yyyy HH:mm"),
            },
            portalId: process.env.ISE_PORTAL_ID, // ✅ ตรวจสอบว่า `ISE_PORTAL_ID` มีค่า
            customFields: {},
        },
    };

    console.log("📡 ส่ง Request ไปยัง Cisco ISE...");
    console.log("🔗 ISE_ENDPOINT:", ISE_ENDPOINT);

    // ✅ ตรวจสอบว่าผู้ใช้นี้มีอยู่แล้วหรือไม่
    request.get(
        {
            url: `${ISE_ENDPOINT}/name/${username}`,
            headers: ISEHeaders,
        },
        (err, res, body) => {
            if (err) {
                console.error("❌ Request error:", err);
                sendMessage(replyToken, "เกิดข้อผิดพลาดในการเชื่อมต่อกับ ISE");
                return;
            }

            if (res && res.statusCode === 200) {
                console.log("⚠️ ผู้ใช้มีอยู่แล้วในระบบ");
                sendMessage(replyToken, "บัญชีของคุณมีอยู่แล้ว กรุณากด 'ตรวจสอบ' เพื่อดูสถานะ");
            } else {
                // ✅ ถ้ายังไม่มีผู้ใช้ ให้สร้างใหม่
                request.post(
                    {
                        url: ISE_ENDPOINT,
                        headers: ISEHeaders,
                        body: JSON.stringify(payload),
                    },
                    (err, res, body) => {
                        if (err) {
                            console.error("❌ Request error:", err);
                            sendMessage(replyToken, "เกิดข้อผิดพลาดในการเชื่อมต่อกับ ISE");
                            return;
                        }

                        if (!res) {
                            console.error("❌ Response is undefined");
                            sendMessage(replyToken, "ไม่สามารถรับข้อมูลจาก ISE ได้");
                            return;
                        }

                        console.log("📡 Response Status:", res.statusCode);
                        console.log("📡 Response Body:", body);

                        if (res.statusCode === 201) {
                            console.log("✅ สร้าง Guest User สำเร็จ");
                            checkingStatus(replyToken, username);
                        } else {
                            console.log("❌ สร้าง Guest User ไม่สำเร็จ");
                            sendMessage(replyToken, "เกิดข้อผิดพลาดในการสร้างบัญชี กรุณาลองใหม่อีกครั้ง");
                        }
                    }
                );
            }
        }
    );
}

// ✅ ฟังก์ชันส่งข้อความแจ้งเตือนใน LINE
function sendMessage(replyToken, message) {
    request.post(
        {
            url: "https://api.line.me/v2/bot/message/reply",
            headers: LineHeaders,
            body: JSON.stringify({
                replyToken: replyToken,
                messages: [{ type: "text", text: message }],
            }),
        },
        (err, res, body) => {
            if (err) {
                console.error("❌ LINE API Error:", err);
            } else {
                console.log("📡 LINE API Response:", res.statusCode);
            }
        }
    );
}

export default createUserRequest;
