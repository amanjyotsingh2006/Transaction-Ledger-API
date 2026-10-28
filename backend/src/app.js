import express from "express";
import cors from "cors";

import accountRoutes from './routes/account.routes.js';
import transactionRoutes from './routes/transaction.routes.js';

const app = express();

app.use(cors());

app.use(express.json());

app.get("/health", (req,res) => {
    res.status(200).json({sucess: true, message: "Banking API is working"});
});

app.use("/api/accounts", accountRoutes);
app.use("/api/transactions", transactionRoutes);

export default app;