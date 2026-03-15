import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, DELETE } from './route';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';

vi.mock('next-auth');
vi.mock('@/lib/db', () => ({
  db: {
    webhookEndpoint: {
      findMany: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
    }
  },
}));

describe('Webhooks Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('should return endpoints for organization', async () => {
      (getServerSession as any).mockResolvedValue({ user: { organizationId: 'org-1' } });
      const mockEndpoints = [{ id: 'wh-1', url: 'https://test.com/hook' }];
      (db.webhookEndpoint.findMany as any).mockResolvedValue(mockEndpoints);

      const res = await GET(new Request('http://localhost/api/webhooks'));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual(mockEndpoints);
      expect(db.webhookEndpoint.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { organizationId: 'org-1' }
      }));
    });
  });

  describe('POST', () => {
    it('should create a webhook for ENTERPRISE organization', async () => {
      (getServerSession as any).mockResolvedValue({ user: { organizationId: 'org-1' } });
      (db.organization.findUnique as any).mockResolvedValue({ subscriptionTier: 'ENTERPRISE' });
      (db.webhookEndpoint.create as any).mockImplementation(({ data }: any) => Promise.resolve({ id: 'wh-1', ...data }));

      const res = await POST(new Request('http://localhost/api/webhooks', {
        method: 'POST',
        body: JSON.stringify({ 
            url: 'https://example.com/webhook', 
            events: ['payroll.processed'],
            secret: 'shhh'
        })
      }));

      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.url).toBe('https://example.com/webhook');
      expect(db.webhookEndpoint.create).toHaveBeenCalled();
    });

    it('should return 400 if URL or events missing', async () => {
        (getServerSession as any).mockResolvedValue({ user: { organizationId: 'org-1' } });
        const res = await POST(new Request('http://localhost/api/webhooks', {
            method: 'POST',
            body: JSON.stringify({ url: 'https://example.com' }) // Missing events
        }));
        expect(res.status).toBe(400);
    });
  });

  describe('DELETE', () => {
    it('should delete a webhook', async () => {
      (getServerSession as any).mockResolvedValue({ user: { organizationId: 'org-1' } });
      
      const res = await DELETE(new Request('http://localhost/api/webhooks?id=wh-1', {
        method: 'DELETE'
      }));

      expect(res.status).toBe(200);
      expect(db.webhookEndpoint.deleteMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'wh-1', organizationId: 'org-1' }
      }));
    });
  });
});
