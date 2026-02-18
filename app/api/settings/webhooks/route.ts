import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const endpoints = await db.webhookEndpoint.findMany({
        where: { organizationId: session.user.organizationId },
        orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(endpoints);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { url, events, secret } = await req.json();

    if (!url || !events || !events.length) {
        return NextResponse.json({ error: "URL and events are required" }, { status: 400 });
    }

    // Verify Enterprise/Agency
    const org = await db.organization.findUnique({
        where: { id: session.user.organizationId },
        select: { subscriptionTier: true }
    });

    if (!['AGENCY', 'ENTERPRISE'].includes(org?.subscriptionTier || '')) {
        return NextResponse.json({ error: "Upgrade required" }, { status: 403 });
    }

    const endpoint = await db.webhookEndpoint.create({
        data: {
            organizationId: session.user.organizationId,
            url,
            events,
            secret,
        }
    });

    return NextResponse.json(endpoint);
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await db.webhookEndpoint.deleteMany({
        where: { 
            id, 
            organizationId: session.user.organizationId 
        }
    });

    return NextResponse.json({ success: true });
}
