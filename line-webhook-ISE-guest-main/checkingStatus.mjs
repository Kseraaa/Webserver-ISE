import { ISEHeaders, ISE_ENDPOINT, LineHeaders } from "./utils.mjs";
import request from "request";
import moment from "moment";
import https from "https";

const agent = new https.Agent({ rejectUnauthorized: false });


const options = {
    method: 'POST',
    url: 'https://10.10.1.177:9060/ers/config/guestuser',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Basic YOUR_AUTH_TOKEN'
    },
    body: JSON.stringify({
        // ใส่ข้อมูล guest user ที่ต้องการสร้าง
    })
};

request(options, (error, response, body) => {
    if (error) {
        console.error("❌ Request error:", error);
        return;
    }

    console.log("📡 Response Status:", response.statusCode);

    if (body) {
        try {
            const jsonResponse = JSON.parse(body);
            console.log("📡 Response Body:", jsonResponse);
        } catch (err) {
            console.error("❌ JSON Parsing Error:", err);
            console.error("📡 Raw Response Body:", body);
        }
    } else {
        console.warn("⚠️ No response body received.");
    }
});

async function checkingStatus(replyToken, username) {
    let message = "";

    try {
        request.get(
            {
                url: `${ISE_ENDPOINT}/name/${username}`,
                headers: ISEHeaders,
            },
            (err, res, body) => {
                if (err) {
                    console.error("❌ Request error:", err);
                    return;
                }

                console.log("📡 Checking user status...");
                console.log("📡 Response Status:", res.statusCode);

                if (!body) {
                    console.warn("⚠️ No response body received.");
                    return;
                }

                let userData;
                try {
                    userData = JSON.parse(body)["GuestUser"];
                } catch (err) {
                    console.error("❌ JSON Parsing Error:", err);
                    console.error("📡 Raw Response Body:", body);
                    return;
                }

                if (res.statusCode == 200) {
                    message = {
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
                                    {
                                        type: "box",
                                        layout: "vertical",
                                        contents: [
                                            {
                                                type: "box",
                                                layout: "baseline",
                                                contents: [
                                                    { type: "text", text: "Username :", weight: "bold", size: "md", flex: 5 },
                                                    { type: "text", text: userData.name, flex: 5, size: "md" },
                                                ],
                                            },
                                            {
                                                type: "box",
                                                layout: "baseline",
                                                contents: [
                                                    { type: "text", text: "Password :", weight: "bold", size: "md", flex: 5 },
                                                    { type: "text", text: userData.guestInfo.password, flex: 5, size: "md" },
                                                ],
                                            },
                                            {
                                                type: "box",
                                                layout: "baseline",
                                                contents: [
                                                    { type: "text", text: "ใช้ได้ตั้งเเต่ :", weight: "bold", flex: 5, size: "md" },
                                                    { type: "text", text: moment(userData.guestAccessInfo.fromDate).format("DD/MM/YYYY HH:mm"), flex: 5, size: "md" },
                                                ],
                                            },
                                            {
                                                type: "box",
                                                layout: "baseline",
                                                contents: [
                                                    { type: "text", text: "จนถึง :", weight: "bold", flex: 5, size: "md" },
                                                    { type: "text", text: moment(userData.guestAccessInfo.toDate).format("DD/MM/YYYY HH:mm"), flex: 5, size: "md" },
                                                ],
                                            },
                                            {
                                                type: "box",
                                                layout: "baseline",
                                                contents: [
                                                    { type: "text", text: "สถานะ :", weight: "bold", flex: 5, size: "md" },
                                                    {
                                                        type: "text",
                                                        color: userData.status == "ACTIVE" ? "#1DB446" : "#FF6B6E",
                                                        text: userData.status,
                                                        flex: 5,
                                                        size: "md",
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                        },
                    };

                    if (userData.status == "EXPIRED") {
                        message.contents.body.contents.push({
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
                        });
                    }
                } else if (res.statusCode == 404) {
                    message = { type: "text", text: "คุณยังไม่ได้ขอใช้บริการ\nกรุณากด 'ขอใช้บริการ WIFI' เพื่อเริ่มต้นการใข้บริการ" };
                } else {
                    message = { type: "text", text: "เกิดข้อผิดพลาด กรุณาดำเนินใหม่อีกครั้งหรือติดต่อเจ้าหน้าที่" };
                }

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
                        if (err) {
                            console.error("❌ LINE API Error:", err);
                        } else {
                            console.log("✅ Message sent to LINE.");
                        }
                    }
                );
            }
        );
    } catch (e) {
        console.error(e);
    }
}

export default checkingStatus;
