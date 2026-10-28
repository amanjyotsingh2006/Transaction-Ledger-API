
import mongoose from "mongoose";
import Account from "../models/accounts.model.js";

// Create a new account
export const createAccount = async (req, res) => {
    try {
        const { name, balance } = req.body;

        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Account name is required"
            });
        }

        const balanceString = balance === undefined
            ? "0.00"
            : String(balance);

        if (
            !/^\d+(\.\d{1,2})?$/.test(balanceString) ||
            !/[1-9]/.test(balanceString) && Number(balanceString) !== 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Balance must be zero or a positive amount with at most two decimal places"
            });
        }

        const account = await Account.create({
            name: name.trim(),
            balance: mongoose.Types.Decimal128.fromString(balanceString)
        });

        return res.status(201).json({
            success: true,
            message: "Account created successfully",
            account
        });

    } catch (error) {
        console.error("Error in createAccount:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Get all accounts
export const getAccounts = async (req, res) => {
    try {
        const accounts = await Account.find().sort({ created_at: -1 });

        return res.status(200).json({
            success: true,
            count: accounts.length,
            accounts
        });

    } catch (error) {
        console.error("Error in getAccounts:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Get one account by ID
export const getAccountById = async (req, res) => {
    try {
        const { account_id } = req.params;

        if (!mongoose.isValidObjectId(account_id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid account ID"
            });
        }

        const account = await Account.findById(account_id);

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Account not found"
            });
        }

        return res.status(200).json({
            success: true,
            account
        });

    } catch (error) {
        console.error("Error in getAccountById:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Get account balance
export const getAccountBalance = async (req, res) => {
    try {
        const { account_id } = req.params;

        if (!mongoose.isValidObjectId(account_id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid account ID"
            });
        }

        const account = await Account.findById(account_id).select(
            "name balance"
        );

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Account not found"
            });
        }

        return res.status(200).json({
            success: true,
            account_id: account._id,
            name: account.name,
            balance: account.balance.toString()
        });

    } catch (error) {
        console.error("Error in getAccountBalance:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
