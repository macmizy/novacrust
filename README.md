# Wallet Service

A simple wallet service built with NestJS that allows creating wallets, funding them, and transferring funds between wallets.

## Features

- Create a new wallet
- Fund a wallet
- Transfer funds between wallets
- View wallet details and transaction history
- Idempotent operations for fund/transfer to handle retries safely

## Prerequisites

- Node.js (v16 or later)
- npm (v8 or later) or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd wallet-service
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the App

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run build
$ npm run start:prod
```

## Testing

Run the test suite with:

```bash
# unit tests
$ npm test

# test coverage
$ npm run test:cov
```

### Test Coverage

- Service layer unit tests
- Idempotency tests
- Error handling tests
- Edge case coverage

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400 Bad Request` - Invalid input data
- `404 Not Found` - Wallet not found
- `409 Conflict` - Duplicate wallet or transaction
- `500 Internal Server Error` - Unexpected errors

## Scaling Considerations

### Current Implementation (In-Memory)
- Simple and fast for development and testing
- Loses data on server restart
- Not suitable for production

### Production Scaling

1. **Database**:
   - Use PostgreSQL with transactions for data consistency
   - Add indexes for walletId and referenceId fields

2. **Caching**:
   - Redis for frequently accessed wallet data
   - Cache invalidation on updates

3. **Idempotency**:
   - Current implementation uses in-memory storage for reference IDs
   - In production, use a distributed cache like Redis

4. **Concurrency**:
   - Implement database-level row locking
   - Consider optimistic concurrency control

5. **Monitoring**:
   - Add logging and metrics
   - Set up alerts for failed transactions

6. **API Gateway**:
   - Rate limiting
   - Request validation
   - Authentication/Authorization

## API Documentation

### Create a Wallet

```http
POST /wallets
```

**Request Body:**
```json
{
  "id": "wallet-123",
  "currency": "USD"
}
```

**Response:**
```json
{
  "data": {
    "id": "wallet-123",
    "currency": "USD",
    "balance": 0,
    "transactions": [],
    "createdAt": "2023-12-19T12:00:00.000Z",
    "updatedAt": "2023-12-19T12:00:00.000Z"
  }
}
```

### Fund a Wallet

```http
POST /wallets/:id/fund
```

**Request Body:**
```json
{
  "amount": 100,
  "referenceId": "txn-123"
}
```

**Response:**
```json
{
  "data": {
    "id": "wallet-123",
    "currency": "USD",
    "balance": 100,
    "transactions": [
      {
        "id": "txn-456",
        "walletId": "wallet-123",
        "amount": 100,
        "type": "FUND",
        "referenceId": "txn-123",
        "metadata": {
          "action": "wallet_fund"
        },
        "createdAt": "2023-12-19T12:05:00.000Z"
      }
    ],
    "createdAt": "2023-12-19T12:00:00.000Z",
    "updatedAt": "2023-12-19T12:05:00.000Z"
  }
}
```

### Transfer Funds Between Wallets

```http
POST /wallets/transfer
```

**Request Body:**
```json
{
  "fromWalletId": "wallet-123",
  "toWalletId": "wallet-456",
  "amount": 50,
  "referenceId": "transfer-789"
}
```

**Response:**
```json
{
  "data": {
    "fromWallet": {
      "id": "wallet-123",
      "currency": "USD",
      "balance": 50,
      "transactions": [
        {
          "id": "txn-456",
          "walletId": "wallet-123",
          "amount": 100,
          "type": "FUND",
          "referenceId": "txn-123",
          "metadata": {
            "action": "wallet_fund"
          },
          "createdAt": "2023-12-19T12:05:00.000Z"
        },
        {
          "id": "txn-789",
          "walletId": "wallet-123",
          "amount": -50,
          "type": "TRANSFER",
          "referenceId": "transfer-789-from",
          "metadata": {
            "action": "transfer_out",
            "toWalletId": "wallet-456"
          },
          "createdAt": "2023-12-19T12:10:00.000Z"
        }
      ],
      "createdAt": "2023-12-19T12:00:00.000Z",
      "updatedAt": "2023-12-19T12:10:00.000Z"
    },
    "toWallet": {
      "id": "wallet-456",
      "currency": "USD",
      "balance": 50,
      "transactions": [
        {
          "id": "txn-890",
          "walletId": "wallet-456",
          "amount": 50,
          "type": "TRANSFER",
          "referenceId": "transfer-789-to",
          "metadata": {
            "action": "transfer_in",
            "fromWalletId": "wallet-123"
          },
          "createdAt": "2023-12-19T12:10:00.000Z"
        }
      ],
      "createdAt": "2023-12-19T12:00:00.000Z",
      "updatedAt": "2023-12-19T12:10:00.000Z"
    }
  }
}
```

### Get Wallet Details

```http
GET /wallets/:id
```

**Response:**
```json
{
  "data": {
    "id": "wallet-123",
    "currency": "USD",
    "balance": 50,
    "createdAt": "2023-12-19T12:00:00.000Z",
    "updatedAt": "2023-12-19T12:10:00.000Z"
  }
}
```

### Get Wallet Transactions

```http
GET /wallets/:id/transactions
```

**Response:**
```json
{
  "data": [
    {
      "id": "txn-456",
      "walletId": "wallet-123",
      "amount": 100,
      "type": "FUND",
      "referenceId": "txn-123",
      "metadata": {
        "action": "wallet_fund"
      },
      "createdAt": "2023-12-19T12:05:00.000Z"
    },
    {
      "id": "txn-789",
      "walletId": "wallet-123",
      "amount": -50,
      "type": "TRANSFER",
      "referenceId": "transfer-789-from",
      "metadata": {
        "action": "transfer_out",
        "toWalletId": "wallet-456"
      },
      "createdAt": "2023-12-19T12:10:00.000Z"
    }
  ]
}
```

## Error Handling

The API returns appropriate HTTP status codes and error messages in the following format:

```json
{
  "statusCode": 400,
  "error": "Error message describing the issue"
}
```

## Idempotency

All write operations (funding, transfers) support idempotency through a `referenceId` parameter. If the same `referenceId` is used more than once, the operation will be idempotent and return the same result as the first call without performing the operation again.

## Testing

To run the unit tests:

```bash
npm test
```

## Production Considerations

- **Persistence**: The current implementation uses in-memory storage. For production, you should use a database like PostgreSQL or MongoDB.
- **Transactions**: For production, consider using database transactions to ensure data consistency.
- **Validation**: Add more comprehensive validation for input data.
- **Security**: Implement authentication and authorization.
- **Rate Limiting**: Add rate limiting to prevent abuse.
- **Logging**: Add comprehensive logging for monitoring and debugging.
- **API Documentation**: Consider using Swagger/OpenAPI for interactive API documentation.

## License

This project is licensed under the MIT License.
