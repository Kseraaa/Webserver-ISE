import { ISEHeaders, ISE_ENDPOINT, LineHeaders } from "./utils.mjs";
import request from "request";
import moment from "moment";

//ฟังก์ชันสำหรับการเเสดงข้อมูลผู้ใช้ที่จัดเก็บอยู่บน Cisco ISE ผ่านการเรียกใช้ API โดยรับพารามิเตอร์เป็น replyToken: string เเละ username: string
function checkingStatus(replyToken, username) {
    //สร้างตัวเเปร message สำหรับเก็บข้อมูลข้อความที่จะส่งผ่าน LINE API
    let message = "";

    //ทำการดึงข้อมูลผู้ใช้บน ISE ผ่าน API โดยใช้ username ที่ได้ลงทะเบียนกับ ISE
    try {
        request.get(
            {
                url: ISE_ENDPOINT + `/name/${username}`,
                headers: ISEHeaders,
            },
            (err, res, body) => {
                //ดึงข้อมูลผู้ใช้ที่ได้จาก ISE
                const userData = JSON.parse(body)["GuestUser"];
                if (res.statusCode == 200) {
                    //กรณีที่มีผู้ใช้อยู่บน ISE

                    /*
                     *   จัดทำข้อความเเบบ flex message สำหรับเเสดงข้อมูลให้กับผู้ใช้บน LINE Bot เเละเก็บไว้ในตัวเเปร message
                     *   (https://developers.line.biz/flex-simulator/)
                     */
                    message = {
                        type: "flex",
                        altText: "รายละเอียดของผู้ใช้",
                        contents: {
                            type: "bubble",
                            hero: {
                                type: "image",
                                url: "https://developers-resource.landpress.line.me/fx/img/01_1_cafe.png",
                                size: "full",
                                aspectRatio: "20:13",
                                aspectMode: "cover",
                            },
                            body: {
                                type: "box",
                                layout: "vertical",
                                contents: [
                                    {
                                        type: "text",
                                        text: "รายละเอียดของผู้ใช้",
                                        weight: "bold",
                                        size: "xl",
                                        align: "start",
                                    },
                                    {
                                        type: "separator",
                                        margin: "md",
                                    },
                                    {
                                        type: "box",
                                        layout: "vertical",
                                        margin: "lg",
                                        spacing: "sm",
                                        contents: [
                                            {
                                                type: "box",
                                                layout: "vertical",
                                                contents: [
                                                    {
                                                        type: "text",
                                                        text: "Username :",
                                                        weight: "bold",
                                                        size: "md",
                                                    },
                                                    {
                                                        type: "button",
                                                        action: {
                                                            type: "clipboard",
                                                            label: userData.name,
                                                            clipboardText: userData.name,
                                                        },
                                                        style: "secondary",
                                                        height: "sm",
                                                        // color: "#0000ff",
                                                    },
                                                ],
                                            },
                                            {
                                                type: "box",
                                                layout: "vertical",
                                                spacing: "sm",
                                                contents: [
                                                    {
                                                        type: "text",
                                                        text: "Password :",
                                                        weight: "bold",
                                                        size: "md",
                                                        flex: 5,
                                                    },
                                                    {
                                                        type: "button",
                                                        action: {
                                                            type: "clipboard",
                                                            label: userData.guestInfo.password,
                                                            clipboardText: userData.guestInfo.password,
                                                        },
                                                        style: "secondary",
                                                        height: "sm",
                                                        // color: "#0000ff",
                                                    },
                                                ],
                                            },
                                            {
                                                type: "separator",
                                                margin: "md",
                                            },
                                            {
                                                type: "box",
                                                layout: "baseline",
                                                contents: [
                                                    {
                                                        type: "text",
                                                        text: "ใช้ได้ตั้งเเต่ :",
                                                        weight: "bold",
                                                        flex: 5,
                                                        size: "md",
                                                    },
                                                    {
                                                        type: "text",
                                                        text: moment(userData.guestAccessInfo.fromDate).format("DD/MM/YYYY HH:mm"),
                                                        wrap: true,
                                                        flex: 5,
                                                        size: "16px",
                                                    },
                                                ],
                                            },
                                            {
                                                type: "box",
                                                layout: "baseline",
                                                contents: [
                                                    {
                                                        type: "text",
                                                        text: "จนถึง :",
                                                        weight: "bold",
                                                        size: "md",
                                                        flex: 5,
                                                    },
                                                    {
                                                        type: "text",
                                                        text: moment(userData.guestAccessInfo.toDate).format("DD/MM/YYYY HH:mm"),
                                                        wrap: true,
                                                        flex: 5,
                                                        size: "16px",
                                                    },
                                                ],
                                            },
                                            {
                                                type: "box",
                                                layout: "baseline",
                                                contents: [
                                                    {
                                                        type: "text",
                                                        text: "สถานะ :",
                                                        weight: "bold",
                                                        flex: 5,
                                                        size: "md",
                                                    },
                                                    {
                                                        type: "text",
                                                        color: userData.status == "ACTIVE" ? "#1DB446" : "#FF6B6E",
                                                        text: userData.status,
                                                        flex: 5,
                                                        size: "md",
                                                    },
                                                ],
                                            },
                                            {
                                                type: "box",
                                                layout: "baseline",
                                                contents: [
                                                    {
                                                        type: "text",
                                                        text: "ประเภทผู้ใช้ :",
                                                        weight: "bold",
                                                        size: "md",
                                                        flex: 5,
                                                    },
                                                    {
                                                        type: "text",
                                                        text: userData.guestType,
                                                        size: "md",
                                                        flex: 5,
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                        },
                    };

                    //ปุ่มสำหรับการกดขยายเวลาให้กับผู้ใช้ ในกรณีที่ผู้ใช้มีสถานะเป็น Expired
                    const extendDateButton = {
                        type: "button",
                        action: {
                            type: "message",
                            label: "ขยายเวลาการใช้งาน",
                            text: "ขยายเวลา",
                        },
                        style: "primary",
                        color: "#ff7f50",
                        margin: "lg",
                        height: "md",
                    };

                    //ตรวจสอบสถานะของผู้ใช้ว่า Expired หรือไม่? ถ้าใช้ให้ทำการเพิ่มปุ่มเข้าไปใน flex message
                    userData.status == "EXPIRED" ? message.contents.body.contents.push(extendDateButton) : null;
                } else if (res.statusCode == 404) {
                    //กรณีที่ไม่มีผู้ใช้บน ISE ให้ทำการกำหนดข้อความเเจ้งผู้ใช้ เเละเก็บไว้ในตัวเเปร message
                    message = {
                        type: "text",
                        text: "คุณยังไม่ได้ขอใช้บริการ\nกรุณากด 'ขอใช้บริการ WIFI' เพื่อเริ่มต้นการใข้บริการ",
                    };
                } else {
                    //กรณีเกิดความผิดพลาดอื่นๆ ให้ทำการกำหนดข้อความเเจ้งผู้ใช้ เเละเก็บไว้ในตัวเเปร message
                    message = {
                        type: "text",
                        text: "เกิดข้อผิดพลาด กรุณาดำเนินใหม่อีกครั้งหรือติดต่อเจ้าหน้าที่",
                    };
                }

                /*
                 *   ทำการเเจ้งข้อมูลที่จัดเก็บใน message ให้กับผู้ใช้ผ่าน LINE API
                 *   (https://developers.line.biz/en/reference/messaging-api/#send-reply-message)
                 */
                request.post(
                    {
                        url: "https://api.line.me/v2/bot/message/reply",
                        headers: LineHeaders,
                        body: JSON.stringify({
                            replyToken: replyToken,
                            messages: [message],
                        }),
                    },
                    (err, res, body) => {
                        console.log("checking status done");
                    }
                );
            }
        );
    } catch (e) {
        console.error(e);
    }
}

export default checkingStatus;
