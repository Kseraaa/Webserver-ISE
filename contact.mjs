import { LineHeaders } from "./utils.mjs";
import request from "request";

//ฟังก์ชันสำหรับเเสดงข้อมูลการติดต่อ
function contact(replyToken) {
    /*
     *   จัดทำข้อความเเบบ flex message สำหรับเเสดงข้อมูลให้กับผู้ใช้บน LINE Bot เเละเก็บไว้ในตัวเเปร message
     *   (https://developers.line.biz/flex-simulator/)
     */
    const message = {
        type: "flex",
        altText: "ติดต่อสอบถาม",
        contents: {
            type: "bubble",
            hero: {
                type: "image",
                url: "https://www.ablenet.co.th/wp-content/uploads/2023/03/logo-ablenet.png",
                size: "full",
                aspectMode: "fit",
                action: {
                    type: "uri",
                    uri: "https://line.me/",
                },
                offsetTop: "9px",
                aspectRatio: "18:5",
            },
            body: {
                type: "box",
                layout: "vertical",
                contents: [
                    {
                        type: "text",
                        text: "ติดต่อ",
                        weight: "bold",
                        size: "xl",
                        align: "center",
                    },
                    {
                        type: "box",
                        layout: "vertical",
                        margin: "lg",
                        spacing: "sm",
                        contents: [
                            {
                                type: "box",
                                layout: "baseline",
                                spacing: "sm",
                                contents: [
                                    {
                                        type: "text",
                                        text: "Email :",
                                        size: "md",
                                        flex: 3,
                                        decoration: "none",
                                        wrap: false,
                                        scaling: false,
                                        weight: "bold",
                                    },
                                    {
                                        type: "text",
                                        text: "info@ablenet.co.th",
                                        wrap: true,
                                        size: "sm",
                                        flex: 5,
                                    },
                                ],
                            },
                            {
                                type: "box",
                                layout: "baseline",
                                spacing: "sm",
                                contents: [
                                    {
                                        type: "text",
                                        text: "Phone No :",
                                        size: "md",
                                        flex: 3,
                                        weight: "bold",
                                    },
                                    {
                                        type: "text",
                                        text: "098 859 9000",
                                        wrap: true,
                                        size: "sm",
                                        flex: 5,
                                    },
                                ],
                            },
                            {
                                type: "box",
                                layout: "baseline",
                                spacing: "sm",
                                contents: [
                                    {
                                        type: "text",
                                        text: "Website :",
                                        flex: 3,
                                        weight: "bold",
                                    },
                                    {
                                        type: "text",
                                        text: "https://www.ablenet.co.th/contact/",
                                        flex: 5,
                                        action: {
                                            type: "uri",
                                            label: "action",
                                            uri: "https://www.ablenet.co.th/contact/",
                                        },
                                    },
                                ],
                                flex: 0,
                            },
                        ],
                    },
                ],
            },
        },
    };

    /*
     *   ทำการเเจ้งข้อมูลที่จัดเก็บใน message ให้กับผู้ใช้ผ่าน LINE API
     *   (https://developers.line.biz/en/reference/messaging-api/#send-reply-message)
     */
    try {
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
                console.log("contact done");
            }
        );
    } catch (e) {
        console.error(e);
    }
}

export default contact;
