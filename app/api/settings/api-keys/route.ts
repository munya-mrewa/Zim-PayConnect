import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { createHash, randomBytes } from "crypto";

function generateApiKey() {
  const key = `sk_live_${randomBytes(24).toString("hex")}`;
  // Store SHA-256 hash of the key
  const hash = createHash("sha256").update(key).digest("hex");
  const prefix = key.substring(0, 10);
  return { key, hash, prefix };
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keys = await db.apiKey.findMany({
    where: { 
        organizationId: session.user.organizationId,
        revokedAt: null
    },
    select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        createdAt: true,
        scopes: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(keys);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, scopes } = await req.json();
  
  // Verify Enterprise/Agency tier
  const org = await db.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { subscriptionTier: true }
  });

  if (!['AGENCY', 'ENTERPRISE'].includes(org?.subscriptionTier || '')) {
      return NextResponse.json({ error: "Upgrade required" }, { status: 403 });
  }

  const { key, hash, prefix } = generateApiKey();

  const newKey = await db.apiKey.create({
    data: {
        organizationId: session.user.organizationId,
        name: name || "Unnamed Key",
        keyPrefix: prefix,
        hashedKey: hash,
        scopes: scopes || ["read"],
    }
  });

  // Return full key ONLY once
  return NextResponse.json({ ...newKey, secretKey: key });
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await db.apiKey.updateMany({
        where: { 
            id: id, 
            organizationId: session.user.organizationId 
        },
        data: { revokedAt: new Date() }
    });

    return NextResponse.json({ success: true });
}
