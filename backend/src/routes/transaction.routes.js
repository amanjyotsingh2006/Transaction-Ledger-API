import express from "express"
import { createTransaction, getTransactionHistory, transferMoney } from "../controllers/transaction.controller.js";
import { validateTransaction } from "../middleware/validateTransaction.middleware.js";

const router = express.Router();

router.post("/", validateTransaction, createTransaction)
router.post("/transfer", transferMoney)
router.get("/:account_id/transaction-history", getTransactionHistory)

export default router;