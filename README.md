# Banking Transaction Management API

A RESTful banking transaction management API built with Node.js, Express.js, MongoDB, and Mongoose. The application supports account management, balance tracking, credit and debit transactions, transaction history, and money transfers.

## Features

- Create and retrieve bank accounts.
- Retrieve account details and balances.
- Process credit and debit transactions.
- Validate account IDs, transaction types, amounts, and reference IDs.
- Prevent duplicate transaction references within the same account.
- Retrieve transaction history with filtering and pagination.
- Transfer money between accounts.
- Use MongoDB transactions to maintain consistency during balance updates and transfers.
- Handle invalid requests, insufficient balances, missing accounts, and duplicate references with appropriate HTTP status codes.

## Tech Stack

- **Runtime:** Node.js
- **Backend Framework:** Express.js
- **Database:** MongoDB Atlas
- **ODM:** Mongoose
- **Environment Variables:** dotenv
- **Cross-Origin Requests:** cors

## Project Structure

```text
project-root/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   └── routes/
│   ├── .env.example
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
├── client/
├── .gitignore
├── package.json
└── README.md
```

## Prerequisites

Before running the application, ensure you have:

- Node.js and npm installed.
- A MongoDB Atlas cluster or another MongoDB deployment that supports transactions.
- A MongoDB database user with appropriate permissions.
- Postman or a similar tool for testing API endpoints.

## Installation and Setup

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd YOUR_PROJECT_FOLDER
```

Replace the placeholders with your actual repository URL and project directory.

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

Create a `.env` file inside the `backend` directory.

```env
PORT=5003
MONGODB_URI=your_mongodb_atlas_connection_string
```

Replace the MongoDB URI placeholder with your actual connection string.

**Security:** Never commit your `.env` file or database credentials to GitHub. Use `.env.example` to document the required variables without exposing secrets.

### 4. Start the server

Run the following command from the `backend` directory:

```bash
npm run server
```

The server will start on the configured port.

### 5. Verify the API

Send a GET request to:

```text
http://localhost:5003/health
```

Expected response:

```json
{
  "success": true,
  "message": "Banking API is running"
}
```

## API Documentation

Base URL:

```text
http://localhost:5003
```

### Account Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Check API status |
| POST | `/api/accounts` | Create a bank account |
| GET | `/api/accounts` | Retrieve all accounts |
| GET | `/api/accounts/:account_id` | Retrieve account details |
| GET | `/api/accounts/:account_id/balance` | Retrieve account balance |

### Transaction Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/transactions` | Create a credit or debit transaction |
| POST | `/api/transactions/transfer` | Transfer money between accounts |
| GET | `/api/transactions/:account_id/transaction-history` | Retrieve transaction history |

## Example Requests

### 1. Create an Account

**POST** `/api/accounts`

```json
{
  "name": "Test Account"
}
```

Use the account ID returned in the response when creating transactions.

### 2. Check Account Balance

**GET** `/api/accounts/:account_id/balance`

Replace `:account_id` with the actual account ID.

### 3. Create a Credit Transaction

**POST** `/api/transactions`

```json
{
  "account_id": "YOUR_ACCOUNT_ID",
  "acc_type": "credit",
  "amount": "100.00",
  "description": "Test credit",
  "ref_id": "TXN-CREDIT-001"
}
```

### 4. Create a Debit Transaction

**POST** `/api/transactions`

```json
{
  "account_id": "YOUR_ACCOUNT_ID",
  "acc_type": "debit",
  "amount": "25.00",
  "description": "Test debit",
  "ref_id": "TXN-DEBIT-001"
}
```

A debit transaction requires sufficient funds in the account.

### 5. Retrieve Transaction History

**GET**

```text
/api/transactions/:account_id/transaction-history?page=1&limit=10
```

Optional query parameters:

- `acc_type`: Filter by `credit` or `debit`.
- `page`: Page number, starting at 1.
- `limit`: Number of transactions per page, subject to the API's configured maximum.

Example with a transaction type filter:

```text
/api/transactions/:account_id/transaction-history?acc_type=credit&page=1&limit=10
```

### 6. Transfer Money

**POST** `/api/transactions/transfer`

```json
{
  "from_account_id": "SOURCE_ACCOUNT_ID",
  "to_account_id": "DESTINATION_ACCOUNT_ID",
  "amount": "50.00",
  "ref_id": "TRANSFER-001"
}
```

Replace the account IDs with existing accounts. Use the exact field names expected by your transfer controller.

## Validation and Error Handling

The API validates transaction requests, including account IDs, transaction types, positive amounts, and non-empty reference IDs.

Common HTTP status codes:

| Status | Meaning |
|---|---|
| `200 OK` | Request completed successfully |
| `201 Created` | Account or transaction created successfully |
| `400 Bad Request` | Invalid input or insufficient balance |
| `404 Not Found` | Requested account does not exist |
| `409 Conflict` | Duplicate transaction reference |
| `500 Internal Server Error` | Unexpected server error |

## Data Integrity and Atomicity

- Monetary values are stored using MongoDB Decimal128 to avoid ordinary JavaScript floating-point precision issues.
- A unique compound index on `account_id` and `ref_id` prevents duplicate transaction references within the same account.
- MongoDB transactions are used to coordinate transaction record creation and account balance updates.
- Money transfers should debit the source account and credit the destination account atomically so that a failed transfer does not leave partially updated balances.

**MongoDB requirement:** Multi-document transactions require a MongoDB deployment that supports transactions, such as a replica set or a supported sharded cluster. MongoDB Atlas deployments generally support this feature.

## Assumptions

- Account IDs are MongoDB ObjectIds.
- Transaction types are `credit` and `debit`.
- Transaction amounts must be greater than zero and contain at most two decimal places.
- Transaction reference IDs must be unique within each account.
- A debit cannot exceed the available account balance.
- Transfers require two distinct existing accounts.
- Transaction history is returned newest first.
- Accounts start with a zero balance unless an opening balance is explicitly provided and supported by the implementation.

## Testing

Test the endpoints using Postman or another API client.

Recommended test cases:

- Create an account and retrieve its balance.
- Create valid credit and debit transactions.
- Reject zero, negative, and invalid transaction amounts.
- Reject invalid account IDs and nonexistent accounts.
- Reject duplicate reference IDs for the same account.
- Reject debits and transfers with insufficient funds.
- Test transaction history filtering and pagination.
- Verify that failed transfers do not change either account's balance.
- Confirm that balance changes and transaction records remain consistent.

## Security

- Keep database credentials in environment variables.
- Do not commit `.env` files, secrets, or `node_modules`.
- Restrict MongoDB Atlas network access and database permissions appropriately.
- Configure CORS for trusted frontend origins if a browser-based frontend is deployed.
