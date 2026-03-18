import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { ApiKeyService } from '@/lib/auth/api-key';
import { payrollQueue } from '@/lib/queue/client';
import { AuditService } from '@/lib/audit-service';

// Mock the dependencies
vi.mock('@/lib/auth/api-key', () => ({
  ApiKeyService: {
    validate: vi.fn(),
  },
}));

vi.mock('@/lib/queue/client', () => ({
  payrollQueue: {
    add: vi.fn(),
  },
}));

vi.mock('@/lib/audit-service', () => ({
  AuditService: {
    log: vi.fn(),
  },
}));

vi.mock('@/lib/db', () => ({
  db: {
    exchangeRate: {
      findFirst: vi.fn().mockResolvedValue({ rate: 28.00 }),
    },
  },
}));

describe('POST /api/v1/payroll/process', () => {
  const mockOrg = {
    id: 'org_123',
    name: 'Test Org',
    nssaEnabled: true,
    nssaRate: 0.045,
    nssaCeilingUSD: 700,
    nssaCeilingZiG: 19600,
    necEnabled: false,
    necRate: 0,
    sdfEnabled: true,
    sdfRate: 0.01,
    defaultCurrency: 'USD',
  };

  const validPayload = {
    records: [
      { employeeId: 'E1', name: 'John Doe', grossIncome: 1000, currency: 'USD' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if Authorization header is missing', async () => {
    const req = new Request('http://localhost:3000/api/v1/payroll/process', {
      method: 'POST',
      body: JSON.stringify(validPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Missing or invalid Authorization header');
  });

  it('should return 401 if API key is invalid', async () => {
    vi.mocked(ApiKeyService.validate).mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/v1/payroll/process', {
      method: 'POST',
      headers: { Authorization: 'Bearer invalid_key' },
      body: JSON.stringify(validPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('should return 400 if payload is missing records array', async () => {
    vi.mocked(ApiKeyService.validate).mockResolvedValue(mockOrg as any);

    const req = new Request('http://localhost:3000/api/v1/payroll/process', {
      method: 'POST',
      headers: { Authorization: 'Bearer valid_key' },
      body: JSON.stringify({ wrongKey: [] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should return 400 if records array is empty', async () => {
    vi.mocked(ApiKeyService.validate).mockResolvedValue(mockOrg as any);

    const req = new Request('http://localhost:3000/api/v1/payroll/process', {
      method: 'POST',
      headers: { Authorization: 'Bearer valid_key' },
      body: JSON.stringify({ records: [] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should queue the job and return 200 on success', async () => {
    vi.mocked(ApiKeyService.validate).mockResolvedValue(mockOrg as any);
    vi.mocked(AuditService.log).mockResolvedValue({ id: 'audit_123' } as any);
    vi.mocked(payrollQueue.add).mockResolvedValue({ id: 'job_456' } as any);

    const req = new Request('http://localhost:3000/api/v1/payroll/process', {
      method: 'POST',
      headers: { Authorization: 'Bearer valid_key' },
      body: JSON.stringify(validPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toMatchObject({
      jobId: 'job_456',
      status: 'queued',
      recordCount: 1,
      trackingId: 'audit_123',
    });

    // Check if queue was called
    expect(payrollQueue.add).toHaveBeenCalledTimes(1);
    expect(payrollQueue.add).toHaveBeenCalledWith('process-payroll', expect.objectContaining({
      records: validPayload.records,
      auditId: 'audit_123',
    }));
  });

  it('should limit batch size to 500 records', async () => {
    vi.mocked(ApiKeyService.validate).mockResolvedValue(mockOrg as any);

    const largePayload = {
      records: Array.from({ length: 501 }, (_, i) => ({ employeeId: `E${i}`, name: `Name${i}`, grossIncome: 1000, currency: 'USD' })),
    };

    const req = new Request('http://localhost:3000/api/v1/payroll/process', {
      method: 'POST',
      headers: { Authorization: 'Bearer valid_key' },
      body: JSON.stringify(largePayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('limit exceeded');
  });
});
