import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { checkProcessingAccess } from '@/lib/auth/subscription';
import { payrollQueue } from '@/lib/queue/client';

// Mock dependencies
vi.mock('next-auth');
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
    organization: {
        update: vi.fn().mockResolvedValue({ id: 'org-1' }),
    },
    auditLog: {
        create: vi.fn().mockResolvedValue({ id: 'audit-123' }),
    },
    exchangeRate: {
        findFirst: vi.fn(),
    }
  },
}));
vi.mock('@/lib/auth/subscription');
vi.mock('@/lib/ephemeral-engine/parser', () => ({
  parseCSVStream: async function* () {
    yield { name: 'John Doe', basicSalary: 1000, employeeId: 'EMP001' };
  },
  MappingRequiredError: class extends Error {}
}));

// Mock the queue client properly
vi.mock('@/lib/queue/client', () => ({
  payrollQueue: {
    add: vi.fn().mockResolvedValue({ id: 'job-123' }),
  },
  cronQueue: {
    add: vi.fn(),
  },
  connection: {},
}));

// Mock Logger
vi.mock('@/lib/logger', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
    }
}));

// Helper to create a mock request
const createMockRequest = () => {
  const formData = new FormData();
  const file = new File(['name,salary\nJohn,1000'], 'test.csv', { type: 'text/csv' });   
  formData.append('file', file);

  return {
    formData: () => Promise.resolve(formData),
    headers: new Headers(),
    url: 'http://localhost/api/ephemeral/process'
  } as unknown as Request;
};

describe('POST /api/ephemeral/process', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default successful auth and user
    (getServerSession as any).mockResolvedValue({ user: { id: 'user-1' } });    
    (db.user.findUnique as any).mockResolvedValue({
      id: 'user-1',
      organizationId: 'org-1',
      organization: {
        id: 'org-1',
        name: 'Test Org',
        nssaEnabled: true,
        nssaRate: { toNumber: () => 0.045 },
        nssaCeilingUSD: { toNumber: () => 700 },
        nssaCeilingZiG: { toNumber: () => 19600 },
        necEnabled: false,
        necRate: { toNumber: () => 0 },
        sdfEnabled: true,
        sdfRate: { toNumber: () => 0.01 },
        subscriptionTier: 'BUSINESS', 
        defaultCurrency: 'USD'
      }
    });

    // Mock exchange rate
    (db.exchangeRate.findFirst as any).mockResolvedValue({ rate: 25.0 });

    // Default to authorized
    (checkProcessingAccess as any).mockResolvedValue({ authorized: true, method: 'SUBSCRIPTION' });
  });

  it('should successfully queue a payroll job', async () => {
    const req = createMockRequest();
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.jobId).toBe('job-123');
    expect(data.auditId).toBe('audit-123');

    // Verify queue was called
    expect(payrollQueue.add).toHaveBeenCalledWith('process-payroll', expect.objectContaining({
        auditId: 'audit-123',
        orgInfo: expect.objectContaining({ id: 'org-1' })
    }));

    // Verify audit log was created
    expect(db.auditLog.create).toHaveBeenCalled();
  });

  it('should fail if user is not authenticated', async () => {
    (getServerSession as any).mockResolvedValue(null);
    const req = createMockRequest();
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('should fail if user has no organization', async () => {
     (db.user.findUnique as any).mockResolvedValue({
      id: 'user-1',
      organizationId: null
    });
    const req = createMockRequest();
    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});
