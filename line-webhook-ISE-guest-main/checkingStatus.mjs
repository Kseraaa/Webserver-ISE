import { ISEHeaders, ISE_ENDPOINT, LineHeaders } from "./utils.mjs";
import axios from "axios";

function formatDate(date) {
    return new Date(date).toLocaleString("th-TH", {
        day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false
    });
}

function createFlexMessage(userData) {
    const { name, guestInfo, guestAccessInfo, status, guestType } = userData;
    const statusText = status === "AWAITING_INITIAL_LOGIN" ? "โปรดลงชื่อเข้าใช้" : status;
    const statusColor = status === "ACTIVE" ? "#1DB446" : "#FF6B6E";
    const fromDate = userData.guestAccessInfo.fromDate 
    ? formatDate(userData.guestAccessInfo.fromDate) 
    : formatDate(new Date()); // ใช้เวลาปัจจุบันแทน

    const toDate = userData.guestAccessInfo.toDate 
    ? formatDate(userData.guestAccessInfo.toDate) 
    : formatDate(new Date(Date.now() + 24 * 60 * 60 * 1000)); // ใช้เวลาปัจจุบัน +1 วัน



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
                    createInfoRow("สถานะ", statusText, statusColor),
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

async function checkingStatus(replyToken, username) {
    try {
        const { data } = await axios.get(`${ISE_ENDPOINT}/name/${username}`, { headers: ISEHeaders });

        const message = createFlexMessage(data.GuestUser);
        await axios.post("https://api.line.me/v2/bot/message/reply", {
            replyToken,
            messages: [message]
        }, { headers: LineHeaders });

        console.log("checking status done");
    } catch (error) {
        let message;
        if (error.response?.status === 404) {
            message = { type: "text", text: "คุณยังไม่ได้ขอใช้บริการ\nกรุณากด 'ขอใช้บริการ WIFI' เพื่อเริ่มต้นการใช้งาน" };
        } else {
            message = { type: "text", text: "เกิดข้อผิดพลาด กรุณาดำเนินใหม่อีกครั้งหรือติดต่อเจ้าหน้าที่" };
        }

        await axios.post("https://api.line.me/v2/bot/message/reply", {
            replyToken,
            messages: [message]
        }, { headers: LineHeaders });

        console.error("Error:", error.message);
    }
}

export default checkingStatus;