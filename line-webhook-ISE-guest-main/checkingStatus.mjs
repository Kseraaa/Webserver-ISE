import { ISEHeaders, ISE_ENDPOINT, LineHeaders } from "./utils.mjs";
import request from "request";

function checkingStatus(replyToken, username) {
    try {
        request.get({ url: `${ISE_ENDPOINT}/name/${username}`, headers: ISEHeaders }, (err, res, body) => {
            if (err || res.statusCode !== 200) {
                const errorMessage = res?.statusCode === 404 ? "คุณยังไม่ได้ขอใช้บริการ\nกรุณากด 'ขอใช้บริการ WIFI' เพื่อเริ่มต้นการใข้บริการ" : "เกิดข้อผิดพลาด กรุณาดำเนินใหม่อีกครั้งหรือติดต่อเจ้าหน้าที่";
                return sendReply(replyToken, { type: "text", text: errorMessage });
            }
            
            const userData = JSON.parse(body)["GuestUser"];
            const fromDate = formatDate(userData.guestAccessInfo.fromDate);
            const toDate = formatDate(userData.guestAccessInfo.toDate);
            
            const message = createUserInfoMessage(userData, fromDate, toDate);
            sendReply(replyToken, message);
        });
    } catch (e) {
        console.error(e);
    }
}

function formatDate(date) {
    return new Date(date).toLocaleString("th-TH", {
        day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false
    });
}

function createUserInfoMessage(userData, fromDate, toDate) {
    return {
        type: "flex",
        altText: "รายละเอียดของผู้ใช้",
        contents: {
            type: "bubble",
            body: {
                type: "box",
                layout: "vertical",
                contents: [
                    { type: "text", text: "รายละเอียดของผู้ใช้", weight: "bold", size: "xl" },
                    { type: "separator", margin: "md" },
                    createUserInfoRow("Username", userData.name),
                    createUserInfoRow("Password", userData.guestInfo.password),
                    createUserInfoRow("ใช้ได้ตั้งแต่", fromDate),
                    createUserInfoRow("จนถึง", toDate),
                    createUserInfoRow("สถานะ", userData.status, userData.status === "ACTIVE" ? "#1DB446" : "#FF6B6E"),
                    createUserInfoRow("ประเภทผู้ใช้", userData.guestType)
                ]
            }
        }
    };
}

function createUserInfoRow(label, value, color = "#000000") {
    return {
        type: "box",
        layout: "baseline",
        contents: [
            { type: "text", text: label + " :", weight: "bold", size: "md", flex: 5 },
            { type: "text", text: value, size: "md", flex: 5, color }
        ]
    };
}

function sendReply(replyToken, message) {
    request.post({
        url: "https://api.line.me/v2/bot/message/reply",
        headers: LineHeaders,
        body: JSON.stringify({ replyToken, messages: [message] })
    }, () => console.log("Reply sent"));
}

export default checkingStatus;
