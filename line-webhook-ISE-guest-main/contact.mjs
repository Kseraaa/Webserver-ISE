import axios from "axios";
import { LineHeaders } from "./utils.mjs";

async function contact(replyToken) {
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
                aspectRatio: "18:5",
                action: { type: "uri", uri: "https://line.me/" }
            },
            body: {
                type: "box",
                layout: "vertical",
                contents: [
                    { type: "text", text: "ติดต่อ", weight: "bold", size: "xl", align: "center" },
                    { type: "box", layout: "vertical", margin: "lg", spacing: "sm", contents: [
                        infoRow("Email :", "info@ablenet.co.th"),
                        infoRow("Phone No :", "098 859 9000"),
                        infoRow("Website :", "https://www.ablenet.co.th/contact/", true)
                    ]}
                ]
            }
        }
    };

    try {
        await axios.post("https://api.line.me/v2/bot/message/reply", 
            { replyToken, messages: [message] }, 
            { headers: LineHeaders }
        );
        console.log("contact done");
    } catch (error) {
        console.error("Error sending contact message:", error.message);
    }
}

const infoRow = (label, value, isLink = false) => ({
    type: "box",
    layout: "baseline",
    spacing: "sm",
    contents: [
        { type: "text", text: label, size: "md", flex: 3, weight: "bold" },
        { 
            type: "text", text: value, flex: 5, 
            ...(isLink ? { action: { type: "uri", uri: value } } : {}) 
        }
    ]
});

export default contact;
