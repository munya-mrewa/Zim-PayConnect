import { PostHog } from 'posthog-node';

let posthogClient: PostHog | null = null;

export function getPostHog() {
  if (posthogClient) return posthogClient;

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

  if (!apiKey) {
    console.warn('PostHog API Key not found. Analytics will be disabled.');
    return null;
  }

  posthogClient = new PostHog(apiKey, {
    host,
    // Avoid blocking on shutdown
    flushAt: 1,
    flushInterval: 0
  });

  return posthogClient;
}
