import { google } from "googleapis";

interface Meeting { id: string; summary: string; description?: string; start: string; end: string; hangoutLink?: string; attendees?: { email: string; responseStatus?: string }[]; status: string; }
interface CreateMeetingPayload { title: string; description?: string; startDateTime: string; endDateTime: string; attendees: string[]; }

function getCalendarClient(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    return google.calendar({ version: "v3", auth });
}

export async function createMeeting(
    accessToken: string,
    payload: CreateMeetingPayload
): Promise<Meeting> {
    const calendar = getCalendarClient(accessToken);

    const event = await calendar.events.insert({
        calendarId: "primary",
        conferenceDataVersion: 1,
        requestBody: {
            summary: payload.title,
            description: payload.description,
            start: {
                dateTime: payload.startDateTime,
                timeZone: "Asia/Jakarta",
            },
            end: {
                dateTime: payload.endDateTime,
                timeZone: "Asia/Jakarta",
            },
            attendees: payload.attendees.map((email) => ({ email })),
            conferenceData: {
                createRequest: {
                    requestId: `meet-${Date.now()}`,
                    conferenceSolutionKey: { type: "hangoutsMeet" },
                },
            },
        },
    });

    const data = event.data;
    return {
        id: data.id!,
        summary: data.summary!,
        description: data.description ?? undefined,
        start: data.start?.dateTime ?? data.start?.date ?? "",
        end: data.end?.dateTime ?? data.end?.date ?? "",
        hangoutLink: data.hangoutLink ?? undefined,
        attendees: (data.attendees ?? []).map((a) => ({
            email: a.email!,
            responseStatus: a.responseStatus ?? undefined,
        })),
        status: data.status ?? "confirmed",
    };
}

export async function getUpcomingMeetings(
    accessToken: string
): Promise<Meeting[]> {
    const calendar = getCalendarClient(accessToken);

    const res = await calendar.events.list({
        calendarId: "primary",
        timeMin: new Date().toISOString(),
        maxResults: 20,
        singleEvents: true,
        orderBy: "startTime",
        q: "meet.google.com",
    });

    const events = res.data.items ?? [];
    return events
        .filter((e) => e.hangoutLink)
        .map((e) => ({
            id: e.id!,
            summary: e.summary ?? "Untitled Meeting",
            description: e.description ?? undefined,
            start: e.start?.dateTime ?? e.start?.date ?? "",
            end: e.end?.dateTime ?? e.end?.date ?? "",
            hangoutLink: e.hangoutLink ?? undefined,
            attendees: (e.attendees ?? []).map((a) => ({
                email: a.email!,
                responseStatus: a.responseStatus ?? undefined,
            })),
            status: e.status ?? "confirmed",
        }));
}

export async function getPastMeetings(
    accessToken: string
): Promise<Meeting[]> {
    const calendar = getCalendarClient(accessToken);

    const res = await calendar.events.list({
        calendarId: "primary",
        timeMax: new Date().toISOString(),
        maxResults: 30,
        singleEvents: true,
        orderBy: "startTime",
        q: "meet.google.com",
    });

    const events = res.data.items ?? [];
    return events
        .filter((e) => e.hangoutLink)
        .reverse()
        .map((e) => ({
            id: e.id!,
            summary: e.summary ?? "Untitled Meeting",
            description: e.description ?? undefined,
            start: e.start?.dateTime ?? e.start?.date ?? "",
            end: e.end?.dateTime ?? e.end?.date ?? "",
            hangoutLink: e.hangoutLink ?? undefined,
            attendees: (e.attendees ?? []).map((a) => ({
                email: a.email!,
                responseStatus: a.responseStatus ?? undefined,
            })),
            status: e.status ?? "confirmed",
        }));
}
