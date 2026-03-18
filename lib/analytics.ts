import posthog from 'posthog-js';

type EventName = 
  | 'payroll_processed'
  | 'report_generated'
  | 'subscription_upgraded'
  | 'credit_purchased'
  | 'file_uploaded'
  | 'error_occurred';

interface EventProperties {
  [key: string]: any;
}

export const analytics = {
  track: (event: EventName, properties?: EventProperties) => {
    if (typeof window !== 'undefined' && posthog) {
      posthog.capture(event, properties);
    }
  },
  identify: (userId: string, traits?: EventProperties) => {
    if (typeof window !== 'undefined' && posthog) {
      posthog.identify(userId, traits);
    }
  },
  reset: () => {
    if (typeof window !== 'undefined' && posthog) {
      posthog.reset();
    }
  }
};
