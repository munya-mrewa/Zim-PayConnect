import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { checkSubscriptionAccess } from "@/lib/auth/subscription";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify User Role/Tier
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true },
    });

    if (!user || !user.organizationId || !user.organization) {
      return new NextResponse("User is not associated with an organization", { status: 400 });
    }

    const hasAccess = await checkSubscriptionAccess(user.organization.id);
    if (!hasAccess) {
         return new NextResponse("Subscription expired or invalid", { status: 403 });
    }

    const { subscriptionTier } = user.organization;
    if (!['AGENCY', 'ENTERPRISE'].includes(subscriptionTier)) {
         return new NextResponse("Upgrade required to use this feature", { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new NextResponse("No file uploaded", { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename
    // specific file extensions are allowed
    const allowedExtensions = ['.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.name).toLowerCase();
    
    if (!allowedExtensions.includes(ext)) {
        return new NextResponse("Invalid file type. Only PNG and JPG are allowed.", { status: 400 });
    }

    const filename = `${user.organization.id}-${Date.now()}${ext}`;
    const uploadDir = path.join(process.cwd(), "public/uploads/logos");
    
    // Ensure dir exists (redundant but safe)
    await mkdir(uploadDir, { recursive: true });
    
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const logoUrl = `/uploads/logos/${filename}`;

    // Update DB
    await db.organization.update({
        where: { id: user.organization.id },
        data: { logoUrl }
    });

    return NextResponse.json({ url: logoUrl });
  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
