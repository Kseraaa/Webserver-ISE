import "dotenv/config"

const ISE_ENDPOINT = `https://${process.env.USER}:${process.env.PASSWORD}@${process.env.ISE_HOST}:${process.env.ISE_PORT}/ers/config/guestuser`;

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

const LineHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
};

const ISEHeaders = {
    Accept: "application/json",
    "Content-Type": "application/json",
};

export {ISEHeaders, LineHeaders, ISE_ENDPOINT, LINE_CHANNEL_ACCESS_TOKEN}