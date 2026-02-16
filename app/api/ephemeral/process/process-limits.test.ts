import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { checkProcessingAccess } from '@/lib/auth/subscription';

// Mock dependencies
vi.mock('next-auth');
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
    organization: {
        update: vi.fn(),
    },
    auditLog: {
        create: vi.fn(),
    }
  },
}));
vi.mock('@/lib/auth/subscription');
vi.mock('@/lib/ephemeral-engine/parser', () => ({
  parseCSVStream: async function* () {
    // Determine how many records to yield based on a global mock variable or similar mechanism
    // For simplicity, we'll control this via the input file content length in the test
    for (let i = 0; i < global.mockRecordCount; i++) {
        yield { name: `Employee ${i}`, salary: 1000 };
    }
  },
  MappingRequiredError: class extends Error {}
}));

// Helper to create a mock request
const createMockRequest = (recordCount: number, method: 'SUBSCRIPTION' | 'CREDIT') => {
  global.mockRecordCount = recordCount;
  
  const formData = new FormData();
  // Create a dummy file
  const file = new File(['dummy content'], 'test.csv', { type: 'text/csv' });
  formData.append('file', file);
  
  return {
    formData: () => Promise.resolve(formData),
    headers: new Headers(),
  } as unknown as Request;
};

describe('Process API Limits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default successful auth and user
    (getServerSession as any).mockResolvedValue({ user: { id: 'user-1' } });
    (db.user.findUnique as any).mockResolvedValue({
      id: 'user-1',
      organizationId: 'org-1',
      organization: {
        id: 'org-1',
        nssaEnabled: true,
        nssaRate: { toNumber: () => 0.045 },
        nssaCeilingUSD: { toNumber: () => 700 },
        nssaCeilingZiG: { toNumber: () => 19600 },
        necEnabled: false,
        necRate: { toNumber: () => 0 },
        sdfEnabled: true,
        sdfRate: { toNumber: () => 0.01 },
        subscriptionTier: 'MICRO', // Default to MICRO for tests
      }
    });
    
    // Default to authorized
    (checkProcessingAccess as any).mockResolvedValue({ authorized: true, method: 'SUBSCRIPTION' });
  });

  it('should enforce 100 employee limit for CREDIT users', async () => {
    // Setup CREDIT access
    (checkProcessingAccess as any).mockResolvedValue({ authorized: true, method: 'CREDIT' });
    
    // Attempt 101 records
    const req = createMockRequest(101, 'CREDIT');
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toContain('Credit processing is limited to 100 employees');
  });

  it('should allow 100 employees for CREDIT users', async () => {
    // Setup CREDIT access
    (checkProcessingAccess as any).mockResolvedValue({ authorized: true, method: 'CREDIT' });
    
    // Attempt 100 records (limit)
    const req = createMockRequest(100, 'CREDIT');
    const res = await POST(req);
    
    expect(res.status).toBe(200);
  });

  it('should enforce plan limits for SUBSCRIPTION users (MICRO)', async () => {
    // Setup SUBSCRIPTION access (MICRO limit is 10)
    (checkProcessingAccess as any).mockResolvedValue({ authorized: true, method: 'SUBSCRIPTION' });
    
    // Attempt 11 records
    const req = createMockRequest(11, 'SUBSCRIPTION');
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toContain('Plan limit exceeded');
    expect(data.error).toContain('Micro plan allows up to 10 employees');
  });

   it('should allow within limits for SUBSCRIPTION users (MICRO)', async () => {
    // Setup SUBSCRIPTION access
    (checkProcessingAccess as any).mockResolvedValue({ authorized: true, method: 'SUBSCRIPTION' });
    
    // Attempt 10 records
    const req = createMockRequest(10, 'SUBSCRIPTION');
    const res = await POST(req);
    
    expect(res.status).toBe(200);
  });
});

// Add global type for the mock
declare global {
    var mockRecordCount: number;
}
