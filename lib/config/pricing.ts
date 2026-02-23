export const PAY_PER_PROCESS_COST = 5;

export type SubscriptionPlanId = 'MICRO' | 'BUSINESS' | 'AGENCY' | 'ENTERPRISE';

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  description: string;
  price: number;
  currency: 'USD';
  period: 'monthly' | 'yearly';
  maxEmployees: number | 'Unlimited';
  maxClientTins?: number; // Specific to Agency
  features: string[];
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'MICRO',
    name: 'Micro',
    description: 'Perfect for small businesses and startups.',
    price: 25,
    currency: 'USD',
    period: 'monthly',
    maxEmployees: 10,
    features: [
      'Basic FDS Split',
      'Standard Support',
      'Compliance Checks'
    ]
  },
  {
    id: 'BUSINESS',
    name: 'Business',
    description: 'Ideal for growing companies with standard payroll needs.',
    price: 105,
    currency: 'USD',
    period: 'monthly',
    maxEmployees: 100,
    features: [
      'Basic FDS Split',
      'Mock Audit Reports',
      'Priority Support',
      'Bulk Data Processing'
    ]
  },
  {
    id: 'AGENCY',
    name: 'Agency / Institutional',
    description: 'For Audit Firms, Churches, Schools, NGOs, and Multi-entity orgs.',
    price: 250,
    currency: 'USD',
    period: 'monthly',
    maxEmployees: 'Unlimited', // Usually agencies handle multiple clients, limit is on TINs
    maxClientTins: 5,
    features: [
      '5 Client TINs included (+$15/extra)',
      'White-label Reports',
      'Client Management Dashboard',
      'API Access'
    ]
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    description: 'Custom solutions for large-scale operations.',
    price: 750,
    currency: 'USD',
    period: 'monthly',
    maxEmployees: 'Unlimited',
    features: [
      'Private Instance',
      'Custom Integrations',
      'SLA Assurance',
      'Dedicated Account Manager'
    ]
  }
];

export const getPlanById = (id: string): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === id);
};
