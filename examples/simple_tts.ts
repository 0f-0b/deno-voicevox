#!/usr/bin/env -S deno run --allow-import=jsr.io:443 --allow-write=audio.wav --allow-ffi

import { load } from "jsr:@ud2/deno-voicevox";

function libNameByOS(base: string): string {
  switch (Deno.build.os) {
    case "darwin":
      return `lib${base}.dylib`;
    case "linux":
      return `lib${base}.so`;
    case "windows":
      return `${base}.dll`;
    default:
      throw new TypeError(`Unsupported OS ${Deno.build.os}`);
  }
}

const dynamicLibPath = libNameByOS("voicevox_core");
const openJtalkDictPath = "open_jtalk_dic_utf_8-1.11";
const modelPath = "model/sample.vvm";
const outputWavPath = "audio.wav";
const voiceId = 0;
if (Deno.args.length !== 1) {
  console.log("Usage: ./simple_tts.ts <text>");
  Deno.exit(2);
}
const [text] = Deno.args;
const { Synthesizer, VoiceModelFile, OpenJtalk, unload } = load(dynamicLibPath);
try {
  console.log("Initializing…");
  using openJtalk = await OpenJtalk.create(openJtalkDictPath);
  using synthesizer = Synthesizer.create(openJtalk);
  using model = await VoiceModelFile.open(modelPath);
  await synthesizer.loadModel(model);
  console.log("Synthesizing audio…");
  const outputWav = await synthesizer.tts(voiceId, text);
  console.log("Saving audio file…");
  await Deno.writeFile(outputWavPath, outputWav);
  console.log(`Saved audio file to '${outputWavPath}'`);
} finally {
  unload();
}
