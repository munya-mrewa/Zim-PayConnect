"use server";

import { db } from "@/lib/db";
import { Organization } from "@prisma/client";
import { unstable_cache } from "next/cache";

export async function getVolumeHistory(organizationId: string) {
  if (!organizationId) return [];

  const getCachedVolumeHistory = unstable_cache(
    async (orgId: string) => {
      const logs = await db.auditLog.findMany({
        where: { 
            organizationId: orgId,
            action: "UPLOAD_PAYROLL",
            status: "SUCCESS"
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { createdAt: true, recordCount: true }
      });

      const grouped = logs.reduce((acc, log) => {
          const date = log.createdAt.toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + (log.recordCount || 0);
          return acc;
      }, {} as Record<string, number>);

      return Object.entries(grouped)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
    [`volume-history-${organizationId}`],
    { revalidate: 3600, tags: [`volume-${organizationId}`] } // Cache for 1 hour
  );

  return getCachedVolumeHistory(organizationId);
}

export async function getOnboardingStatus(org: Organization) {
    if (!org) return { completed: false, steps: [] };

    const getCachedOnboarding = unstable_cache(
      async (orgId: string) => {
        const hasOrgDetails = !!(org.tin && org.address);
        const hasRate = (await db.exchangeRate.count()) > 0;
        const hasUpload = (await db.auditLog.count({
            where: { organizationId: orgId, action: "UPLOAD_PAYROLL" }
        })) > 0;
        
        const hasPlan = org.subscriptionTier !== 'MICRO' || hasRate || hasUpload; 
        
        const steps = [
            { id: 'plan', label: "Select Trial Plan", completed: hasPlan, href: "/upgrade" },
            { id: 'org', label: "Set Organization Details", completed: hasOrgDetails, href: "/settings" },
            { id: 'rate', label: "Check Exchange Rates", completed: hasRate, href: "/dashboard" },
            { id: 'upload', label: "Upload First Payroll", completed: hasUpload, href: "/upload" }
        ];

        return { completed: steps.every(s => s.completed), steps };
      },
      [`onboarding-status-${org.id}`],
      { revalidate: 3600, tags: [`onboarding-${org.id}`] } // Cache for 1 hour
    );

    return getCachedOnboarding(org.id);
}

export async function getPayrollSummary(organizationId: string) {
  if (!organizationId) {
    return { headcountThisMonth: 0, grossThisMonth: 0, employerCostThisMonth: 0 };
  }

  const getCachedPayrollSummary = unstable_cache(
    async (orgId: string) => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const logs = await db.auditLog.findMany({
        where: {
          organizationId: orgId,
          action: "UPLOAD_PAYROLL",
          status: "SUCCESS",
          createdAt: { gte: startOfMonth },
        },
        select: { recordCount: true, metadata: true },
      });

      let headcountThisMonth = 0;
      let grossThisMonth = 0;
      let employerCostThisMonth = 0;

      logs.forEach((log) => {
        headcountThisMonth += log.recordCount || 0;
        const meta = log.metadata as any;
        if (meta?.totalGross) grossThisMonth += Number(meta.totalGross);
        if (meta?.totalEmployerCost) employerCostThisMonth += Number(meta.totalEmployerCost);
      });

      return { headcountThisMonth, grossThisMonth, employerCostThisMonth };
    },
    [`payroll-summary-${organizationId}`],
    { revalidate: 3600, tags: [`summary-${organizationId}`] } // Cache for 1 hour
  );

  return getCachedPayrollSummary(organizationId);
}
