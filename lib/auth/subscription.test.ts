import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkProcessingAccess, checkSubscriptionAccess } from './subscription';
import { db } from '@/lib/db';

// Mock the db module
vi.mock('@/lib/db', () => ({
  db: {
    organization: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Subscription Logic', () => {
  const mockOrgId = 'org-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkSubscriptionAccess', () => {
    it('returns true for active trial', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      
      (db.organization.findUnique as any).mockResolvedValue({
        subscriptionStatus: 'TRIAL',
        trialEndsAt: futureDate,
        subscriptionEndsAt: null,
      });

      const result = await checkSubscriptionAccess(mockOrgId);
      expect(result).toBe(true);
    });

    it('returns false for expired trial', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      (db.organization.findUnique as any).mockResolvedValue({
        subscriptionStatus: 'TRIAL',
        trialEndsAt: pastDate,
        subscriptionEndsAt: null,
      });

      const result = await checkSubscriptionAccess(mockOrgId);
      expect(result).toBe(false);
    });

    it('returns true for active subscription', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      
      (db.organization.findUnique as any).mockResolvedValue({
        subscriptionStatus: 'ACTIVE',
        trialEndsAt: null,
        subscriptionEndsAt: futureDate,
      });

      const result = await checkSubscriptionAccess(mockOrgId);
      expect(result).toBe(true);
    });

    it('returns false for expired subscription', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      (db.organization.findUnique as any).mockResolvedValue({
        subscriptionStatus: 'ACTIVE',
        trialEndsAt: null,
        subscriptionEndsAt: pastDate,
      });

      const result = await checkSubscriptionAccess(mockOrgId);
      expect(result).toBe(false);
    });
  });

  describe('checkProcessingAccess', () => {
    it('authorizes via SUBSCRIPTION if active', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      
      (db.organization.findUnique as any).mockResolvedValueOnce({
        subscriptionStatus: 'ACTIVE',
        trialEndsAt: null,
        subscriptionEndsAt: futureDate,
      });

      const result = await checkProcessingAccess(mockOrgId);
      expect(result).toEqual({ authorized: true, method: 'SUBSCRIPTION' });
      // Should stop after first check returns true
      expect(db.organization.findUnique).toHaveBeenCalledTimes(1);
    });

    it('authorizes via CREDIT if subscription fails but credits exist', async () => {
      // First call (checkSubscriptionAccess) returns false (expired trial)
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      (db.organization.findUnique as any)
        .mockResolvedValueOnce({
            subscriptionStatus: 'TRIAL',
            trialEndsAt: pastDate,
            subscriptionEndsAt: null,
        })
        // Second call (checkProcessingAccess credits check) returns credits
        .mockResolvedValueOnce({
            credits: 5
        });

      const result = await checkProcessingAccess(mockOrgId);
      expect(result).toEqual({ authorized: true, method: 'CREDIT' });
      expect(db.organization.findUnique).toHaveBeenCalledTimes(2);
    });

    it('denies access if no subscription and no credits', async () => {
       // First call (checkSubscriptionAccess) returns false
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      (db.organization.findUnique as any)
        .mockResolvedValueOnce({
            subscriptionStatus: 'TRIAL',
            trialEndsAt: pastDate,
            subscriptionEndsAt: null,
        })
        // Second call returns 0 credits
        .mockResolvedValueOnce({
            credits: 0
        });

      const result = await checkProcessingAccess(mockOrgId);
      expect(result).toEqual({ authorized: false, method: null });
    });
  });
});
