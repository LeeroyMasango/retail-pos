# Retail POS - API Documentation

Complete API reference for the Retail POS backend system.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Getting a Token

Login to receive a JWT token:

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "full_name": "System Administrator",
    "email": "admin@retailstore.com"
  }
}
```

## Role-Based Access

- **Cashier**: Can scan products, create sales, view own transactions
- **Manager**: All cashier permissions + inventory management, analytics
- **Admin**: All permissions + user management, system settings

---

## Authentication Endpoints

### Login

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

**Response:** `200 OK`
```json
{
  "token": "string",
  "user": {
    "id": "number",
    "username": "string",
    "role": "string",
    "full_name": "string",
    "email": "string"
  }
}
```

### Register User

```http
POST /api/auth/register
Authorization: Bearer TOKEN
```

**Request Body:**
```json
{
  "username": "string (required)",
  "password": "string (required)",
  "role": "string (required: admin|manager|cashier)",
  "full_name": "string (optional)",
  "email": "string (optional)"
}
```

**Response:** `201 Created`
```json
{
  "message": "User created successfully",
  "userId": 5
}
```

### Get Current User

```http
GET /api/auth/me
Authorization: Bearer TOKEN
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "username": "admin",
  "role": "admin",
  "full_name": "System Administrator",
  "email": "admin@retailstore.com",
  "created_at": "2025-09-30T12:00:00.000Z"
}
```

### Get All Users

```http
GET /api/auth/users
Authorization: Bearer TOKEN
```

**Permissions:** Manager, Admin

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "full_name": "System Administrator",
    "email": "admin@retailstore.com",
    "active": 1,
    "created_at": "2025-09-30T12:00:00.000Z"
  }
]
```

---

## Product Endpoints

### Get All Products

```http
GET /api/products
Authorization: Bearer TOKEN
```

**Query Parameters:**
- `active` (boolean): Filter by active status
- `category` (string): Filter by category
- `search` (string): Search in name, barcode, description

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "barcode": "8901234567890",
    "name": "Coca Cola 500ml",
    "description": "Refreshing cola drink",
    "price": 1.99,
    "cost": 1.20,
    "category": "Beverages",
    "stock_quantity": 100,
    "min_stock_level": 20,
    "image_url": null,
    "active": 1,
    "created_at": "2025-09-30T12:00:00.000Z",
    "updated_at": "2025-09-30T12:00:00.000Z"
  }
]
```

### Get Product by Barcode

```http
GET /api/products/barcode/:barcode
Authorization: Bearer TOKEN
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "barcode": "8901234567890",
  "name": "Coca Cola 500ml",
  "price": 1.99,
  "stock_quantity": 100,
  ...
}
```

### Get Product by ID

```http
GET /api/products/:id
Authorization: Bearer TOKEN
```

**Response:** `200 OK`

### Create Product

```http
POST /api/products
Authorization: Bearer TOKEN
```

**Permissions:** Manager, Admin

**Request Body:**
```json
{
  "barcode": "string (required, unique)",
  "name": "string (required)",
  "description": "string (optional)",
  "price": "number (required)",
  "cost": "number (optional)",
  "category": "string (optional)",
  "stock_quantity": "number (default: 0)",
  "min_stock_level": "number (default: 10)",
  "image_url": "string (optional)"
}
```

**Response:** `201 Created`
```json
{
  "message": "Product created successfully",
  "productId": 21
}
```

### Update Product

```http
PUT /api/products/:id
Authorization: Bearer TOKEN
```

**Permissions:** Manager, Admin

**Request Body:** (all fields optional)
```json
{
  "barcode": "string",
  "name": "string",
  "price": "number",
  "stock_quantity": "number",
  "active": "boolean",
  ...
}
```

**Response:** `200 OK`
```json
{
  "message": "Product updated successfully"
}
```

### Delete Product

```http
DELETE /api/products/:id
Authorization: Bearer TOKEN
```

**Permissions:** Admin only

**Response:** `200 OK`
```json
{
  "message": "Product deleted successfully"
}
```

### Get Categories

```http
GET /api/products/meta/categories
Authorization: Bearer TOKEN
```

**Response:** `200 OK`
```json
["Beverages", "Snacks", "Dairy", "Bakery", "Produce"]
```

---

## Sales Endpoints

### Create Sale

```http
POST /api/sales
Authorization: Bearer TOKEN
```

**Request Body:**
```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    },
    {
      "product_id": 3,
      "quantity": 1
    }
  ],
  "payment_method": "cash|card|mobile|other (optional)",
  "discount_amount": 0,
  "notes": "string (optional)"
}
```

**Response:** `201 Created`
```json
{
  "message": "Sale completed successfully",
  "saleId": 15,
  "transactionId": "550e8400-e29b-41d4-a716-446655440000",
  "subtotal": 25.97,
  "taxAmount": 2.60,
  "taxRate": 0.10,
  "discount_amount": 0,
  "total": 28.57,
  "items": [...]
}
```

### Get All Sales

```http
GET /api/sales
Authorization: Bearer TOKEN
```

**Query Parameters:**
- `start_date` (string): Filter from date (YYYY-MM-DD)
- `end_date` (string): Filter to date (YYYY-MM-DD)
- `status` (string): Filter by status (completed|refunded|cancelled)
- `limit` (number): Results per page (default: 100)
- `offset` (number): Pagination offset (default: 0)

**Response:** `200 OK`
```json
[
  {
    "id": 15,
    "transaction_id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": 1,
    "username": "cashier1",
    "full_name": "John Doe",
    "subtotal": 25.97,
    "tax_amount": 2.60,
    "tax_rate": 0.10,
    "discount_amount": 0,
    "total": 28.57,
    "payment_method": "cash",
    "status": "completed",
    "notes": null,
    "created_at": "2025-09-30T14:30:00.000Z"
  }
]
```

### Get Sale by ID

```http
GET /api/sales/:id
Authorization: Bearer TOKEN
```

**Response:** `200 OK`
```json
{
  "id": 15,
  "transaction_id": "550e8400-e29b-41d4-a716-446655440000",
  "subtotal": 25.97,
  "total": 28.57,
  "items": [
    {
      "id": 1,
      "sale_id": 15,
      "product_id": 1,
      "barcode": "8901234567890",
      "product_name": "Coca Cola 500ml",
      "quantity": 2,
      "unit_price": 1.99,
      "subtotal": 3.98
    }
  ],
  ...
}
```

### Get Sale by Transaction ID

```http
GET /api/sales/transaction/:transactionId
Authorization: Bearer TOKEN
```

**Response:** `200 OK` (same as Get Sale by ID)

### Generate Receipt

```http
GET /api/sales/:id/receipt?format=pdf
Authorization: Bearer TOKEN
```

**Query Parameters:**
- `format` (string): pdf|txt (default: pdf)

**Response:** `200 OK`
```json
{
  "message": "Receipt generated successfully",
  "path": "/path/to/receipt_550e8400.pdf",
  "url": "/receipts/receipt_550e8400.pdf"
}
```

### Refund Sale

```http
POST /api/sales/:id/refund
Authorization: Bearer TOKEN
```

**Permissions:** Manager, Admin

**Response:** `200 OK`
```json
{
  "message": "Sale refunded successfully"
}
```

---

## Inventory Endpoints

### Get Inventory Overview

```http
GET /api/inventory/overview
Authorization: Bearer TOKEN
```

**Response:** `200 OK`
```json
{
  "total_products": 20,
  "total_stock_value": 5432.10,
  "low_stock_count": 3,
  "out_of_stock_count": 1
}
```

### Get Low Stock Products

```http
GET /api/inventory/low-stock
Authorization: Bearer TOKEN
```

**Response:** `200 OK`
```json
[
  {
    "id": 5,
    "barcode": "8901234567894",
    "name": "Eggs 12 pack",
    "stock_quantity": 8,
    "min_stock_level": 15,
    ...
  }
]
```

### Get Out of Stock Products

```http
GET /api/inventory/out-of-stock
Authorization: Bearer TOKEN
```

**Response:** `200 OK`

### Get Inventory Alerts

```http
GET /api/inventory/alerts
Authorization: Bearer TOKEN
```

**Response:** `200 OK`
```json
[
  {
    "type": "out_of_stock",
    "severity": "critical",
    "product_id": 10,
    "product_name": "Butter 250g",
    "barcode": "8901234567899",
    "current_stock": 0,
    "message": "Butter 250g is out of stock"
  },
  {
    "type": "low_stock",
    "severity": "warning",
    "product_id": 5,
    "product_name": "Eggs 12 pack",
    "current_stock": 8,
    "threshold": 10,
    "message": "Eggs 12 pack stock is low (8 remaining)"
  }
]
```

### Restock Product

```http
POST /api/inventory/restock
Authorization: Bearer TOKEN
```

**Permissions:** Manager, Admin

**Request Body:**
```json
{
  "product_id": 5,
  "quantity": 50,
  "notes": "Weekly restock (optional)"
}
```

**Response:** `200 OK`
```json
{
  "message": "Product restocked successfully",
  "product_id": 5,
  "quantity_before": 8,
  "quantity_after": 58,
  "quantity_added": 50
}
```

### Adjust Inventory

```http
POST /api/inventory/adjust
Authorization: Bearer TOKEN
```

**Permissions:** Manager, Admin

**Request Body:**
```json
{
  "product_id": 5,
  "new_quantity": 100,
  "notes": "Physical count adjustment (optional)"
}
```

**Response:** `200 OK`
```json
{
  "message": "Inventory adjusted successfully",
  "product_id": 5,
  "quantity_before": 58,
  "quantity_after": 100,
  "quantity_change": 42
}
```

### Get Inventory Transactions

```http
GET /api/inventory/transactions
Authorization: Bearer TOKEN
```

**Query Parameters:**
- `product_id` (number): Filter by product
- `transaction_type` (string): sale|restock|adjustment|return
- `start_date` (string): From date
- `end_date` (string): To date
- `limit` (number): Default 100
- `offset` (number): Default 0

**Response:** `200 OK`
```json
[
  {
    "id": 45,
    "product_id": 5,
    "product_name": "Eggs 12 pack",
    "barcode": "8901234567894",
    "transaction_type": "restock",
    "quantity_change": 50,
    "quantity_before": 8,
    "quantity_after": 58,
    "reference_id": null,
    "user_id": 2,
    "username": "manager1",
    "notes": "Weekly restock",
    "created_at": "2025-09-30T15:00:00.000Z"
  }
]
```

### Get Fast-Moving Items

```http
GET /api/inventory/fast-moving
Authorization: Bearer TOKEN
```

**Query Parameters:**
- `days` (number): Time period (default: 30)
- `limit` (number): Results count (default: 10)

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "barcode": "8901234567890",
    "name": "Coca Cola 500ml",
    "category": "Beverages",
    "price": 1.99,
    "stock_quantity": 75,
    "total_sold": 125,
    "transaction_count": 45
  }
]
```

---

## Analytics Endpoints

### Get Dashboard

```http
GET /api/analytics/dashboard
Authorization: Bearer TOKEN
```

**Response:** `200 OK`
```json
{
  "today": {
    "date": "2025-09-30",
    "transaction_count": 15,
    "total_revenue": 450.75
  },
  "month": {
    "start_date": "2025-09-01",
    "transaction_count": 320,
    "total_revenue": 8750.50
  },
  "inventory": {
    "total_products": 20,
    "low_stock_count": 3,
    "out_of_stock_count": 1
  },
  "top_products": [
    {
      "name": "Coca Cola 500ml",
      "total_sold": 25
    }
  ]
}
```

### Get Daily Summary

```http
GET /api/analytics/daily-summary?date=2025-09-30
Authorization: Bearer TOKEN
```

**Query Parameters:**
- `date` (string): Date in YYYY-MM-DD format (default: today)

**Response:** `200 OK`
```json
{
  "date": "2025-09-30",
  "total_revenue": 450.75,
  "total_transactions": 15,
  "total_items_sold": 48,
  "average_transaction_value": 30.05,
  "tax_collected": 40.98,
  "discounts_given": 15.00
}
```

### Get Sales by Date Range

```http
GET /api/analytics/sales-by-date?start_date=2025-09-01&end_date=2025-09-30
Authorization: Bearer TOKEN
```

**Response:** `200 OK`
```json
[
  {
    "date": "2025-09-30",
    "transaction_count": 15,
    "total_revenue": 450.75,
    "tax_collected": 40.98,
    "average_transaction_value": 30.05
  }
]
```

### Get Sales by Category

```http
GET /api/analytics/sales-by-category?start_date=2025-09-01&end_date=2025-09-30
Authorization: Bearer TOKEN
```

**Response:** `200 OK`
```json
[
  {
    "category": "Beverages",
    "transaction_count": 45,
    "items_sold": 120,
    "total_revenue": 238.80
  }
]
```

### Get Top Products

```http
GET /api/analytics/top-products?limit=10
Authorization: Bearer TOKEN
```

**Query Parameters:**
- `start_date` (string): Optional
- `end_date` (string): Optional
- `limit` (number): Default 10

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "barcode": "8901234567890",
    "name": "Coca Cola 500ml",
    "category": "Beverages",
    "price": 1.99,
    "total_sold": 125,
    "total_revenue": 248.75,
    "transaction_count": 45
  }
]
```

### Export Data

```http
GET /api/analytics/export?type=sales&start_date=2025-09-01&end_date=2025-09-30
Authorization: Bearer TOKEN
```

**Query Parameters:**
- `type` (string): sales|products|inventory (required)
- `start_date` (string): Required for sales/inventory
- `end_date` (string): Required for sales/inventory

**Response:** `200 OK`
```json
{
  "message": "Export completed successfully",
  "filename": "sales_export_1727712000000.csv",
  "url": "/exports/sales_export_1727712000000.csv",
  "records": 320
}
```

---

## Settings Endpoints

### Get All Settings

```http
GET /api/settings
Authorization: Bearer TOKEN
```

**Response:** `200 OK`
```json
{
  "tax_rate": {
    "value": "0.10",
    "updated_at": "2025-09-30T12:00:00.000Z"
  },
  "currency": {
    "value": "USD",
    "updated_at": "2025-09-30T12:00:00.000Z"
  },
  "currency_symbol": {
    "value": "$",
    "updated_at": "2025-09-30T12:00:00.000Z"
  },
  ...
}
```

### Get Specific Setting

```http
GET /api/settings/:key
Authorization: Bearer TOKEN
```

**Response:** `200 OK`
```json
{
  "key": "tax_rate",
  "value": "0.10",
  "updated_at": "2025-09-30T12:00:00.000Z"
}
```

### Update Setting

```http
PUT /api/settings/:key
Authorization: Bearer TOKEN
```

**Permissions:** Manager, Admin

**Request Body:**
```json
{
  "value": "0.15"
}
```

**Response:** `200 OK`
```json
{
  "message": "Setting updated successfully",
  "key": "tax_rate",
  "value": "0.15"
}
```

### Bulk Update Settings

```http
POST /api/settings/bulk-update
Authorization: Bearer TOKEN
```

**Permissions:** Manager, Admin

**Request Body:**
```json
{
  "tax_rate": "0.15",
  "currency": "EUR",
  "currency_symbol": "€"
}
```

**Response:** `200 OK`
```json
{
  "message": "Settings updated successfully",
  "updated": ["tax_rate", "currency", "currency_symbol"]
}
```

---

## Sync Endpoints (Offline Support)

### Queue Operation

```http
POST /api/sync/queue
Authorization: Bearer TOKEN
```

**Request Body:**
```json
{
  "operation": "create",
  "entity_type": "sale",
  "entity_id": null,
  "data": {
    "items": [...],
    "payment_method": "cash"
  }
}
```

**Response:** `201 Created`
```json
{
  "message": "Operation queued for sync",
  "queueId": 5
}
```

### Get Pending Operations

```http
GET /api/sync/pending?limit=100
Authorization: Bearer TOKEN
```

**Response:** `200 OK`
```json
[
  {
    "id": 5,
    "operation": "create",
    "entity_type": "sale",
    "entity_id": null,
    "data": {...},
    "status": "pending",
    "created_at": "2025-09-30T16:00:00.000Z"
  }
]
```

### Mark as Synced

```http
PUT /api/sync/:id/synced
Authorization: Bearer TOKEN
```

**Response:** `200 OK`
```json
{
  "message": "Operation marked as synced"
}
```

### Get Sync Stats

```http
GET /api/sync/stats
Authorization: Bearer TOKEN
```

**Response:** `200 OK`
```json
{
  "pending": 5,
  "synced": 120,
  "failed": 2,
  "last_sync": "2025-09-30T16:30:00.000Z"
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 409 Conflict
```json
{
  "error": "Resource already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Something went wrong!",
  "message": "Detailed error message (development only)"
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. For production use, consider implementing rate limiting middleware.

## Pagination

Endpoints that return lists support pagination:
- `limit`: Number of results per page (default varies by endpoint)
- `offset`: Number of results to skip

Example:
```http
GET /api/sales?limit=20&offset=40
```

Returns results 41-60.

---

**API Version:** 1.0.0  
**Last Updated:** 2025-09-30
