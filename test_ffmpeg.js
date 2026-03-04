const ffmpegStatic = require("ffmpeg-static");
const ffprobeStatic = require("ffprobe-static");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");

console.log("ffmpegStatic:", ffmpegStatic);
console.log("ffprobeStatic:", ffprobeStatic.path);

let resolvedFfmpeg = ffmpegStatic;
if (resolvedFfmpeg && !fs.existsSync(resolvedFfmpeg)) {
    const isWin = process.platform === "win32";
    resolvedFfmpeg = path.join(process.cwd(), "node_modules", "ffmpeg-static", isWin ? "ffmpeg.exe" : "ffmpeg");
}
console.log("Resolved ffmpeg:", resolvedFfmpeg);
if (resolvedFfmpeg && fs.existsSync(resolvedFfmpeg)) {
    ffmpeg.setFfmpegPath(resolvedFfmpeg);
}

let resolvedFfprobe = ffprobeStatic?.path;
if (resolvedFfprobe && !fs.existsSync(resolvedFfprobe)) {
    resolvedFfprobe = resolvedFfprobe.replace(/^(\\|\/)?ROOT(\\|\/)?/i, process.cwd() + path.sep);
    // double check
    if (!fs.existsSync(resolvedFfprobe)) {
        const isWin = process.platform === "win32";
        resolvedFfprobe = path.join(process.cwd(), "node_modules", "ffprobe-static", "bin", process.platform, process.arch, isWin ? "ffprobe.exe" : "ffprobe");
    }
}
console.log("Resolved ffprobe:", resolvedFfprobe);
if (resolvedFfprobe && fs.existsSync(resolvedFfprobe)) {
    ffmpeg.setFfprobePath(resolvedFfprobe);
}

const files = fs.readdirSync("./public/uploads");
const target = files.find(f => f.endsWith('.webm') || f.endsWith('.mp4'));
if (!target) return console.log("No video");

const videoPath = `./public/uploads/${target}`;
console.log("Analyzing", videoPath);

ffmpeg.ffprobe(videoPath, (err, metadata) => {
    if (err) {
        console.error("FFPROBE ERROR:", err);
    } else {
        console.log("DURATION:", metadata.format.duration);
    }
});
