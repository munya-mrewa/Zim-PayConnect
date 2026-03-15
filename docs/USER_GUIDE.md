# Zim-PayConnect User Guide

## Overview
Zim-PayConnect is a secure, ephemeral payroll processing engine designed for ZIMRA TaRMS compliance. It processes your payroll data in memory, calculates taxes (PAYE, AIDS Levy), handles statutory deductions (NSSA, NEC, SDF), and generates compliant PDF payslips and reports without storing your sensitive employee data.

## Getting Started

### 1. Account Setup
- **Register:** Create an account at the registration page.
- **Organization Profile:** Complete your profile in **Settings**. Ensure your "Default Currency" and tax settings (NSSA, NEC, SDF) are correct.

### 2. The Credit System
Zim-PayConnect uses a "Credits" or "Subscription" model:
- **Subscriptions:** Monthly or Yearly plans (e.g., Micro, Business, Agency) give you a set number of employee records you can process per month.
- **Pay-Per-Process (Credits):** You can purchase "Processing Credits" for one-off payroll runs. 1 Credit = 1 Payroll Run (batch).
- **Trial:** New accounts get a 7-day free trial.

### 3. Preparing Your Payroll Data (CSV)
The system accepts a CSV file. You can download a sample directly from the **Upload** page.

**Required Columns:**
| Column Name | Description | Example |
| :--- | :--- | :--- |
| `EmployeeID` | Unique ID for the employee | `E001` |
| `Name` | Full Name | `John Doe` |
| `Basic Salary` | Gross Basic Salary | `1500.00` |

**Optional/Recommended Columns:**
| Column Name | Description | Example |
| :--- | :--- | :--- |
| `TIN` | Taxpayer Identification Number | `2000000000` |
| `Allowances` | Taxable Allowances | `200.00` |
| `Tax Exempt Allowances` | Non-Taxable Allowances | `50.00` |
| `Currency` | 'USD' or 'ZiG' (Defaults to Org setting if empty) | `USD` |
| `Permanent` | `true` (FDS) or `false` (Non-FDS/Casual) | `true` |
| `YTD Gross` | Year-to-Date Gross (for FDS calculation) | `15000.00` |
| `YTD Tax Paid` | Year-to-Date Tax Paid (for FDS calculation) | `3500.00` |

*Note: If your CSV headers do not match exactly, the system will ask you to map them after upload.*

### 4. Processing Payroll
1.  Navigate to the **Upload** page.
2.  Select the **Processing Month**.
3.  Upload your CSV file.
4.  (If needed) Map your columns.
5.  Wait for processing.
6.  **Download ZIP:** Once complete, download the secure ZIP file containing:
    - Individual PDF Payslips
    - Payroll Summary (Excel/CSV)
    - ZIMRA Returns (P2 Returns)
    - Bank Payment File

### 5. Security
- **Ephemeral Processing:** Data is processed in RAM and purged immediately after the session or within 24 hours of file generation.
- **Encryption:** All generated ZIP files are encrypted at rest.

## Support
For issues, contact your Dedicated Account Manager (Enterprise) or email support@zim-payconnect.com.
