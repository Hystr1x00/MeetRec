import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recallGet } from "@/lib/recall";
import { Bot } from "@/types";

// GET /api/bots/[id] — get a single bot's details
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const bot = await recallGet<Bot>(`/bot/${id}/`);
        return NextResponse.json({ bot });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to fetch bot";
        console.error("Error fetching bot:", error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
