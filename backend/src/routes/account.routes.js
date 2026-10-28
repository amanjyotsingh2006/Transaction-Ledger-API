
import express from "express";
import {
    createAccount,
    getAccountBalance,
    getAccounts,
    getAccountById
} from "../controllers/account.controller.js";

const router = express.Router();

router.post("/", createAccount);
router.get("/", getAccounts);
router.get("/:account_id/balance", getAccountBalance);
router.get("/:account_id", getAccountById);

export default router;
