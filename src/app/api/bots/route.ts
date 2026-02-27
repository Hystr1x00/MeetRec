import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recallGet, recallPost } from "@/lib/recall";
import { Bot, SendBotPayload } from "@/types";

interface RecallListResponse {
    results: Bot[];
    count: number;
    next: string | null;
    previous: string | null;
}

// GET /api/bots — list all bots
export async function GET() {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const data = await recallGet<RecallListResponse>("/bot/?limit=50");
        return NextResponse.json({ bots: data.results ?? [] });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to fetch bots";
        console.error("[api/bots] GET error:", message);
        return NextResponse.json({ error: message, bots: [] }, { status: 500 });
    }
}

// POST /api/bots — send a new bot to a meeting
export async function POST(request: Request) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { meeting_url, bot_name, join_at } = (await request.json()) as SendBotPayload;

        if (!meeting_url) {
            return NextResponse.json({ error: "meeting_url is required" }, { status: 400 });
        }

        const payload: Record<string, unknown> = {
            meeting_url,
            bot_name: bot_name || "MeetRec Bot",
            recording_config: {
                transcript: {
                    provider: {
                        recallai_streaming: {
                            mode: "prioritize_accuracy",
                            language_code: "id",
                        },
                    },
                },
            },
        };

        if (join_at) {
            payload.join_at = join_at;
        }

        const bot = await recallPost<Bot>("/bot/", payload);
        return NextResponse.json({ bot }, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create bot";
        console.error("Error creating bot:", error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
