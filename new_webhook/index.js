require("dotenv").config();
const express = require("express");
const axios = require("axios");
const https = require("https");

const app = express();

const ISE_HOST = process.env.ISE_HOST;
const ISE_USERNAME = process.env.ISE_USERNAME;
const ISE_PASSWORD = process.env.ISE_PASSWORD;

const port = process.env.PORT || 3000;

const agent = new https.Agent({
    rejectUnauthorized: false,
});

// ดึงรายการ Guest Users
app.get("/guest-users", async (req, res) => {
    try {
        const response = await axios.get(`${ISE_HOST}/ers/config/guestuser`, {
            auth: { username: ISE_USERNAME, password: ISE_PASSWORD },
            headers: { "Accept": "application/json" },
            httpsAgent: agent,
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ดึงข้อมูล Guest User รายบุคคล
app.get("/guest-user/:id", async (req, res) => {
    const userId = req.params.id;
    try {
        const response = await axios.get(`${ISE_HOST}/ers/config/guestuser/${userId}`, {
            auth: { username: ISE_USERNAME, password: ISE_PASSWORD },
            headers: { "Accept": "application/json" },
            httpsAgent: agent,
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
});
