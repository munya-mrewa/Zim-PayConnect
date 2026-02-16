import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Organization required" }, { status: 403 });
    }

    // Attempt to fetch real logs for this org
    const logs = await db.auditLog.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { user: { select: { fullName: true } } }
    });
    
    return NextResponse.json(logs);
  } catch (error) {
    console.error("Failed to fetch history:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
