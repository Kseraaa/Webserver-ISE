import { ISEHeaders, ISE_ENDPOINT, LineHeaders } from "./utils.mjs";
import checkingStatus from "./checkingStatus.mjs";
import moment from "moment";
import request from "request";

//ฟังก์ชันสำหรับการสร้างผู้ใช้ให้กับ Cisco ISE ผ่าน API โดยรับพารามิเตอร์เป็น replyToken: string, username: string เเละ password: string
function createUserRequest(replyToken, username, password) {
    /*
     *   กำหนดช่วงเวลาให้กับผู้ใช้ในการเข้าถึงบริการ
     *   fromDate -> เวลา ณ การร้องขอใช้บริการของผู้ใช้
     *   toDate -> เวลาจาก fromDate ไป 1 วัน
     */
    const fromDate = new Date();
    const toDate = new Date(fromDate);
    toDate.setDate(toDate.getDate() + 1);

    /*
     *   กำหนด payload สำหรับข้อมูลที่จะส่งให้กับ ISE ในการสร้างผู้ใช้ผ่าน API
     *   (https://developer.cisco.com/docs/identity-services-engine/latest/guestuser/)
     */
    const payload = {
        GuestUser: {
            name: "",
            id: "",
            guestType: "Daily (default)",
            status: "",
            guestInfo: {
                userName: username,
                password: password,
                enabled: true,
            },
            guestAccessInfo: {
                validDays: 1,
                location: "THAILAND",
                fromDate: moment(fromDate).format("MM/DD/YYYY HH:mm"),
                toDate: moment(toDate).format("MM/DD/YYYY HH:mm"),
            },
            portalId: "f4d6f764-f9ee-445f-84c9-97ffd1127cef",
            customFields: {},
        },
    };

    //ทำการส่งข้อมูลให้กับ ISE เพื่อสร้างบัญชีผู้ใช้
    try {
        request.post(
            {
                url: ISE_ENDPOINT,
                headers: ISEHeaders,
                body: JSON.stringify(payload),
            },
            (err, res, body) => {
                if (res.statusCode == 201) {
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
                    const message = "อาจมีผู้ใช้นี้อยู่ในระบบเเล้วหรือเกิดข้อผิดพลาด\nกรุณากด 'ตรวจสอบ' เพื่อเเสดงสถานะของผู้ใช้";
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
