import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateAccountManager } from './actions';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';

// Mock dependencies
vi.mock('next-auth');
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));
vi.mock('@/lib/db', () => ({
  db: {
    organization: {
      update: vi.fn(),
    },
  },
}));

describe('updateAccountManager action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw Error if unauthorized (no session)', async () => {
    (getServerSession as any).mockResolvedValue(null);
    await expect(updateAccountManager('org-1', 'user-1')).rejects.toThrow('Unauthorized');
  });

  it('should throw Error if unauthorized role', async () => {
    (getServerSession as any).mockResolvedValue({ user: { role: 'USER' } });
    await expect(updateAccountManager('org-1', 'user-1')).rejects.toThrow('Unauthorized');
  });

  it('should assign a manager for ADMIN', async () => {
    (getServerSession as any).mockResolvedValue({ user: { role: 'ADMIN' } });
    (db.organization.update as any).mockResolvedValue({ id: 'org-1' });

    const result = await updateAccountManager('org-1', 'user-1');
    
    expect(db.organization.update).toHaveBeenCalledWith({
      where: { id: 'org-1' },
      data: { accountManagerId: 'user-1' }
    });
    expect(revalidatePath).toHaveBeenCalledWith('/admin');
    expect(result.success).toBe(true);
  });

  it('should unassign a manager if "unassigned" is passed', async () => {
    (getServerSession as any).mockResolvedValue({ user: { role: 'SUPPORT_AGENT' } });
    (db.organization.update as any).mockResolvedValue({ id: 'org-1' });

    const result = await updateAccountManager('org-1', 'unassigned');
    
    expect(db.organization.update).toHaveBeenCalledWith({
      where: { id: 'org-1' },
      data: { accountManagerId: null }
    });
    expect(revalidatePath).toHaveBeenCalledWith('/admin');
    expect(result.success).toBe(true);
  });

  it('should handle database errors gracefully', async () => {
    (getServerSession as any).mockResolvedValue({ user: { role: 'ADMIN' } });
    (db.organization.update as any).mockRejectedValue(new Error('DB Error'));

    const result = await updateAccountManager('org-1', 'user-1');
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to update account manager');
  });
});
