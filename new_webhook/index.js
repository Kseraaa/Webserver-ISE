require("dotenv").config();
const express = require("express");
const axios = require("axios");
const https = require("https");

const app = express();

const ISE_HOST = process.env.ISE_HOST;
const ISE_USERNAME = process.env.ISE_USERNAME;
const ISE_PASSWORD = process.env.ISE_PASSWORD;
const PORTAL_ID = process.env.ISE_PORTAL_ID; // 👈 ต้องใช้ Portal ID ที่ถูกต้อง

const port = process.env.PORT || 3000;

const agent = new https.Agent({
    rejectUnauthorized: false,
});

app.use(express.json()); // ✅ รองรับ JSON Request Body

// 🔹 API สร้าง Guest User
app.post("/guest-users", async (req, res) => {
    try {
        const newUser = {
            GuestUser: {
                name: req.body.name,
                emailAddress: req.body.email,
                password: req.body.password,
                guestType: "Daily",
                status: "ACTIVE",
                guestInfo: {
                    enabled: true,
                    userName: req.body.username, // 👈 ต้องระบุ username
                    // password: req.body.password,
                    // emailAddress: req.body.email
                },
                portalId: PORTAL_ID // 👈 ใช้ Portal ID ที่ถูกต้อง
            }
        };

        const response = await axios.post(`${ISE_HOST}/ers/config/guestuser`, newUser, {
            auth: { username: ISE_USERNAME, password: ISE_PASSWORD },
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            httpsAgent: agent,
        });

        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: error.message,
            details: error.response?.data || "No additional details"
        });
    }
});

// 🔹 เปิดใช้งาน Webserver
app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
});
