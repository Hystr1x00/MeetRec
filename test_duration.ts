import dotenv from "dotenv";
import fs from "fs";

dotenv.config({ path: ".env.local" });

async function main() {
    console.log("Loading module...");
    const { getVideoDuration } = require("./src/lib/transcribe");

    // let's grab the first webm file in /public/uploads
    const files = fs.readdirSync("./public/uploads");
    const target = files.find(f => f.endsWith('.webm') || f.endsWith('.mp4'));
    if (!target) {
        console.log("No video to test");
        return;
    }

    const path = `./public/uploads/${target}`;
    console.log("Testing duration for", path);

    // Add timeout to test duration
    const timeout = new Promise((r) => setTimeout(() => r("TIMEOUT"), 5000));

    const result = await Promise.race([getVideoDuration(path), timeout]);
    console.log("Result:", result);
}

main().catch(console.error);
