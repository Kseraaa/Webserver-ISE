import "dotenv/config"

const ISE_ENDPOINT = `https://${process.env.ISE_HOST}/ers/config/guestuser`;

const CHANNEL_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN;

const LineHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
};

const ISEHeaders = {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Basic ${Buffer.from(`${process.env.USER}:${process.env.PASSWORD}`).toString("base64")}`,
};

export {ISEHeaders, LineHeaders, ISE_ENDPOINT, CHANNEL_ACCESS_TOKEN}