import { google } from "googleapis";

interface ConferenceRecord { name: string; startTime: string; endTime?: string; expireTime?: string; space?: string; }
interface Recording { name: string; state: string; startTime?: string; endTime?: string; driveDestination?: { file: string; exportUri: string }; }
interface Transcript { name: string; state: string; startTime?: string; endTime?: string; docsDestination?: { document: string; exportUri: string }; }
interface TranscriptEntry { name: string; participant?: string; text: string; startTime?: string; endTime?: string; }

function getMeetClient(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    return google.meet({ version: "v2", auth });
}

export async function getConferenceRecords(
    accessToken: string
): Promise<ConferenceRecord[]> {
    const meet = getMeetClient(accessToken);

    const res = await meet.conferenceRecords.list({
        pageSize: 25,
    });

    return (res.data.conferenceRecords ?? []).map((r) => ({
        name: r.name!,
        startTime: r.startTime ?? "",
        endTime: r.endTime ?? undefined,
        expireTime: r.expireTime ?? undefined,
        space: r.space ?? undefined,
    }));
}

export async function getRecordings(
    accessToken: string,
    conferenceRecordId: string
): Promise<Recording[]> {
    const meet = getMeetClient(accessToken);

    const res = await meet.conferenceRecords.recordings.list({
        parent: conferenceRecordId,
    });

    return (res.data.recordings ?? []).map((r) => ({
        name: r.name!,
        state: r.state ?? "STATE_UNSPECIFIED",
        startTime: r.startTime ?? undefined,
        endTime: r.endTime ?? undefined,
        driveDestination: r.driveDestination
            ? {
                file: r.driveDestination.file ?? "",
                exportUri: r.driveDestination.exportUri ?? "",
            }
            : undefined,
    }));
}

export async function getTranscripts(
    accessToken: string,
    conferenceRecordId: string
): Promise<Transcript[]> {
    const meet = getMeetClient(accessToken);

    const res = await meet.conferenceRecords.transcripts.list({
        parent: conferenceRecordId,
    });

    return (res.data.transcripts ?? []).map((t) => ({
        name: t.name!,
        state: t.state ?? "STATE_UNSPECIFIED",
        startTime: t.startTime ?? undefined,
        endTime: t.endTime ?? undefined,
        docsDestination: t.docsDestination
            ? {
                document: t.docsDestination.document ?? "",
                exportUri: t.docsDestination.exportUri ?? "",
            }
            : undefined,
    }));
}

export async function getTranscriptEntries(
    accessToken: string,
    transcriptName: string
): Promise<TranscriptEntry[]> {
    // Use direct REST fetch because the `entries` sub-resource is not fully
    // typed in the googleapis TS definitions for Meet v2.
    const url = `https://meet.googleapis.com/v2/${transcriptName}/entries?pageSize=200`;
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch transcript entries: ${res.statusText}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.entries ?? []).map((e: any) => ({
        name: e.name ?? "",
        participant: e.participant ?? undefined,
        text: e.text ?? "",
        startTime: e.startTime ?? undefined,
        endTime: e.endTime ?? undefined,
    }));
}
