import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getZip } from "@/lib/storage/zip-store";
import { logger } from "@/lib/logger";
import { checkSubscriptionAccess } from "@/lib/auth/subscription";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || !session?.user?.organizationId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const orgId = session.user.organizationId;

        // Enforcement: Ensure subscription is still active to download
        const hasAccess = await checkSubscriptionAccess(orgId);
        if (!hasAccess) {
             return new NextResponse("Subscription expired. Please upgrade to download reports.", { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const fileId = searchParams.get("fileId");

        if (!fileId) {
            return new NextResponse("Missing fileId", { status: 400 });
        }

        // Retrieve and decrypt the ZIP from short-term storage
        const zipBuffer = await getZip(fileId, orgId);

        if (!zipBuffer) {
            return new NextResponse("File not found or has expired (24h limit).", { status: 404 });
        }

        logger.info({ orgId, fileId }, "User downloaded encrypted ZIP");

        // Convert Node Buffer to Uint8Array for NextResponse compatibility
        return new NextResponse(new Uint8Array(zipBuffer), {
            status: 200,
            headers: {
                "Content-Type": "application/zip",
                "Content-Disposition": `attachment; filename="zim_payroll_${new Date().toISOString().slice(0,10)}.zip"`,
            },
        });
    } catch (error: any) {
        logger.error({ err: error }, "Failed to download ZIP");
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
