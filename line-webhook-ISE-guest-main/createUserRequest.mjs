import { ISEHeaders, ISE_ENDPOINT, LineHeaders } from "./utils.mjs";
import checkingStatus from "./checkingStatus.mjs";
import { DateTime } from "luxon";
import request from "request";

// ฟังก์ชันสำหรับการสร้างผู้ใช้ให้กับ Cisco ISE ผ่าน API
function createUserRequest(replyToken, username, password) {
    
    //กำหนดเวลาที่ใช้งานได้
    const fromDate = DateTime.now();
    const toDate = fromDate.plus({ days: 1 });

    console.log(fromDate)
    console.log(toDate)


    /*
     *   กำหนด payload สำหรับข้อมูลที่จะส่งให้กับ ISE ในการสร้างผู้ใช้ผ่าน API
     *   (https://developer.cisco.com/docs/identity-services-engine/latest/guestuser/)
     */
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
            portalId: process.env.ISE_PORTAL_ID, // ✅ ตรวจสอบว่า `ISE_PORTAL_ID` มีค่า
            customFields: {},
        },
    };

    // ทำการส่งข้อมูลให้กับ ISE เพื่อสร้างบัญชีผู้ใช้
    try {
        request.post(
            {
                url: ISE_ENDPOINT,
                headers: ISEHeaders,
                body: JSON.stringify(payload),
            },
            (err, res, body) => {
                if (res.statusCode === 201) {
                    /*
                     *   กรณีที่สร้างบัญชีผู้ใช้ไว้บน ISE สำเร็จ ให้ทำการเรียกใช้ฟังก์ชัน checkingStatus(replyToken: string, username: string)
                     *   เพื่อทำการเเสดงข้อมูลต่อไป
                     */
                    checkingStatus(replyToken, username);
                } else {
                    /*
                     *   กรณีที่สร้างบัญชีผู้ใช้ไว้บน ISE ไม่สำเร็จ ให้ทำการเเจ้งให้กับผู้ใช้ผ่าน LINE API เป็นข้อความ
                     *   (https://developers.line.biz/en/reference/messaging-api/#send-reply-message)
                     */
                    const message = "มีผู้ใช้นี้อยู่ในระบบเเล้ว\nกรุณากด 'ตรวจสอบสถานะ'";
                    request.post(
                        {
                            url: "https://api.line.me/v2/bot/message/reply",
                            headers: LineHeaders,
                            body: JSON.stringify({
                                replyToken: replyToken,
                                messages: [
                                    {
                                        type: "text",
                                        text: message,
                                    },
                                ],
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

export default createUserRequest;
