// Recall.ai API client
// Pay-as-you-go accounts use the default base URL.
// Override with RECALLAI_BASE_URL for enterprise/region accounts.
const BASE_URL = process.env.RECALLAI_BASE_URL ?? "https://api.recall.ai/api/v1";
const API_KEY = process.env.RECALLAI_API_KEY ?? "";

if (!API_KEY && process.env.NODE_ENV !== "production") {
    console.warn("[recall.ts] RECALLAI_API_KEY is not set — requests will fail with 401.");
}

function headers() {
    return {
        Authorization: `Token ${API_KEY}`,
        "Content-Type": "application/json",
    };
}

/** Error that carries the HTTP status code from Recall.ai responses */
export class RecallApiError extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly body: string
    ) {
        super(message);
        this.name = "RecallApiError";
    }
}

async function safeFetch(url: string, init: RequestInit, label: string): Promise<Response> {
    try {
        return await fetch(url, init);
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new RecallApiError(
            `Recall.ai ${label} network error → ${msg} (URL: ${url})`,
            0,
            ""
        );
    }
}

async function checkResponse(res: Response, label: string): Promise<void> {
    if (!res.ok) {
        const body = await res.text().catch(() => "(unreadable)");
        throw new RecallApiError(
            `Recall.ai ${label} failed (${res.status}): ${body}`,
            res.status,
            body
        );
    }
}

export async function recallGet<T>(path: string): Promise<T> {
    const url = `${BASE_URL}${path}`;
    const res = await safeFetch(url, { headers: headers(), cache: "no-store" }, `GET ${path}`);
    await checkResponse(res, `GET ${path}`);
    return res.json() as Promise<T>;
}

export async function recallPost<T>(path: string, body: unknown): Promise<T> {
    const url = `${BASE_URL}${path}`;
    const res = await safeFetch(url, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(body),
    }, `POST ${path}`);
    await checkResponse(res, `POST ${path}`);
    return res.json() as Promise<T>;
}

export async function recallDelete(path: string): Promise<void> {
    const url = `${BASE_URL}${path}`;
    const res = await safeFetch(url, {
        method: "DELETE",
        headers: { Authorization: `Token ${API_KEY}` },
    }, `DELETE ${path}`);
    if (res.status !== 204) {
        await checkResponse(res, `DELETE ${path}`);
    }
}
