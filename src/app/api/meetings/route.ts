import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { google } from "googleapis";
import { recallPost } from "@/lib/recall";
import { Bot } from "@/types";

interface CreateMeetPayload {
    title: string;
    description?: string;
    startDateTime: string;  // ISO string
    endDateTime: string;    // ISO string
    attendees?: string[];
    bot_name?: string;
}

// POST /api/meetings — create Google Meet event then auto-send Recall.ai bot
export async function POST(request: Request) {
    const session = await auth();
    if (!session?.access_token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json()) as CreateMeetPayload;

    if (!payload.title?.trim()) {
        return NextResponse.json({ error: "Meeting title is required" }, { status: 400 });
    }

    // ── 1. Create Google Calendar event with Meet link ────────────────────────
    const oauthClient = new google.auth.OAuth2();
    oauthClient.setCredentials({ access_token: session.access_token });
    const calendar = google.calendar({ version: "v3", auth: oauthClient });

    let hangoutLink: string;
    let eventId: string;

    try {
        const event = await calendar.events.insert({
            calendarId: "primary",
            conferenceDataVersion: 1,
            requestBody: {
                summary: payload.title,
                description: payload.description,
                start: { dateTime: payload.startDateTime, timeZone: "Asia/Jakarta" },
                end: { dateTime: payload.endDateTime, timeZone: "Asia/Jakarta" },
                attendees: (payload.attendees ?? []).map((email) => ({ email })),
                conferenceData: {
                    createRequest: {
                        requestId: `meetrec-${Date.now()}`,
                        conferenceSolutionKey: { type: "hangoutsMeet" },
                    },
                },
            },
        });

        hangoutLink = event.data.hangoutLink ?? "";
        eventId = event.data.id ?? "";

        if (!hangoutLink) {
            return NextResponse.json(
                { error: "Google Calendar created the event but did not return a Meet link. Make sure Google Meet is enabled for your account." },
                { status: 502 }
            );
        }
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to create Google Calendar event";
        console.error("[meetings] Calendar error:", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }

    // ── 2. Send Recall.ai bot to the Meet link ────────────────────────────────
    let bot: Bot;
    try {
        const botPayload: Record<string, unknown> = {
            meeting_url: hangoutLink,
            bot_name: payload.bot_name || "MeetRec Bot",
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
            join_at: payload.startDateTime,
        };

        bot = await recallPost<Bot>("/bot/", botPayload);
    } catch (err) {
        // Meet was created but bot failed — still return the Meet link so caller can use it
        const msg = err instanceof Error ? err.message : "Failed to send Recall.ai bot";
        console.error("[meetings] Recall.ai error:", err);
        return NextResponse.json({
            hangoutLink,
            eventId,
            botError: msg,
        }, { status: 207 }); // 207 partial success
    }

    return NextResponse.json({ hangoutLink, eventId, bot }, { status: 201 });
}
