import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, DELETE } from './route';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';

vi.mock('next-auth');
vi.mock('@/lib/db', () => ({
  db: {
    apiKey: {
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
    }
  },
}));

describe('API Keys Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('should return 401 if unauthorized', async () => {
      (getServerSession as any).mockResolvedValue(null);
      const res = await GET(new Request('http://localhost/api/api-keys'));
      expect(res.status).toBe(401);
    });

    it('should return keys for organization', async () => {
      (getServerSession as any).mockResolvedValue({ user: { organizationId: 'org-1' } });
      const mockKeys = [{ id: 'key-1', name: 'Test Key' }];
      (db.apiKey.findMany as any).mockResolvedValue(mockKeys);

      const res = await GET(new Request('http://localhost/api/api-keys'));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual(mockKeys);
      expect(db.apiKey.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { organizationId: 'org-1', revokedAt: null }
      }));
    });
  });

  describe('POST', () => {
    it('should return 403 if not AGENCY/ENTERPRISE', async () => {
      (getServerSession as any).mockResolvedValue({ user: { organizationId: 'org-1' } });
      (db.organization.findUnique as any).mockResolvedValue({ subscriptionTier: 'FREE' });

      const res = await POST(new Request('http://localhost/api/api-keys', {
        method: 'POST',
        body: JSON.stringify({ name: 'New Key' })
      }));

      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: 'Upgrade required' });
    });

    it('should create a key for ENTERPRISE organization', async () => {
      (getServerSession as any).mockResolvedValue({ user: { organizationId: 'org-1' } });
      (db.organization.findUnique as any).mockResolvedValue({ subscriptionTier: 'ENTERPRISE' });
      (db.apiKey.create as any).mockImplementation(({ data }: any) => Promise.resolve({ id: 'new-key-id', ...data }));

      const res = await POST(new Request('http://localhost/api/api-keys', {
        method: 'POST',
        body: JSON.stringify({ name: 'Prod Key', scopes: ['read', 'write'] })
      }));

      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.name).toBe('Prod Key');
      expect(data.secretKey).toBeDefined();
      expect(data.secretKey.startsWith('sk_live_')).toBe(true);
      expect(db.apiKey.create).toHaveBeenCalled();
    });
  });

  describe('DELETE', () => {
    it('should revoke a key', async () => {
      (getServerSession as any).mockResolvedValue({ user: { organizationId: 'org-1' } });
      
      const res = await DELETE(new Request('http://localhost/api/api-keys?id=key-1', {
        method: 'DELETE'
      }));

      expect(res.status).toBe(200);
      expect(db.apiKey.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'key-1', organizationId: 'org-1' },
        data: { revokedAt: expect.any(Date) }
      }));
    });

    it('should return 400 if ID missing', async () => {
        (getServerSession as any).mockResolvedValue({ user: { organizationId: 'org-1' } });
        const res = await DELETE(new Request('http://localhost/api/api-keys', { method: 'DELETE' }));
        expect(res.status).toBe(400);
    });
  });
});
