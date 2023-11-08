export default {
    maxResolution: 1080,
    // framerate: 60, // got cfr
    crf: 18, // 23/28 by default, 0 is lossless, 51 is worst possible, 18 is the lowest of visually loseless,
    videoCodec: 'libx264',  // need full-gpl package for ffmpegkit
    audioCodec: 'aac',  // audio encoding for nullsrc or general. cannot use copy for nullsrc
    compressionSpeed: 'veryfast',  // medum by default, veryslow to best compression, in general
    lavfiNullAudio: '-f lavfi -i anullsrc=cl=mono -shortest', // minimum silent, mono audio of shortest length of stream
}