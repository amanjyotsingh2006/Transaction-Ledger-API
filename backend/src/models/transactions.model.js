import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
    {
        account_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Account",
            required: true
        },

        acc_type: {
            type: String,
            required: true,
            enum: ["credit", "debit"],
        },

        amount: {
            type: mongoose.Schema.Types.Decimal128,
            required: true
        },

        description: {
            type: String,
            default: "",
            trim: true
        },

        ref_id: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: false
        },
        versionKey: false
    }
);

transactionSchema.index(
    { account_id: 1, ref_id: 1 },
    { unique: true }
);

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;