'use client'
import posthog from 'posthog-js'
import { PostHogProvider, usePostHog } from 'posthog-js/react'
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: '/ingest',
    ui_host: 'https://us.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false, // Manually handled in PostHogTracker
    disable_session_recording: false, // Explicitly enable
    persistence: 'localStorage+cookie', // Use localStorage + cookie for better persistence
    bootstrap: {
        distinctID: 'anonymous'
    },
    loaded: (ph) => {
        if (process.env.NODE_ENV === 'development') ph.debug();
    }
  })
}

function PostHogTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthog = usePostHog();
  const { data: session, status } = useSession();

  // Track Pageviews
  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      posthog.capture('$pageview', {
        '$current_url': url,
      });
    }
  }, [pathname, searchParams, posthog]);

  // Identify User
  useEffect(() => {
    // Wait until session is loaded
    if (status === "loading" || !posthog) return;

    if (session?.user) {
      // Check if already identified to avoid redundant calls
      const currentId = posthog.get_distinct_id();
      if (currentId !== session.user.id) {
          posthog.identify(session.user.id, {
            email: session.user.email,
            name: session.user.name,
            role: session.user.role,
            organization_id: session.user.organizationId,
            subscription_status: (session.user as any).subscriptionStatus // Custom field
          });
      }
    } else if (status === "unauthenticated") {
         const currentId = posthog.get_distinct_id();
         if (currentId && currentId !== 'anonymous' && !currentId.startsWith('dummy')) {
             // See previous comments on reset logic
         }
    }
  }, [session, status, posthog]);

  return null;
}

export function PHProvider({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogTracker />
      </Suspense>
      {children}
    </PostHogProvider>
  )
}
