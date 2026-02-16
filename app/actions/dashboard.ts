"use server";

import { db } from "@/lib/db";
import { Organization } from "@prisma/client"; // Assuming you have this type

export async function getVolumeHistory(organizationId: string) {
  if (!organizationId) return [];

  const logs = await db.auditLog.findMany({
    where: { 
        organizationId: organizationId,
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
}

export async function getOnboardingStatus(org: Organization) {
    if (!org) return { completed: false, steps: [] };

    // Step 1: Org Details (Assume Name is always there, check TIN/Address)
    const hasOrgDetails = !!(org.tin && org.address);

    // Step 2: Rates
    const hasRate = (await db.exchangeRate.count()) > 0;

    // Step 3: First Upload
    const hasUpload = (await db.auditLog.count({
        where: { 
            organizationId: org.id,
            action: "UPLOAD_PAYROLL"
        }
    })) > 0;

    // Step 0: Plan Selection (New)
    const hasPlan = org.subscriptionTier !== 'MICRO' || hasRate || hasUpload; 
    
    const steps = [
        { id: 'plan', label: "Select Trial Plan", completed: hasPlan, href: "/upgrade" },
        { id: 'org', label: "Set Organization Details", completed: hasOrgDetails, href: "/settings" },
        { id: 'rate', label: "Check Exchange Rates", completed: hasRate, href: "/dashboard" },
        { id: 'upload', label: "Upload First Payroll", completed: hasUpload, href: "/upload" }
    ];

    return {
        completed: steps.every(s => s.completed),
        steps
    };
}
