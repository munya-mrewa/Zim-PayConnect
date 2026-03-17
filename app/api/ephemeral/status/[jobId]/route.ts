import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { payrollQueue } from "@/lib/queue/client";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { jobId } = await params;
        const job = await payrollQueue.getJob(jobId);

        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        const state = await job.getState();
        const progress = job.progress;
        const result = job.returnvalue;

        // If job failed, return error
        if (state === "failed") {
            return NextResponse.json({ 
                status: "failed", 
                error: job.failedReason || "Processing failed" 
            });
        }

        if (state === "completed") {
            return NextResponse.json({
                status: "completed",
                fileId: result?.fileId,
                recordCount: result?.recordCount
            });
        }

        return NextResponse.json({
            status: state, // active, waiting, etc.
            progress
        });

    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
