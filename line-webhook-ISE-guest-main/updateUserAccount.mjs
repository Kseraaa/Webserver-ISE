import axios from "axios";
import { ISEHeaders, ISE_ENDPOINT, LineHeaders } from "./utils.mjs";
import checkingStatus from "./checkingStatus.mjs";
import { DateTime } from "luxon";

// ฟังก์ชันสำหรับขยายเวลาการใช้งาน Guest User บน Cisco ISE
async function updateUserAccount(replyToken, username, password) {
    const fromDate = DateTime.now().setZone("Asia/Bangkok");
    const toDate = fromDate.plus({ days: 1 });

    const payload = {
        GuestUser: {
            name: username,
            guestType: "Guest-Daily",
            guestInfo: {
                userName: username,
                password: password,
            },
            guestAccessInfo: {
                validDays: 1,
                fromDate: fromDate.toFormat("MM/dd/yyyy HH:mm"),
                toDate: toDate.toFormat("MM/dd/yyyy HH:mm"),
                location: "THAILAND",
            },
            portalId: process.env.ISE_PORTAL_ID,
        },
    };

    console.log("📡 JSON ที่ส่งไปยัง Cisco ISE:");
    console.log(JSON.stringify(payload, null, 2));

    try {
        const response = await axios.put(`${ISE_ENDPOINT}/name/${username}`, payload, { headers: ISEHeaders });

        if (response.status === 200) {
            // ✅ อัปเดตสำเร็จ -> เรียก `checkingStatus()`
            checkingStatus(replyToken, username);
        }
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการอัปเดตบัญชีผู้ใช้:", error.message);

        // ✅ ถ้าอัปเดตไม่สำเร็จ ให้แจ้งผู้ใช้ผ่าน LINE
        const message = {
            replyToken,
            messages: [{ type: "text", text: "อาจเกิดข้อผิดพลาด\nโปรดดำเนินการใหม่อีกครั้ง" }],
        };

        try {
            await axios.post("https://api.line.me/v2/bot/message/reply", message, { headers: LineHeaders });
            console.log("แจ้งเตือนผู้ใช้เรียบร้อย");
        } catch (lineError) {
            console.error("เกิดข้อผิดพลาดในการส่งข้อความ LINE:", lineError.message);
        }
    }
}

export default updateUserAccount;
