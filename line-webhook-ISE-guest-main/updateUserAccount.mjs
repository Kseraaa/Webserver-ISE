import { ISEHeaders, ISE_ENDPOINT, LineHeaders } from "./utils.mjs";
import checkingStatus from "./checkingStatus.mjs";
import { DateTime } from "luxon";
import request from "request";

// ฟังก์ชันสำหรับขยายเวลาการใช้งาน Guest User บน Cisco ISE
function updateUserAccount(replyToken, username, password) {
    /*
     *   กำหนดช่วงเวลาที่จะขยายให้กับผู้ใช้ในการเข้าถึงบริการ
     *   fromDate -> เวลา ณ การร้องขอขยายใช้บริการของผู้ใช้
     *   toDate -> เวลาจาก fromDate ไป 1 วัน
     */
    const fromDate = DateTime.now().setZone("Asia/Bangkok");
    const toDate = fromDate.plus({ days: 1 });

    /*
     *   กำหนด payload สำหรับข้อมูลที่จะส่งให้กับ ISE ในการเเก้ไขข้อมูลของผู้ใช้ผ่าน API
     *   (https://developer.cisco.com/docs/identity-services-engine/latest/guestuser/)
     */
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
                fromDate: fromDate.toFormat("MM/dd/yyyy HH:mm"),  // ✅ ใช้ luxon แปลงฟอร์แมต
                toDate: toDate.toFormat("MM/dd/yyyy HH:mm"),
                location: "THAILAND",
            },
            portalId: process.env.ISE_PORTAL_ID,
        },
    };

    console.log("📡 JSON ที่ส่งไปยัง Cisco ISE:");
    console.log(JSON.stringify(payload, null, 2));

    // ทำการส่งข้อมูลให้กับ ISE เพื่ออัพเดตบัญชีผู้ใช้ผ่าน username ที่ได้ลงทะเบียนกับ ISE
    try {
        request.put(
            {
                url: `${ISE_ENDPOINT}/name/${username}`,
                headers: ISEHeaders,
                body: JSON.stringify(payload),
            },
            (err, res, body) => {
                console.log(body);
                console.log(res.statusCode);
                if (res.statusCode == 200) {
                    // ✅ ถ้าอัปเดตสำเร็จ ให้เรียก `checkingStatus()` เพื่อแสดงข้อมูล
                    checkingStatus(replyToken, username);
                } else {
                    // ✅ ถ้าอัปเดตไม่สำเร็จ ให้แจ้งผู้ใช้ผ่าน LINE
                    const message = "อาจเกิดข้อผิดพลาด\nโปรดดำเนินการใหม่อีกครั้ง";
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
                            console.log("status = " + res.statusCode);
                        }
                    );
                }
            }
        );
    } catch (e) {
        console.error(e);
    }
}

export default updateUserAccount;
