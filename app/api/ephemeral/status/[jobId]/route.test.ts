import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { getServerSession } from 'next-auth';
import { payrollQueue } from '@/lib/queue/client';

// Mock dependencies
vi.mock('next-auth');

// Mock Queue
vi.mock('@/lib/queue/client', () => ({
  payrollQueue: {
    getJob: vi.fn(),
  },
  cronQueue: {},
  connection: {},
}));

describe('GET /api/ephemeral/status/[jobId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getServerSession as any).mockResolvedValue({ user: { id: 'user-1' } });
  });

  const mockParams = Promise.resolve({ jobId: 'job-123' });

  it('should return job status when job exists', async () => {
    (payrollQueue.getJob as any).mockResolvedValue({
      id: 'job-123',
      getState: vi.fn().mockResolvedValue('active'),
      progress: 50,
      returnvalue: null,
    });

    const req = new Request('http://localhost/api/ephemeral/status/job-123');
    const res = await GET(req, { params: mockParams });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe('active');
    expect(data.progress).toBe(50);
  });

  it('should return completed status with fileId', async () => {
    (payrollQueue.getJob as any).mockResolvedValue({
      id: 'job-123',
      getState: vi.fn().mockResolvedValue('completed'),
      progress: 100,
      returnvalue: { fileId: 'file-xyz', recordCount: 10 },
    });

    const req = new Request('http://localhost/api/ephemeral/status/job-123');
    const res = await GET(req, { params: mockParams });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe('completed');
    expect(data.fileId).toBe('file-xyz');
    expect(data.recordCount).toBe(10);
  });

  it('should return 404 if job not found', async () => {
    (payrollQueue.getJob as any).mockResolvedValue(null);

    const req = new Request('http://localhost/api/ephemeral/status/job-123');
    const res = await GET(req, { params: mockParams });
    
    expect(res.status).toBe(404);
  });

  it('should return 401 if unauthorized', async () => {
    (getServerSession as any).mockResolvedValue(null);
    
    const req = new Request('http://localhost/api/ephemeral/status/job-123');
    const res = await GET(req, { params: mockParams });
    
    expect(res.status).toBe(401);
  });
});
