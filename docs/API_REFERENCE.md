# Zim-PayConnect API Reference v1

Welcome to the Zim-PayConnect API! This API allows enterprise organizations and accounting software integrations to push salary data into the system programmatically for automated tax calculation, report generation, and compliance handling.

## Authentication

The API uses **API Keys** for authentication. You must include your API key in the `Authorization` header of every request as a Bearer token.

**Example Header:**
```http
Authorization: Bearer sk_live_your_api_key_here
```

*Note: API Keys can be generated in the Zim-PayConnect Dashboard under the **API & Webhooks** section (available for Enterprise plans).*

---

## Endpoints

### 1. Process Payroll

Submit a batch of raw payroll records for processing. This is an asynchronous operation. The system will queue the records, process them, calculate taxes (PAYE, NSSA, NEC, SDF), and generate compliance reports (PDF/CSV/GL).

**Endpoint:** `POST /api/v1/payroll/process`

#### Request Headers

| Header | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `Authorization` | string | Yes | `Bearer {api_key}` |
| `Content-Type` | string | Yes | `application/json` |

#### Request Body

The request body must be a JSON object containing an array of `records`.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `records` | array | Yes | An array of employee payroll records. Max 500 per request. |
| `processingMonth` | integer | No | The month being processed (1-12). Defaults to the current month. |

**Record Object Structure:**

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `employeeId` | string | Yes | Unique identifier for the employee. |
| `name` | string | Yes | Full name of the employee. |
| `grossIncome` | number | Yes | Total gross income before deductions. |
| `currency` | string | Yes | "USD" or "ZIG". |
| `allowances` | number | No | Non-taxable allowances. |
| `deductions` | number | No | Pre-tax deductions. |
| `nssaNumber` | string | No | Employee's NSSA registration number. |
| `department` | string | No | Department code for GL mapping. |

#### Example Request

```bash
curl -X POST https://your-domain.com/api/v1/payroll/process \
  -H "Authorization: Bearer sk_live_example123" \
  -H "Content-Type: application/json" \
  -d '{
    "processingMonth": 8,
    "records": [
      {
        "employeeId": "EMP-001",
        "name": "John Doe",
        "grossIncome": 1500.00,
        "currency": "USD",
        "allowances": 100.00,
        "department": "Engineering"
      },
      {
        "employeeId": "EMP-002",
        "name": "Jane Smith",
        "grossIncome": 28000.00,
        "currency": "ZIG",
        "department": "Marketing"
      }
    ]
  }'
```

#### Response

Returns a `200 OK` status with job tracking information if the payload is accepted.

**Success Response (200 OK):**

```json
{
  "jobId": "12345-abcde-67890",
  "status": "queued",
  "recordCount": 2,
  "trackingId": "audit_abc123"
}
```

**Error Responses:**

*   `400 Bad Request`: Missing records array, invalid payload structure, or batch limit exceeded.
*   `401 Unauthorized`: Missing, invalid, or revoked API Key.
*   `500 Internal Server Error`: Server-side processing failure.

---

## Rate Limits & Quotas

*   **Batch Size:** Maximum of 500 records per API request. For larger payrolls, please split the records into multiple requests.
*   **Rate Limit:** 60 requests per minute per IP/API Key.

## Webhooks (Coming Soon)

Once a payroll batch finishes processing, you will be able to receive asynchronous notifications via Webhooks configured in your dashboard. The webhook payload will include the `jobId` and download links for the generated GL exports and tax reports.
