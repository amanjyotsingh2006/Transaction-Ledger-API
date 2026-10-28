import mongoose, { startSession } from "mongoose";
import Account from "../models/accounts.model.js";
import Transaction from "../models/transactions.model.js";


export const createTransaction = async (req, res) => {
    const {
        account_id,
        acc_type,
        amount,
        description,
        ref_id
    } = req.body;

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

    // Validate transaction type
    if (!["credit", "debit"].includes(acc_type)) {
        return res.status(400).json({
            success: false,
            message: "Transaction type must be credit or debit"
        });
    }

    // Validate account ID
    if (!mongoose.isValidObjectId(account_id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid account ID"
        });
    }

    // Validate amount without floating-point arithmetic
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

    const session = await mongoose.startSession();

    try {
        const transactionAmount =
            mongoose.Types.Decimal128.fromString(amountString);

        let createdTransaction;

        await session.withTransaction(async () => {
            const account = await Account.findById(account_id)
                .session(session);

            if (!account) {
                const error = new Error("Account not found");
                error.status = 404;
                throw error;
            }

            // Atomic balance update using Decimal128
            const balanceChange = acc_type === "credit"
                ? transactionAmount
                : mongoose.Types.Decimal128.fromString(`-${amountString}`);

            const balanceFilter = { _id: account_id };

            if (acc_type === "debit") {
                balanceFilter.balance = { $gte: transactionAmount };
            }

            const updatedAccount = await Account.findOneAndUpdate(
                balanceFilter,
                { $inc: { balance: balanceChange } },
                { session, new: true }
            );

            if (!updatedAccount) {
                const error = new Error("Insufficient account balance");
                error.status = 400;
                throw error;
            }

            const [transaction] = await Transaction.create(
                [{
                    account_id,
                    acc_type,
                    amount: transactionAmount,
                    description: description || "",
                    ref_id: ref_id.trim()
                }],
                { session }
            );

            createdTransaction = transaction;
        });

        return res.status(201).json({
            success: true,
            message: "Transaction created successfully",
            transaction: createdTransaction
        });

    } catch (error) {
        console.error("Error in createTransaction:", error.message);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Transaction reference already exists for this account"
            });
        }

        return res.status(error.status || 500).json({
            success: false,
            message: error.status
                ? error.message
                : "Internal server error"
        });

    } finally {
        await session.endSession();
    }
};



export const transferMoney = async (req, res) => {
    const {
        from_account_id,
        to_account_id,
        amount,
        ref_id,
        description
    } = req.body;

    // 1. Validate required fields
    if (
        !from_account_id ||
        !to_account_id ||
        amount === undefined ||
        !ref_id ||
        typeof ref_id !== "string" ||
        !ref_id.trim()
    ) {
        return res.status(400).json({
            success: false,
            message: "Source account, destination account, amount and ref_id are required"
        });
    }

    // 2. Validate account IDs
    if (
        !mongoose.isValidObjectId(from_account_id) ||
        !mongoose.isValidObjectId(to_account_id)
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid account ID"
        });
    }

    // 3. Accounts must be different
    if (from_account_id === to_account_id) {
        return res.status(400).json({
            success: false,
            message: "Source and destination accounts must be different"
        });
    }

    // 4. Validate amount
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

    // 5. Start MongoDB session
    const session = await mongoose.startSession();

    try {
        const transferAmount =
            mongoose.Types.Decimal128.fromString(amountString);

        let transferResult;

        // 6. Execute transfer atomically
        await session.withTransaction(async () => {
            const source = await Account.findById(from_account_id)
                .session(session);

            const destination = await Account.findById(to_account_id)
                .session(session);

            if (!source || !destination) {
                const error = new Error(
                    "Source or destination account not found"
                );
                error.status = 404;
                throw error;
            }

            // 7. Debit source account only if sufficient funds exist
            const debitAmount =
                mongoose.Types.Decimal128.fromString(`-${amountString}`);

            const debitResult = await Account.updateOne(
                {
                    _id: from_account_id,
                    balance: { $gte: transferAmount }
                },
                {
                    $inc: { balance: debitAmount }
                },
                { session }
            );

            if (debitResult.modifiedCount !== 1) {
                const error = new Error("Insufficient account balance");
                error.status = 400;
                throw error;
            }

            // 8. Credit destination account
            const creditResult = await Account.updateOne(
                { _id: to_account_id },
                {
                    $inc: { balance: transferAmount }
                },
                { session }
            );

            if (creditResult.modifiedCount !== 1) {
                const error = new Error(
                    "Failed to credit destination account"
                );
                error.status = 500;
                throw error;
            }

            // 9. Create both transaction records
            const transactions = await Transaction.create(
                [
                    {
                        account_id: from_account_id,
                        acc_type: "debit",
                        amount: transferAmount,
                        description: description || "",
                        ref_id: `${ref_id.trim()}-DEBIT`
                    },
                    {
                        account_id: to_account_id,
                        acc_type: "credit",
                        amount: transferAmount,
                        description: description || "",
                        ref_id: `${ref_id.trim()}-CREDIT`
                    }
                ],
                {
                    session,
                    ordered: true
                }
            );

            transferResult = {
                debit: transactions[0],
                credit: transactions[1]
            };
        });

        // 10. Send success response only after commit
        return res.status(201).json({
            success: true,
            message: "Money transferred successfully",
            transfer: transferResult
        });

    } catch (error) {
        console.error(
            "Error in transferMoney controller:",
            error.message
        );

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A transaction reference already exists for this account"
            });
        }

        return res.status(error.status || 500).json({
            success: false,
            message: error.status
                ? error.message
                : "Internal server error"
        });

    } finally {
        await session.endSession();
    }
};


export const getTransactionHistory = async (req, res) => {
    try {
        const { account_id } = req.params;
        const { acc_type, page = 1, limit = 10 } = req.query;

        if (!mongoose.isValidObjectId(account_id)) {
            return res.status(400).json({ success: false, message: "Invalid Account ID" });
        }

        const pageNumber = Number(page);
        const limitNumber = Number(limit);

        if (
            !Number.isInteger(pageNumber) ||
            !Number.isInteger(limitNumber) ||
            pageNumber < 1 ||
            limitNumber < 1 ||
            limitNumber > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Page must be a positive integer and limit must be between 1 and 100",
            });
        }

        const account = await Account.findById(account_id);

        if (!account) {
            return res.status(404).json({ success: false, message: "Account not found" });
        }

        const query = {
            account_id: account_id,
        }

        if (acc_type) {
            query.acc_type = acc_type;
        }

        const skip = (pageNumber - 1) * limitNumber;

        const [transactions, total] = await Promise.all([
            Transaction.find(query)
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limitNumber),
            Transaction.countDocuments(query),
        ]);

        return res.status(200).json({ success: true, message: "Transaction fetched Successfully", transactions, count: transactions.length })

    } catch (error) {
        console.log("Error in getTransactionHistory controller: ", error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}