import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";
import Groq from "groq-sdk";
import { TranscriptEntry, TranscriptWord } from "@/types";

// Fix Webpack \ROOT path issue in Next.js
let resolvedFfmpeg = ffmpegStatic as string | null;
if (resolvedFfmpeg && !fs.existsSync(resolvedFfmpeg)) {
    const isWin = process.platform === "win32";
    resolvedFfmpeg = path.join(process.cwd(), "node_modules", "ffmpeg-static", isWin ? "ffmpeg.exe" : "ffmpeg");
}
if (resolvedFfmpeg && fs.existsSync(resolvedFfmpeg)) {
    ffmpeg.setFfmpegPath(resolvedFfmpeg);
}

let resolvedFfprobe = ffprobeStatic?.path as string | null;
if (resolvedFfprobe && !fs.existsSync(resolvedFfprobe)) {
    resolvedFfprobe = resolvedFfprobe.replace(/^(\\|\/)?ROOT(\\|\/)?/i, process.cwd() + path.sep);
    if (!fs.existsSync(resolvedFfprobe)) {
        const isWin = process.platform === "win32";
        resolvedFfprobe = path.join(process.cwd(), "node_modules", "ffprobe-static", "bin", process.platform, process.arch, isWin ? "ffprobe.exe" : "ffprobe");
    }
}
if (resolvedFfprobe && fs.existsSync(resolvedFfprobe)) {
    ffmpeg.setFfprobePath(resolvedFfprobe);
}

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export function getVideoDuration(videoPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(videoPath, (err, metadata) => {
            if (err) {
                console.error("[getVideoDuration] Error reading metadata:", err);
                return resolve(0); // fallback
            }
            resolve(metadata.format.duration || 0);
        });
    });
}

/**
 * Extracts audio from a video file into a temporary mp3 file
 */
export async function extractAudio(videoPath: string, outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .noVideo()
            .audioCodec("libmp3lame")
            .audioBitrate("128k") // Keep it compressed to stay under 25MB
            .on("end", () => resolve(outputPath))
            .on("error", (err) => {
                console.error("[extractAudio] FFmpeg error:", err);
                reject(err);
            })
            .save(outputPath);
    });
}

/**
 * Sends an audio file to Groq Whisper API for transcription with word-level timestamps.
 */
export async function transcribeAudioWithGroq(audioPath: string): Promise<any> {
    const audioStream = fs.createReadStream(audioPath);

    // Groq requires file to be <= 25MB.
    // Ensure the mp3 meets this criteria before sending.
    const stats = fs.statSync(audioPath);
    const fileSizeMB = stats.size / (1024 * 1024);
    if (fileSizeMB > 25) {
        throw new Error(`Audio file too large (${fileSizeMB.toFixed(1)}MB). Max 25MB allowed by Groq.`);
    }

    try {
        const response = await groq.audio.transcriptions.create({
            file: audioStream,
            model: "distil-whisper-large-v3-en", // Will let Whisper detect language or fallback to whisper-large-v3
            prompt: "Ini adalah meeting atau percakapan berbahasa Indonesia.", // Helps inform context/language
            response_format: "verbose_json",
            timestamp_granularities: ["word"],
        });
        return response;
    } catch (error) {
        console.error("[transcribeAudioWithGroq] Groq API error:", error);
        throw error;
    }
}

/**
 * Main function: Extracts, Transcribes, Maps, Saves
 */
export async function processManualUploadTranscription(botId: string, videoUrl: string) {
    console.log(`[processManualUploadTranscription] Started for bot ${botId}`);

    // 1. Resolve local video path from public URL
    // e.g. /uploads/1234.webm -> public/uploads/1234.webm
    const videoFileName = videoUrl.split("/").pop();
    if (!videoFileName) return;

    const videoPath = path.join(process.cwd(), "public", "uploads", videoFileName);
    if (!fs.existsSync(videoPath)) {
        console.error(`[processManualUploadTranscription] Video file not found: ${videoPath}`);
        return;
    }

    const tmpDir = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
    }

    const audioFileName = `${botId}.mp3`;
    const audioPath = path.join(tmpDir, audioFileName);

    try {
        // 2. Extract Audio
        console.log(`[processManualUploadTranscription] Extracting audio to ${audioPath}...`);
        await extractAudio(videoPath, audioPath);

        // 3. Transcribe via Groq
        console.log(`[processManualUploadTranscription] Sending to Groq API...`);
        // Use standard whisper-large-v3 since it supports multi-language (id)
        // Adjust the API call directly inside to use the large model.
        const audioStream = fs.createReadStream(audioPath);
        const groqResponse = await groq.audio.transcriptions.create({
            file: audioStream,
            model: "whisper-large-v3",
            language: "id", // Force indonesian
            response_format: "verbose_json",
            timestamp_granularities: ["word"],
        });

        console.log(`[processManualUploadTranscription] Groq transcription completed.`);

        // 4. Map to Recall.ai format (TranscriptEntry)
        const entries: TranscriptEntry[] = [];

        const responseData = groqResponse as any;

        // Whisper returns `words` array if timestamp_granularities=["word"]
        if (responseData.words && Array.isArray(responseData.words)) {
            // Group words into sentences/utterances every ~5-10 seconds or based on punctuation
            // A simple approach is chunking them into fixed-size entries or looking for pauses
            let currentWords: TranscriptWord[] = [];
            let currentStart = responseData.words[0].start;
            let currentEnd = responseData.words[0].end;

            for (let i = 0; i < responseData.words.length; i++) {
                const wordObj = responseData.words[i];
                const cleanWord = wordObj.word.trim();

                currentWords.push({
                    text: cleanWord,
                    start_timestamp: wordObj.start,
                    end_timestamp: wordObj.end,
                    confidence: 0.99 // Whisper doesn't always provide word confidence in the standard schema
                });

                currentEnd = wordObj.end;

                // Break utterance if it ends with punctuation or gap > 1s, or just chunk size
                const endsWithPunct = /[.!?]$/.test(cleanWord);
                const isLongUtterance = currentWords.length >= 15;
                const nextWord = responseData.words[i + 1];
                const pauseGap = nextWord ? (nextWord.start - wordObj.end) : 0;

                if (endsWithPunct || isLongUtterance || pauseGap > 1.5 || !nextWord) {
                    entries.push({
                        speaker: "Speaker 1", // Whisper basic API doesn't do diarization out of the box
                        words: [...currentWords],
                        is_final: true,
                        start_timestamp: currentStart,
                        end_timestamp: currentEnd,
                        language: "id",
                        original_transcript_id: `groq_${botId}_${entries.length}`
                    });

                    if (nextWord) {
                        currentWords = [];
                        currentStart = nextWord.start;
                    }
                }
            }
        } else if (groqResponse.text) {
            // Fallback if word timestamps failed
            entries.push({
                speaker: "Speaker",
                words: [{ text: groqResponse.text, start_timestamp: 0, end_timestamp: 0 }],
                is_final: true,
                start_timestamp: 0,
                end_timestamp: 0,
                language: "id",
                original_transcript_id: `groq_${botId}`
            });
        }

        // 5. Save locally
        const dbDir = path.join(process.cwd(), "data");
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        const dbPath = path.join(dbDir, "manual_transcripts.json");
        let transcripts: Record<string, TranscriptEntry[]> = {};
        if (fs.existsSync(dbPath)) {
            transcripts = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
        }

        transcripts[botId] = entries;
        fs.writeFileSync(dbPath, JSON.stringify(transcripts, null, 2));

        console.log(`[processManualUploadTranscription] Saved ${entries.length} transcript entries for bot ${botId}`);

    } catch (error: any) {
        console.error(`[processManualUploadTranscription] Failed:`, error);
        try {
            fs.writeFileSync(
                path.join(process.cwd(), "tmp", `transcription_err_${botId}.log`),
                String(error) + (error.stack ? '\n' + error.stack : '')
            );
        } catch (e) { }
    } finally {
        // Cleanup temp audio
        if (fs.existsSync(audioPath)) {
            fs.unlinkSync(audioPath);
        }
    }
}
