import { ISEHeaders, ISE_ENDPOINT, LineHeaders } from "./utils.mjs";
import request from "request";

function formatDate(date) {
    return new Date(date).toLocaleString("th-TH", {
        day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false
    });
}

function createFlexMessage(userData) {
    const { name, guestInfo, guestAccessInfo, status, guestType } = userData;
    const statusColor = status === "ACTIVE" ? "#1DB446" : "#FF6B6E";
    const fromDate = formatDate(userData.guestAccessInfo.fromDate);
    const toDate = formatDate(userData.guestAccessInfo.toDate);

    return {
        type: "flex",
        altText: "รายละเอียดของผู้ใช้",
        contents: {
            type: "bubble",
            hero: { type: "image", url: "https://developers-resource.landpress.line.me/fx/img/01_1_cafe.png", size: "full", aspectRatio: "20:13", aspectMode: "cover" },
            body: {
                type: "box", layout: "vertical", contents: [
                    { type: "text", text: "รายละเอียดของผู้ใช้", weight: "bold", size: "xl", align: "start" },
                    { type: "separator", margin: "md" },
                    createTextButton("Username", name),
                    createTextButton("Password", guestInfo.password),
                    createInfoRow("ใช้ได้ตั้งแต่", fromDate),
                    createInfoRow("จนถึง", toDate),
                    createInfoRow("สถานะ", status, statusColor),
                    createInfoRow("ประเภทผู้ใช้", guestType),
                    ...(status === "ACTIVE" ? [createExtendButton()] : []) //ใช้ ACTIVE เพื่อ TEST ใช้จริงเปลี่ยนเป็น EXPIRED
                ]
            }
        }
    };
}

const createTextButton = (label, text) => ({
    type: "box", layout: "vertical", contents: [
        { type: "text", text: `${label} :`, weight: "bold", size: "md" },
        { type: "button", action: { type: "clipboard", label: text, clipboardText: text }, style: "secondary", height: "sm" }
    ]
});

const createInfoRow = (label, text, color = "#000000") => ({
    type: "box", layout: "baseline", contents: [
        { type: "text", text: `${label} :`, weight: "bold", flex: 5, size: "md" },
        { type: "text", text, flex: 5, size: "md", color }
    ]
});

const createExtendButton = () => ({
    type: "button", action: { type: "message", label: "ขยายเวลาการใช้งาน", text: "ขยายเวลา" }, style: "primary", color: "#ff7f50", margin: "lg", height: "md"
});

function checkingStatus(replyToken, username) {
    request.get({ url: `${ISE_ENDPOINT}/name/${username}`, headers: ISEHeaders }, (err, res, body) => {
        let message;
        if (res.statusCode === 200) {
            message = createFlexMessage(JSON.parse(body).GuestUser);
        } else {
            message = { type: "text", text: res.statusCode === 404 ? "คุณยังไม่ได้ขอใช้บริการ\nกรุณากด 'ขอใช้บริการ WIFI' เพื่อเริ่มต้นการใข้บริการ" : "เกิดข้อผิดพลาด กรุณาดำเนินใหม่อีกครั้งหรือติดต่อเจ้าหน้าที่" };
        }
        request.post({
            url: "https://api.line.me/v2/bot/message/reply",
            headers: LineHeaders,
            body: JSON.stringify({ replyToken, messages: [message] })
        }, () => console.log("checking status done"));
    });
}

export default checkingStatus;