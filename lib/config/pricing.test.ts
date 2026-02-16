import { describe, it, expect } from 'vitest';
import { SUBSCRIPTION_PLANS, getPlanById } from './pricing';

describe('Subscription Plan Limits', () => {
  it('should have correct limit for MICRO plan', () => {
    const microPlan = getPlanById('MICRO');
    expect(microPlan).toBeDefined();
    expect(microPlan?.maxEmployees).toBe(10);
  });

  it('should have correct limit for BUSINESS plan', () => {
    const businessPlan = getPlanById('BUSINESS');
    expect(businessPlan).toBeDefined();
    expect(businessPlan?.maxEmployees).toBe(100);
  });

  it('should have Unlimited limit for AGENCY plan', () => {
    const agencyPlan = getPlanById('AGENCY');
    expect(agencyPlan).toBeDefined();
    expect(agencyPlan?.maxEmployees).toBe('Unlimited');
  });

  it('should have Unlimited limit for ENTERPRISE plan', () => {
    const enterprisePlan = getPlanById('ENTERPRISE');
    expect(enterprisePlan).toBeDefined();
    expect(enterprisePlan?.maxEmployees).toBe('Unlimited');
  });
});
