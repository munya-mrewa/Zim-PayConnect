import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export async function checkExpiringSubscriptions() {
  const now = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(now.getDate() + 3);

  // Find organizations expiring in exactly 3 days (for reminder)
  // or expired today (for grace period start)
  
  // 1. Reminder: 3 Days Left
  const expiringSoon = await db.organization.findMany({
    where: {
      subscriptionStatus: "ACTIVE",
      subscriptionEndsAt: {
        gte: now,
        lte: threeDaysFromNow
      },
      // Avoid spamming if we already processed? (Ideally need a flag, but for MVP we run once daily)
    },
    include: { users: { where: { role: "OWNER" } } }
  });

  for (const org of expiringSoon) {
    const owner = org.users[0];
    if (owner && owner.email) {
      await sendEmail({
        to: owner.email,
        subject: "Action Required: Subscription Expiring Soon",
        html: `
          <h1>Subscription Expiry Notice</h1>
          <p>Hello ${owner.fullName || 'Valued Customer'},</p>
          <p>Your subscription for <strong>${org.name}</strong> is expiring on ${org.subscriptionEndsAt?.toDateString()}.</p>
          <p>To ensure uninterrupted service, please renew your subscription now.</p>
          <p><a href="${process.env.NEXTAUTH_URL}/upgrade?renew=true">Renew Subscription</a></p>
          <p>Thank you for choosing Zim-PayConnect.</p>
        `
      });
      console.log(`Reminder sent to ${owner.email} for Org ${org.name}`);
    }
  }

  // 2. Handling Expiry & Grace Period
  // Find organizations that have JUST expired (status is ACTIVE but date passed)
  const justExpired = await db.organization.findMany({
      where: {
          subscriptionStatus: "ACTIVE",
          subscriptionEndsAt: { lt: now }
      }
  });

  for (const org of justExpired) {
      // Set to PAST_DUE and give 3 days grace
      const graceEnd = new Date();
      graceEnd.setDate(graceEnd.getDate() + 3);

      await db.organization.update({
          where: { id: org.id },
          data: {
              subscriptionStatus: "PAST_DUE",
              gracePeriodEndsAt: graceEnd
          }
      });
      
      // Notify Owner
      const owner = await db.user.findFirst({ where: { organizationId: org.id, role: "OWNER" }});
      if (owner && owner.email) {
           await sendEmail({
            to: owner.email,
            subject: "Urgent: Subscription Expired - Grace Period Active",
            html: `
              <h1>Subscription Expired</h1>
              <p>Your subscription has expired. You have entered a <strong>3-day grace period</strong>.</p>
              <p>Please renew immediately to avoid service suspension.</p>
              <p><a href="${process.env.NEXTAUTH_URL}/upgrade?renew=true">Renew Now</a></p>
            `
          });
      }
      console.log(`Org ${org.id} moved to PAST_DUE (Grace Period)`);
  }

  // 3. Grace Period Over (Suspend)
  const graceOver = await db.organization.findMany({
      where: {
          subscriptionStatus: "PAST_DUE",
          gracePeriodEndsAt: { lt: now }
      }
  });

  for (const org of graceOver) {
      await db.organization.update({
          where: { id: org.id },
          data: {
              subscriptionStatus: "EXPIRED",
              gracePeriodEndsAt: null
          }
      });
       console.log(`Org ${org.id} moved to EXPIRED`);
  }

  return { 
      reminded: expiringSoon.length, 
      pastDue: justExpired.length, 
      expired: graceOver.length 
  };
}
