import mongoose from "./db.js";

const userPhoneSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    displayName: { type: String, required: true }
});

const UserPhone = mongoose.model("UserPhone", userPhoneSchema);
export default UserPhone;
