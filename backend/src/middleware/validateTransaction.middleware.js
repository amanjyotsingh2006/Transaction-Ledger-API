
import mongoose from "mongoose";

export const validateTransaction = async (req, res, next) => {
    const { account_id, acc_type, amount, ref_id } = req.body || {};

    // Validate required fields
    if (
        !account_id ||
        !acc_type ||
        amount === undefined ||
        typeof ref_id !== "string" ||
        !ref_id.trim()
    ) {
        return res.status(400).json({
            success: false,
            message: "account_id, acc_type, amount and ref_id are required"
        });
    }

    // Validate account ID format
    if (!mongoose.isValidObjectId(account_id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid account ID"
        });
    }

    // Validate transaction type
    if (!["credit", "debit"].includes(acc_type)) {
        return res.status(400).json({
            success: false,
            message: "Transaction type must be credit or debit"
        });
    }

    // Validate amount
    const amountString = String(amount);

    if (
        !/^\d+(\.\d{1,2})?$/.test(amountString) ||
        !/[1-9]/.test(amountString)
    ) {
        return res.status(400).json({
            success: false,
            message: "Amount must be greater than zero with at most two decimal places"
        });
    }

    return next();
};
