import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        balance: {
            type: mongoose.Schema.Types.Decimal128,
            required: true,
            default: "0.00",
        }
    },
    {
        timeStamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
        versionKey: false
    }
);

const Account = mongoose.model("Account", accountSchema);

export default Account;