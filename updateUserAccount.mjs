import { ISEHeaders, ISE_ENDPOINT, LineHeaders } from "./utils.mjs";
import checkingStatus from "./checkingStatus.mjs";
import moment from "moment";
import request from "request";

//ฟังก์ชันสำหรับการขยายเวลาให้กับผู้ใช้ในกรณีที่ติดสถานะ Expired โดยรับพารามิเตอร์เป็น replyToken: string, username: string เเละ password: string
function updateUserAccount(replyToken, username, password) {
    /*
     *   กำหนดช่วงเวลาที่จะขยายให้กับผู้ใช้ในการเข้าถึงบริการ
     *   fromDate -> เวลา ณ การร้องขอขยายใช้บริการของผู้ใช้
     *   toDate -> เวลาจาก fromDate ไป 1 วัน
     */
    const fromDate = new Date();
    const toDate = new Date(fromDate);
    toDate.setDate(toDate.getDate() + 1);

    /*
     *   กำหนด payload สำหรับข้อมูลที่จะส่งให้กับ ISE ในการเเก้ไขข้อมูลของผู้ใช้ผ่าน API
     *   (https://developer.cisco.com/docs/identity-services-engine/latest/guestuser/)
     */
    const payload = {
        GuestUser: {
            name: username,
            guestType: "Daily (default)",
            guestInfo: {
                userName: username,
                password: password,
            },
            guestAccessInfo: {
                validDays: 1,
                fromDate: moment(fromDate).format("MM/DD/YYYY HH:mm"),
                toDate: moment(toDate).format("MM/DD/YYYY HH:mm"),
                location: "THAILAND",
            },
            portalId: "f4d6f764-f9ee-445f-84c9-97ffd1127cef",
        },
    };

    //ทำการส่งข้อมูลให้กับ ISE เพื่ออัพเดตบัญชีผู้ใช้ผ่าน username ที่ได้ลงทะเบียนกับ ISE
    try {
        request.put(
            {
                url: ISE_ENDPOINT + `/name/${username}`,
                headers: ISEHeaders,
                body: JSON.stringify(payload),
            },
            (err, res, body) => {
                console.log(body);
                console.log(res.statusCode);
                if (res.statusCode == 200) {
                    /*
                     *   กรณีที่เเก้ไขข้อมูลผู้ใช้บน ISE สำเร็จ ให้ทำการเรียกใช้ฟังก์ชัน checkingStatus(replyToken: string, username: string)
                     *   เพื่อทำการเเสดงข้อมูลต่อไป
                     */
                    checkingStatus(replyToken, username);
                } else {
                    /*
                     *   กรณีที่เเก้ไขข้อมูลผู้ใช้บน ISE ไม่สำเร็จ ให้ทำการเเจ้งให้กับผู้ใช้ผ่าน LINE API เป็นข้อความ
                     *   (https://developers.line.biz/en/reference/messaging-api/#send-reply-message)
                     */
                    const message = "อาจเกิดข้อผิดพลาด\nโปรดดำเนินการใหม่อีกครั้ง";
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

export default updateUserAccount;
