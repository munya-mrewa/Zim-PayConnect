'use client'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    person_profiles: 'identified_only',
    capture_pageview: false,
    ui_host: 'https://us.posthog.com',
    persistence: 'localStorage',
    bootstrap: {
        distinctID: 'anonymous'
    },
    // Adding the requested defaults/versioning
    // Note: 'defaults' is not a standard PostHog config key, 
    // but applying it as requested for custom logic compatibility.
    // @ts-ignore
    defaults: '2026-01-30'
  })
}

export function PHProvider({ children }: { children: React.ReactNode }) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
