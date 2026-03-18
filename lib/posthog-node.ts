import { PostHog } from 'posthog-node';
import { cookies } from 'next/headers';

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
    // Avoid blocking on shutdown, but ensure flush
    flushAt: 1,
    flushInterval: 1000
  });

  return posthogClient;
}

/**
 * Extracts the PostHog distinct ID from the request cookies.
 * This is useful for linking server-side events to anonymous visitors.
 */
export async function getPostHogId(): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!apiKey) return undefined;

    const cookieName = `ph_${apiKey}_posthog`;
    const cookie = cookieStore.get(cookieName);

    if (cookie?.value) {
      try {
        const parsed = JSON.parse(cookie.value);
        return parsed.distinct_id;
      } catch (e) {
        return undefined;
      }
    }
  } catch (e) {
    // cookies() might fail if not in request context
    return undefined;
  }
  return undefined;
}

export async function trackServerEvent(event: string, properties?: Record<string, any>, distinctId?: string) {
  const client = getPostHog();
  if (!client) return;

  let id = distinctId;
  
  // If no distinctId is provided, try to get it from cookies (anonymous visitor)
  if (!id) {
    id = await getPostHogId();
  }

  if (!id) {
    // If strictly required, we might return here. 
    // But sometimes we might want to log purely global events? 
    // PostHog requires a distinctId.
    console.warn(`[Analytics] Skipped tracking server event '${event}': No distinctId found.`);
    return;
  }

  try {
    client.capture({
      distinctId: id,
      event,
      properties: {
        ...properties,
        $source: 'server'
      }
    });
  } catch (e) {
    console.error('Failed to track server event:', e);
  }
}
