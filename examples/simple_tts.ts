#!/usr/bin/env -S deno run --allow-import=jsr.io:443 --allow-write=audio.wav --allow-ffi

import { resolve } from "@std/path/resolve";
import { load } from "@ud2/deno-voicevox";

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

const dynamicLibPath = resolve(libNameByOS("voicevox_core"));
const openJtalkDictPath = "open_jtalk_dic_utf_8-1.11";
const modelPath = "model/sample.vvm";
const outputWavPath = "audio.wav";
const voiceId = 0;
if (Deno.args.length !== 1) {
  console.log("Usage: ./simple_tts.ts <text>");
  Deno.exit(2);
}
const [text] = Deno.args;
console.log("Initializing…");
await using lib = load(dynamicLibPath);
const { Onnxruntime, Synthesizer, VoiceModelFile, OpenJtalk } = lib.exports;
Onnxruntime?.load(resolve(Onnxruntime.versionedFilename));
using openJtalk = await OpenJtalk.create(openJtalkDictPath);
using synthesizer = Synthesizer.create(openJtalk);
using model = await VoiceModelFile.open(modelPath);
await synthesizer.loadModel(model);
console.log("Synthesizing audio…");
const outputWav = await synthesizer.tts(voiceId, text);
console.log("Saving audio file…");
await Deno.writeFile(outputWavPath, outputWav);
console.log(`Saved audio file to '${outputWavPath}'`);
