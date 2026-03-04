import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// Use dynamic import so env vars are set before module evaluation
async function main() {
    console.log("Starting test...");
    const { processManualUploadTranscription } = await import("./src/lib/transcribe.ts");
    await processManualUploadTranscription('manual_acb434c4-ab77-42ea-9b71-50d146a9c46d', '/uploads/e3f9ab84-fa51-4691-9560-a267f1f636b2.webm');
    console.log("Finished test.");
}

main().catch(console.error);
