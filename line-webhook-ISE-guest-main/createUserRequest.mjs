import axios from "axios";
import { ISEHeaders, ISE_ENDPOINT, LineHeaders } from "./utils.mjs";
import checkingStatus from "./checkingStatus.mjs";
import { DateTime } from "luxon";

// ฟังก์ชันสำหรับการสร้างผู้ใช้ให้กับ Cisco ISE ผ่าน API
async function createUserRequest(replyToken, username, password) {
    const fromDate = DateTime.now();
    const toDate = fromDate.plus({ days: 1 });

    console.log(fromDate.toISO());
    console.log(toDate.toISO());

    const payload = {
        GuestUser: {
            name: "",
            id: "",
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
                fromDate: fromDate.toFormat("MM/dd/yyyy HH:mm"),
                toDate: toDate.toFormat("MM/dd/yyyy HH:mm"),
            },
            portalId: process.env.ISE_PORTAL_ID,
            customFields: {},
        },
    };

    try {
        const response = await axios.post(ISE_ENDPOINT, payload, { headers: ISEHeaders });

        if (response.status === 201) {
            // สร้างบัญชีสำเร็จ -> ตรวจสอบสถานะ
            checkingStatus(replyToken, username);
        }
    } catch (error) {
        if (error.response && error.response.status === 400) {
            // ผู้ใช้มีอยู่แล้ว -> แจ้งเตือนผ่าน LINE
            const message = {
                replyToken,
                messages: [{ type: "text", text: "มีผู้ใช้นี้อยู่ในระบบเเล้ว\nกรุณากด 'ตรวจสอบสถานะ'" }],
            };

            try {
                await axios.post("https://api.line.me/v2/bot/message/reply", message, { headers: LineHeaders });
                console.log("แจ้งเตือนผู้ใช้เรียบร้อย");
            } catch (lineError) {
                console.error("เกิดข้อผิดพลาดในการส่งข้อความ LINE:", lineError.message);
            }
        } else {
            console.error("เกิดข้อผิดพลาดในการสร้างผู้ใช้ ISE:", error.message);
        }
    }
}

export default createUserRequest;
