import { fromFileUrl } from "./deps/std/path/from_file_url.ts";

import {
  createManagedPointerClass,
  DynamicLibrary,
  encodeCString,
  littleEndian,
  livenessBarrier,
  type ManagedPointer,
  Pointer,
  PointerView,
} from "./ffi.ts";
import symbols from "./voicevox_core.h.ts";

export class VoicevoxError extends Error {
  code: number;

  constructor(code: number, message?: string) {
    super(message);
    this.name = "VoicevoxError";
    this.code = code;
  }
}

export interface Voice {
  readonly style: string;
  readonly id: number;
}

export interface Speaker {
  readonly name: string;
  readonly version: string;
  readonly voices: readonly Voice[];
}

export interface Speakers {
  readonly [uuid: string]: Speaker;
}

export interface SupportedDevices {
  readonly cpu: boolean;
  readonly cuda: boolean;
  readonly dml: boolean;
}

export interface Phoneme {
  phoneme: string;
  length: number;
}

export interface Mora {
  text: string;
  consonant?: Phoneme;
  vowel: Phoneme;
  pitch: number;
}

export interface AccentPhrase {
  moras: Mora[];
  accent: number;
  pause?: Mora;
  interrogative?: boolean;
}

export interface Utterance {
  accentPhrases: AccentPhrase[];
  voiceId: number;
  volume: number;
  rate: number;
  pitch: number;
  intonation: number;
  paddingStart: number;
  paddingEnd: number;
  outputSampleRate: number;
  outputStereo: boolean;
}

export interface CreateUtteranceResult {
  utterance: Utterance;
  kana: string;
}

export interface TtsOptions {
  enableInterrogativeUpspeak?: boolean;
}

export interface SynthesisOptions {
  enableInterrogativeUpspeak?: boolean;
}

export interface Synthesizer extends Disposable {
  readonly gpuEnabled: boolean;
  readonly speakers: Speakers;
  loadModel(model: VoiceModel): Promise<undefined>;
  loadModelSync(model: VoiceModel): undefined;
  unloadModel(modelId: string): undefined;
  isModelLoaded(modelId: string): boolean;
  tts(voiceId: number, text: string, options?: TtsOptions): Promise<Uint8Array>;
  ttsSync(voiceId: number, text: string, options?: TtsOptions): Uint8Array;
  ttsFromKana(
    voiceId: number,
    kana: string,
    options?: TtsOptions,
  ): Promise<Uint8Array>;
  ttsFromKanaSync(
    voiceId: number,
    kana: string,
    options?: TtsOptions,
  ): Uint8Array;
  speak(utterance: Utterance, options?: SynthesisOptions): Promise<Uint8Array>;
  speakSync(utterance: Utterance, options?: SynthesisOptions): Uint8Array;
  createUtterance(
    voiceId: number,
    text: string,
  ): Promise<CreateUtteranceResult>;
  createUtteranceSync(voiceId: number, text: string): CreateUtteranceResult;
  createUtteranceFromKana(
    voiceId: number,
    kana: string,
  ): Promise<CreateUtteranceResult>;
  createUtteranceFromKanaSync(
    voiceId: number,
    kana: string,
  ): CreateUtteranceResult;
  createAccentPhrases(voiceId: number, text: string): Promise<AccentPhrase[]>;
  createAccentPhrasesSync(voiceId: number, text: string): AccentPhrase[];
  createAccentPhrasesFromKana(
    voiceId: number,
    kana: string,
  ): Promise<AccentPhrase[]>;
  createAccentPhrasesFromKanaSync(
    voiceId: number,
    kana: string,
  ): AccentPhrase[];
  replacePhonemeLengthAndMoraPitch(
    voiceId: number,
    accentPhrases: AccentPhrase[],
  ): Promise<AccentPhrase[]>;
  replacePhonemeLengthAndMoraPitchSync(
    voiceId: number,
    accentPhrases: AccentPhrase[],
  ): AccentPhrase[];
  replacePhonemeLength(
    voiceId: number,
    accentPhrases: AccentPhrase[],
  ): Promise<AccentPhrase[]>;
  replacePhonemeLengthSync(
    voiceId: number,
    accentPhrases: AccentPhrase[],
  ): AccentPhrase[];
  replaceMoraPitch(
    voiceId: number,
    accentPhrases: AccentPhrase[],
  ): Promise<AccentPhrase[]>;
  replaceMoraPitchSync(
    voiceId: number,
    accentPhrases: AccentPhrase[],
  ): AccentPhrase[];
  dispose(): undefined;
}

export type AccelerationMode = "auto" | "cpu" | "gpu";

export interface SynthesizerOptions {
  accelerationMode?: AccelerationMode;
  numThreads?: number;
}

export interface SynthesizerConstructor {
  new (): never;
  readonly supportedDevices: SupportedDevices;
  create(
    openJtalk: OpenJtalk,
    options?: SynthesizerOptions,
  ): Promise<Synthesizer>;
  createSync(openJtalk: OpenJtalk, options?: SynthesizerOptions): Synthesizer;
  readonly prototype: Synthesizer;
}

export interface VoiceModel extends Disposable {
  readonly id: string;
  readonly speakers: Speakers;
  dispose(): undefined;
}

export interface VoiceModelConstructor {
  new (): never;
  fromFile(path: string | URL): Promise<VoiceModel>;
  fromFileSync(path: string | URL): VoiceModel;
  readonly prototype: VoiceModel;
}

export interface OpenJtalk extends Disposable {
  useUserDict(userDict: UserDict): undefined;
  dispose(): undefined;
}

export interface OpenJtalkConstructor {
  new (): never;
  create(dictDir: string | URL): OpenJtalk;
  readonly prototype: OpenJtalk;
}

export type PartOfSpeech =
  | "proper noun"
  | "common noun"
  | "verb"
  | "adjective"
  | "suffix";

export interface WordOptions {
  accentType?: number;
  partOfSpeech?: PartOfSpeech;
  priority?: number;
}

export interface UserDict extends Disposable {
  addWord(
    text: string,
    pronunciation: string,
    options?: WordOptions,
  ): Uint8Array;
  updateWord(
    id: Uint8Array,
    text: string,
    pronunciation: string,
    options?: WordOptions,
  ): undefined;
  deleteWord(id: Uint8Array): undefined;
  importFrom(other: UserDict): undefined;
  save(path: string | URL): undefined;
  load(path: string | URL): undefined;
  toJSON(): unknown;
  dispose(): undefined;
}

export interface UserDictConstructor {
  new (): never;
  create(): UserDict;
  readonly prototype: UserDict;
}

export interface VoicevoxCoreModule {
  readonly VERSION: string;
  readonly Synthesizer: SynthesizerConstructor;
  readonly VoiceModel: VoiceModelConstructor;
  readonly OpenJtalk: OpenJtalkConstructor;
  readonly UserDict: UserDictConstructor;
  readonly unload: () => undefined;
}

const illegalConstructorKey = Symbol();

function illegalConstructor(key: unknown): undefined {
  if (key !== illegalConstructorKey) {
    throw new TypeError("Illegal constructor");
  }
}

function isSome<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

function asPath(pathOrURL: string | URL): string {
  return typeof pathOrURL === "string" ? pathOrURL : fromFileUrl(pathOrURL);
}

function asView(source: BufferSource): DataView {
  return ArrayBuffer.isView(source)
    ? new DataView(source.buffer, source.byteOffset, source.byteLength)
    : new DataView(source);
}

const syncLenCell = new BigUint64Array(1);
const syncPtrCell = new BigUint64Array(1);
const syncLenBuf = new Uint8Array(syncLenCell.buffer);
const syncPtrBuf = new Uint8Array(syncPtrCell.buffer);

interface SupportedDevicesJson {
  cpu: boolean;
  cuda: boolean;
  dml: boolean;
}

interface SpeakerJson {
  name: string;
  styles: { name: string; id: number }[];
  speaker_uuid: string;
  version: string;
}

interface MoraJson {
  text: string;
  consonant?: string | null;
  consonant_length?: number | null;
  vowel: string;
  vowel_length: number;
  pitch: number;
}

interface AccentPhraseJson {
  moras: MoraJson[];
  accent: number;
  pause_mora?: MoraJson | null;
  is_interrogative?: boolean;
}

interface AudioQueryJson {
  accent_phrases: AccentPhraseJson[];
  speed_scale: number;
  pitch_scale: number;
  intonation_scale: number;
  volume_scale: number;
  pre_phoneme_length: number;
  post_phoneme_length: number;
  output_sampling_rate: number;
  output_stereo: boolean;
  kana?: string | null;
}

function supportedDevicesFromJson(
  json: SupportedDevicesJson,
): SupportedDevices {
  return Object.freeze({
    cpu: json.cpu,
    cuda: json.cuda,
    dml: json.dml,
  });
}

function speakersFromJson(json: readonly SpeakerJson[]): Speakers {
  return Object.freeze(Object.fromEntries(json.map((meta) => [
    meta.speaker_uuid,
    Object.freeze({
      name: meta.name,
      version: meta.version,
      voices: Object.freeze(meta.styles.map((style) =>
        Object.freeze({
          style: style.name,
          id: style.id,
        })
      )),
    }),
  ])));
}

function moraToJson(value: Mora): MoraJson {
  return {
    text: value.text,
    consonant: value.consonant?.phoneme,
    consonant_length: value.consonant?.length,
    vowel: value.vowel.phoneme,
    vowel_length: value.vowel.length,
    pitch: value.pitch,
  };
}

function moraFromJson(json: MoraJson): Mora {
  return {
    text: json.text,
    consonant: isSome(json.consonant) && isSome(json.consonant_length)
      ? { phoneme: json.consonant, length: json.consonant_length }
      : undefined,
    vowel: { phoneme: json.vowel, length: json.vowel_length },
    pitch: json.pitch,
  };
}

function accentPhraseToJson(value: AccentPhrase): AccentPhraseJson {
  return {
    moras: value.moras.map(moraToJson),
    accent: value.accent,
    pause_mora: isSome(value.pause) ? moraToJson(value.pause) : undefined,
    is_interrogative: value.interrogative,
  };
}

function accentPhraseFromJson(json: AccentPhraseJson): AccentPhrase {
  return {
    moras: json.moras.map(moraFromJson),
    accent: json.accent,
    pause: isSome(json.pause_mora) ? moraFromJson(json.pause_mora) : undefined,
    interrogative: json.is_interrogative,
  };
}

function utteranceToJson(value: Utterance): AudioQueryJson {
  return {
    accent_phrases: value.accentPhrases.map(accentPhraseToJson),
    speed_scale: value.rate,
    pitch_scale: value.pitch,
    intonation_scale: value.intonation,
    volume_scale: value.volume,
    pre_phoneme_length: value.paddingStart,
    post_phoneme_length: value.paddingEnd,
    output_sampling_rate: value.outputSampleRate,
    output_stereo: value.outputStereo,
  };
}

function utteranceFromJson(voiceId: number, json: AudioQueryJson): Utterance {
  return {
    accentPhrases: json.accent_phrases.map(accentPhraseFromJson),
    voiceId,
    volume: json.volume_scale,
    rate: json.speed_scale,
    pitch: json.pitch_scale,
    intonation: json.intonation_scale,
    paddingStart: json.pre_phoneme_length,
    paddingEnd: json.post_phoneme_length,
    outputSampleRate: json.output_sampling_rate,
    outputStereo: json.output_stereo,
  };
}

function createUtteranceResultFromJson(
  voiceId: number,
  json: AudioQueryJson,
): CreateUtteranceResult {
  return {
    utterance: utteranceFromJson(voiceId, json),
    kana: json.kana!,
  };
}

function accelerationModeToInt(value: AccelerationMode): number {
  switch (value) {
    case "auto":
      return 0;
    case "cpu":
      return 1;
    case "gpu":
      return 2;
    default:
      throw new RangeError(
        'accelerationMode out of range; accepted values are "auto", "cpu" and "gpu"',
      );
  }
}

function partOfSpeechToInt(value: PartOfSpeech): number {
  switch (value) {
    case "proper noun":
      return 0;
    case "common noun":
      return 1;
    case "verb":
      return 2;
    case "adjective":
      return 3;
    case "suffix":
      return 4;
    default:
      throw new RangeError(
        'partOfSpeech out of range; accepted values are "proper noun", "common noun", "verb", "adjective" and "suffix"',
      );
  }
}

function synthesizerOptionsToStruct(
  struct: Uint8Array,
  value: SynthesizerOptions,
): undefined {
  const view = asView(struct);
  const accelerationMode = value.accelerationMode;
  if (accelerationMode !== undefined) {
    view.setInt32(0, accelerationModeToInt(accelerationMode), littleEndian);
  }
  const numThreads = value.numThreads;
  if (numThreads !== undefined) {
    view.setUint16(4, numThreads, littleEndian);
  }
}

function ttsOptionsToStruct(struct: Uint8Array, value: TtsOptions): undefined {
  const view = asView(struct);
  const enableInterrogativeUpspeak = value.enableInterrogativeUpspeak;
  if (enableInterrogativeUpspeak !== undefined) {
    view.setUint8(0, enableInterrogativeUpspeak ? 1 : 0);
  }
}

function synthesisOptionsToStruct(
  struct: Uint8Array,
  value: SynthesisOptions,
): undefined {
  const view = asView(struct);
  const enableInterrogativeUpspeak = value.enableInterrogativeUpspeak;
  if (enableInterrogativeUpspeak !== undefined) {
    view.setUint8(0, enableInterrogativeUpspeak ? 1 : 0);
  }
}

function wordOptionsToStruct(
  struct: Uint8Array,
  value: WordOptions,
): undefined {
  const view = asView(struct);
  const accentType = value.accentType;
  if (accentType !== undefined) {
    view.setBigUint64(16, BigInt(accentType), littleEndian);
  }
  const partOfSpeech = value.partOfSpeech;
  if (partOfSpeech !== undefined) {
    view.setInt32(24, partOfSpeechToInt(partOfSpeech), littleEndian);
  }
  const priority = value.priority;
  if (priority !== undefined) {
    view.setUint32(28, priority, littleEndian);
  }
}

declare const synthesizerHandleBrand: unique symbol;
type SynthesizerHandleBrand = typeof synthesizerHandleBrand;
type SynthesizerHandle = ManagedPointer<SynthesizerHandleBrand>;
declare const voiceModelHandleBrand: unique symbol;
type VoiceModelHandleBrand = typeof voiceModelHandleBrand;
type VoiceModelHandle = ManagedPointer<VoiceModelHandleBrand>;
declare const openJtalkRcHandleBrand: unique symbol;
type OpenJtalkRcHandleBrand = typeof openJtalkRcHandleBrand;
type OpenJtalkRcHandle = ManagedPointer<OpenJtalkRcHandleBrand>;
declare const userDictHandleBrand: unique symbol;
type UserDictHandleBrand = typeof userDictHandleBrand;
type UserDictHandle = ManagedPointer<UserDictHandleBrand>;

/** @tags allow-ffi */
export function load(libraryPath: string | URL): VoicevoxCoreModule {
  const lib = DynamicLibrary.open(libraryPath, symbols);
  const {
    voicevox_open_jtalk_rc_new,
    voicevox_open_jtalk_rc_use_user_dict,
    voicevox_open_jtalk_rc_delete,
    voicevox_make_default_initialize_options,
    voicevox_get_version,
    voicevox_voice_model_new_from_path,
    voicevox_voice_model_new_from_path_async,
    voicevox_voice_model_id,
    voicevox_voice_model_get_metas_json,
    voicevox_voice_model_delete,
    voicevox_synthesizer_new,
    voicevox_synthesizer_new_async,
    voicevox_synthesizer_delete,
    voicevox_synthesizer_load_voice_model,
    voicevox_synthesizer_load_voice_model_async,
    voicevox_synthesizer_unload_voice_model,
    voicevox_synthesizer_is_gpu_mode,
    voicevox_synthesizer_is_loaded_voice_model,
    voicevox_synthesizer_create_metas_json,
    voicevox_create_supported_devices_json,
    voicevox_synthesizer_create_audio_query_from_kana,
    voicevox_synthesizer_create_audio_query_from_kana_async,
    voicevox_synthesizer_create_audio_query,
    voicevox_synthesizer_create_audio_query_async,
    voicevox_synthesizer_create_accent_phrases_from_kana,
    voicevox_synthesizer_create_accent_phrases_from_kana_async,
    voicevox_synthesizer_create_accent_phrases,
    voicevox_synthesizer_create_accent_phrases_async,
    voicevox_synthesizer_replace_mora_data,
    voicevox_synthesizer_replace_mora_data_async,
    voicevox_synthesizer_replace_phoneme_length,
    voicevox_synthesizer_replace_phoneme_length_async,
    voicevox_synthesizer_replace_mora_pitch,
    voicevox_synthesizer_replace_mora_pitch_async,
    voicevox_make_default_synthesis_options,
    voicevox_synthesizer_synthesis,
    voicevox_synthesizer_synthesis_async,
    voicevox_make_default_tts_options,
    voicevox_synthesizer_tts_from_kana,
    voicevox_synthesizer_tts_from_kana_async,
    voicevox_synthesizer_tts,
    voicevox_synthesizer_tts_async,
    voicevox_json_free,
    voicevox_wav_free,
    voicevox_error_result_to_message,
    voicevox_user_dict_word_make,
    voicevox_user_dict_new,
    voicevox_user_dict_load,
    voicevox_user_dict_add_word,
    voicevox_user_dict_update_word,
    voicevox_user_dict_remove_word,
    voicevox_user_dict_to_json,
    voicevox_user_dict_import,
    voicevox_user_dict_save,
    voicevox_user_dict_delete,
  } = lib.symbols;
  const unwrap = (code: number, context: string) => {
    if (code === 0) {
      return;
    }
    const error = new VoicevoxError(
      code,
      `${context}: (${code}) ${
        PointerView.getCString(voicevox_error_result_to_message(code)!)
      }`,
    );
    Error.captureStackTrace?.(error, unwrap);
    throw error;
  };
  const SynthesizerHandle = createManagedPointerClass<SynthesizerHandleBrand>(
    voicevox_synthesizer_delete,
  );
  const VoiceModelHandle = createManagedPointerClass<VoiceModelHandleBrand>(
    voicevox_voice_model_delete,
  );
  const OpenJtalkRcHandle = createManagedPointerClass<OpenJtalkRcHandleBrand>(
    voicevox_open_jtalk_rc_delete,
  );
  const UserDictHandle = createManagedPointerClass<UserDictHandleBrand>(
    voicevox_user_dict_delete,
  );
  let cachedSupportedDevices: SupportedDevices | undefined;
  let synthesizerGetHandle: (o: Synthesizer) => SynthesizerHandle;

  class SynthesizerImpl implements Synthesizer {
    #cachedSpeakers?: Speakers;

    static get supportedDevices(): SupportedDevices {
      if (!cachedSupportedDevices) {
        unwrap(
          voicevox_create_supported_devices_json(syncPtrBuf)!,
          "voicevox_create_supported_devices_json",
        );
        const ptr = Pointer.create(syncPtrCell[0])!;
        let json: string;
        try {
          json = PointerView.getCString(ptr);
        } finally {
          voicevox_json_free(ptr);
        }
        cachedSupportedDevices = supportedDevicesFromJson(
          JSON.parse(json) as SupportedDevicesJson,
        );
      }
      return cachedSupportedDevices;
    }

    static async create(
      openJtalk: OpenJtalk,
      options?: SynthesizerOptions,
    ): Promise<Synthesizer> {
      const ptrCell = new BigUint64Array(1);
      unwrap(
        await voicevox_synthesizer_new_async(
          openJtalkGetHandle(openJtalk).raw,
          (() => {
            const struct = voicevox_make_default_initialize_options();
            if (options !== undefined) {
              synthesizerOptionsToStruct(struct, options);
            }
            return struct;
          })(),
          ptrCell,
        ),
        "voicevox_synthesizer_new",
      );
      return new SynthesizerImpl(
        illegalConstructorKey,
        new SynthesizerHandle(Pointer.create(ptrCell[0])),
      );
    }

    static createSync(
      openJtalk: OpenJtalk,
      options?: SynthesizerOptions,
    ): Synthesizer {
      unwrap(
        voicevox_synthesizer_new(
          openJtalkGetHandle(openJtalk).raw,
          (() => {
            const struct = voicevox_make_default_initialize_options();
            if (options !== undefined) {
              synthesizerOptionsToStruct(struct, options);
            }
            return struct;
          })(),
          syncPtrBuf,
        ),
        "voicevox_synthesizer_new",
      );
      return new SynthesizerImpl(
        illegalConstructorKey,
        new SynthesizerHandle(Pointer.create(syncPtrCell[0])),
      );
    }

    get gpuEnabled(): boolean {
      return voicevox_synthesizer_is_gpu_mode(synthesizerGetHandle(this).raw);
    }

    get speakers(): Speakers {
      if (!this.#cachedSpeakers) {
        const ptr = voicevox_synthesizer_create_metas_json(
          synthesizerGetHandle(this).raw,
        )!;
        let json: string;
        try {
          json = PointerView.getCString(ptr);
        } finally {
          voicevox_json_free(ptr);
        }
        this.#cachedSpeakers = speakersFromJson(
          JSON.parse(json) as SpeakerJson[],
        );
      }
      return this.#cachedSpeakers;
    }

    async loadModel(model: VoiceModel): Promise<undefined> {
      unwrap(
        await voicevox_synthesizer_load_voice_model_async(
          synthesizerGetHandle(this).raw,
          voiceModelGetHandle(model).raw,
        ),
        "voicevox_synthesizer_load_voice_model",
      );
      this.#cachedSpeakers = undefined;
    }

    loadModelSync(model: VoiceModel): undefined {
      unwrap(
        voicevox_synthesizer_load_voice_model(
          synthesizerGetHandle(this).raw,
          voiceModelGetHandle(model).raw,
        ),
        "voicevox_synthesizer_load_voice_model",
      );
      this.#cachedSpeakers = undefined;
    }

    unloadModel(modelId: string): undefined {
      unwrap(
        voicevox_synthesizer_unload_voice_model(
          synthesizerGetHandle(this).raw,
          encodeCString(modelId),
        ),
        "voicevox_synthesizer_unload_voice_model",
      );
      this.#cachedSpeakers = undefined;
    }

    isModelLoaded(modelId: string): boolean {
      return voicevox_synthesizer_is_loaded_voice_model(
        synthesizerGetHandle(this).raw,
        encodeCString(modelId),
      );
    }

    async tts(
      voiceId: number,
      text: string,
      options?: TtsOptions,
    ): Promise<Uint8Array> {
      const ptrCell = new BigUint64Array(1);
      const lenCell = new BigUint64Array(1);
      const textBuf = encodeCString(text);
      unwrap(
        await voicevox_synthesizer_tts_async(
          synthesizerGetHandle(this).raw,
          textBuf,
          voiceId,
          (() => {
            const struct = voicevox_make_default_tts_options();
            if (options !== undefined) {
              ttsOptionsToStruct(struct, options);
            }
            return struct;
          })(),
          lenCell,
          ptrCell,
        ),
        "voicevox_synthesizer_tts",
      );
      livenessBarrier(textBuf);
      const ptr = Pointer.create(ptrCell[0])!;
      const len = Number(lenCell[0]);
      let buf: Uint8Array;
      try {
        buf = new Uint8Array(len);
        PointerView.copyInto(ptr, buf);
      } finally {
        voicevox_wav_free(ptr);
      }
      return buf;
    }

    ttsSync(voiceId: number, text: string, options?: TtsOptions): Uint8Array {
      unwrap(
        voicevox_synthesizer_tts(
          synthesizerGetHandle(this).raw,
          encodeCString(text),
          voiceId,
          (() => {
            const struct = voicevox_make_default_tts_options();
            if (options !== undefined) {
              ttsOptionsToStruct(struct, options);
            }
            return struct;
          })(),
          syncLenBuf,
          syncPtrBuf,
        ),
        "voicevox_synthesizer_tts",
      );
      const ptr = Pointer.create(syncPtrCell[0])!;
      const len = Number(syncLenCell[0]);
      let buf: Uint8Array;
      try {
        buf = new Uint8Array(len);
        PointerView.copyInto(ptr, buf);
      } finally {
        voicevox_wav_free(ptr);
      }
      return buf;
    }

    async ttsFromKana(
      voiceId: number,
      kana: string,
      options?: TtsOptions,
    ): Promise<Uint8Array> {
      const ptrCell = new BigUint64Array(1);
      const lenCell = new BigUint64Array(1);
      const kanaBuf = encodeCString(kana);
      unwrap(
        await voicevox_synthesizer_tts_from_kana_async(
          synthesizerGetHandle(this).raw,
          kanaBuf,
          voiceId,
          (() => {
            const struct = voicevox_make_default_tts_options();
            if (options !== undefined) {
              ttsOptionsToStruct(struct, options);
            }
            return struct;
          })(),
          lenCell,
          ptrCell,
        ),
        "voicevox_synthesizer_tts_from_kana",
      );
      livenessBarrier(kanaBuf);
      const ptr = Pointer.create(ptrCell[0])!;
      const len = Number(lenCell[0]);
      let buf: Uint8Array;
      try {
        buf = new Uint8Array(len);
        PointerView.copyInto(ptr, buf);
      } finally {
        voicevox_wav_free(ptr);
      }
      return buf;
    }

    ttsFromKanaSync(
      voiceId: number,
      kana: string,
      options?: TtsOptions,
    ): Uint8Array {
      unwrap(
        voicevox_synthesizer_tts_from_kana(
          synthesizerGetHandle(this).raw,
          encodeCString(kana),
          voiceId,
          (() => {
            const struct = voicevox_make_default_tts_options();
            if (options !== undefined) {
              ttsOptionsToStruct(struct, options);
            }
            return struct;
          })(),
          syncLenBuf,
          syncPtrBuf,
        ),
        "voicevox_synthesizer_tts_from_kana",
      );
      const ptr = Pointer.create(syncPtrCell[0])!;
      const len = Number(syncLenCell[0]);
      let buf: Uint8Array;
      try {
        buf = new Uint8Array(len);
        PointerView.copyInto(ptr, buf);
      } finally {
        voicevox_wav_free(ptr);
      }
      return buf;
    }

    async speak(
      utterance: Utterance,
      options?: SynthesisOptions,
    ): Promise<Uint8Array> {
      const ptrCell = new BigUint64Array(1);
      const lenCell = new BigUint64Array(1);
      const jsonBuf = encodeCString(JSON.stringify(utteranceToJson(utterance)));
      unwrap(
        await voicevox_synthesizer_synthesis_async(
          synthesizerGetHandle(this).raw,
          jsonBuf,
          utterance.voiceId,
          (() => {
            const struct = voicevox_make_default_synthesis_options();
            if (options !== undefined) {
              synthesisOptionsToStruct(struct, options);
            }
            return struct;
          })(),
          lenCell,
          ptrCell,
        ),
        "voicevox_synthesizer_synthesis",
      );
      livenessBarrier(jsonBuf);
      const ptr = Pointer.create(ptrCell[0])!;
      const len = Number(lenCell[0]);
      let buf: Uint8Array;
      try {
        buf = new Uint8Array(len);
        PointerView.copyInto(ptr, buf);
      } finally {
        voicevox_wav_free(ptr);
      }
      return buf;
    }

    speakSync(utterance: Utterance, options?: SynthesisOptions): Uint8Array {
      unwrap(
        voicevox_synthesizer_synthesis(
          synthesizerGetHandle(this).raw,
          encodeCString(JSON.stringify(utteranceToJson(utterance))),
          utterance.voiceId,
          (() => {
            const struct = voicevox_make_default_synthesis_options();
            if (options !== undefined) {
              synthesisOptionsToStruct(struct, options);
            }
            return struct;
          })(),
          syncLenBuf,
          syncPtrBuf,
        ),
        "voicevox_synthesizer_synthesis",
      );
      const ptr = Pointer.create(syncPtrCell[0])!;
      const len = Number(syncLenCell[0]);
      let buf: Uint8Array;
      try {
        buf = new Uint8Array(len);
        PointerView.copyInto(ptr, buf);
      } finally {
        voicevox_wav_free(ptr);
      }
      return buf;
    }

    async createUtterance(
      voiceId: number,
      text: string,
    ): Promise<CreateUtteranceResult> {
      const ptrCell = new BigUint64Array(1);
      const textBuf = encodeCString(text);
      unwrap(
        await voicevox_synthesizer_create_audio_query_async(
          synthesizerGetHandle(this).raw,
          textBuf,
          voiceId,
          ptrCell,
        ),
        "voicevox_synthesizer_create_audio_query",
      );
      livenessBarrier(textBuf);
      const ptr = Pointer.create(ptrCell[0])!;
      let json: string;
      try {
        json = PointerView.getCString(ptr);
      } finally {
        voicevox_json_free(ptr);
      }
      return createUtteranceResultFromJson(
        voiceId,
        JSON.parse(json) as AudioQueryJson,
      );
    }

    createUtteranceSync(voiceId: number, text: string): CreateUtteranceResult {
      unwrap(
        voicevox_synthesizer_create_audio_query(
          synthesizerGetHandle(this).raw,
          encodeCString(text),
          voiceId,
          syncPtrBuf,
        ),
        "voicevox_synthesizer_create_audio_query",
      );
      const ptr = Pointer.create(syncPtrCell[0])!;
      let json: string;
      try {
        json = PointerView.getCString(ptr);
      } finally {
        voicevox_json_free(ptr);
      }
      return createUtteranceResultFromJson(
        voiceId,
        JSON.parse(json) as AudioQueryJson,
      );
    }

    async createUtteranceFromKana(
      voiceId: number,
      kana: string,
    ): Promise<CreateUtteranceResult> {
      const ptrCell = new BigUint64Array(1);
      const kanaBuf = encodeCString(kana);
      unwrap(
        await voicevox_synthesizer_create_audio_query_from_kana_async(
          synthesizerGetHandle(this).raw,
          kanaBuf,
          voiceId,
          ptrCell,
        ),
        "voicevox_synthesizer_create_audio_query_from_kana",
      );
      livenessBarrier(kanaBuf);
      const ptr = Pointer.create(ptrCell[0])!;
      let json: string;
      try {
        json = PointerView.getCString(ptr);
      } finally {
        voicevox_json_free(ptr);
      }
      return createUtteranceResultFromJson(
        voiceId,
        JSON.parse(json) as AudioQueryJson,
      );
    }

    createUtteranceFromKanaSync(
      voiceId: number,
      kana: string,
    ): CreateUtteranceResult {
      unwrap(
        voicevox_synthesizer_create_audio_query_from_kana(
          synthesizerGetHandle(this).raw,
          encodeCString(kana),
          voiceId,
          syncPtrBuf,
        ),
        "voicevox_synthesizer_create_audio_query_from_kana",
      );
      const ptr = Pointer.create(syncPtrCell[0])!;
      let json: string;
      try {
        json = PointerView.getCString(ptr);
      } finally {
        voicevox_json_free(ptr);
      }
      return createUtteranceResultFromJson(
        voiceId,
        JSON.parse(json) as AudioQueryJson,
      );
    }

    async createAccentPhrases(
      voiceId: number,
      text: string,
    ): Promise<AccentPhrase[]> {
      const ptrCell = new BigUint64Array(1);
      const textBuf = encodeCString(text);
      unwrap(
        await voicevox_synthesizer_create_accent_phrases_async(
          synthesizerGetHandle(this).raw,
          textBuf,
          voiceId,
          ptrCell,
        ),
        "voicevox_synthesizer_create_accent_phrases",
      );
      livenessBarrier(textBuf);
      const ptr = Pointer.create(ptrCell[0])!;
      let json: string;
      try {
        json = PointerView.getCString(ptr);
      } finally {
        voicevox_json_free(ptr);
      }
      return (JSON.parse(json) as AccentPhraseJson[]).map(
        accentPhraseFromJson,
      );
    }

    createAccentPhrasesSync(voiceId: number, text: string): AccentPhrase[] {
      unwrap(
        voicevox_synthesizer_create_accent_phrases(
          synthesizerGetHandle(this).raw,
          encodeCString(text),
          voiceId,
          syncPtrBuf,
        ),
        "voicevox_synthesizer_create_accent_phrases",
      );
      const ptr = Pointer.create(syncPtrCell[0])!;
      let json: string;
      try {
        json = PointerView.getCString(ptr);
      } finally {
        voicevox_json_free(ptr);
      }
      return (JSON.parse(json) as AccentPhraseJson[]).map(
        accentPhraseFromJson,
      );
    }

    async createAccentPhrasesFromKana(
      voiceId: number,
      kana: string,
    ): Promise<AccentPhrase[]> {
      const ptrCell = new BigUint64Array(1);
      const kanaBuf = encodeCString(kana);
      unwrap(
        await voicevox_synthesizer_create_accent_phrases_from_kana_async(
          synthesizerGetHandle(this).raw,
          kanaBuf,
          voiceId,
          ptrCell,
        ),
        "voicevox_synthesizer_create_accent_phrases_from_kana",
      );
      livenessBarrier(kanaBuf);
      const ptr = Pointer.create(ptrCell[0])!;
      let json: string;
      try {
        json = PointerView.getCString(ptr);
      } finally {
        voicevox_json_free(ptr);
      }
      return (JSON.parse(json) as AccentPhraseJson[]).map(
        accentPhraseFromJson,
      );
    }

    createAccentPhrasesFromKanaSync(
      voiceId: number,
      kana: string,
    ): AccentPhrase[] {
      unwrap(
        voicevox_synthesizer_create_accent_phrases_from_kana(
          synthesizerGetHandle(this).raw,
          encodeCString(kana),
          voiceId,
          syncPtrBuf,
        ),
        "voicevox_synthesizer_create_accent_phrases_from_kana",
      );
      const ptr = Pointer.create(syncPtrCell[0])!;
      let json: string;
      try {
        json = PointerView.getCString(ptr);
      } finally {
        voicevox_json_free(ptr);
      }
      return (JSON.parse(json) as AccentPhraseJson[]).map(
        accentPhraseFromJson,
      );
    }

    async replacePhonemeLengthAndMoraPitch(
      voiceId: number,
      accentPhrases: AccentPhrase[],
    ): Promise<AccentPhrase[]> {
      const ptrCell = new BigUint64Array(1);
      const jsonBuf = encodeCString(
        JSON.stringify(accentPhrases.map(accentPhraseToJson)),
      );
      unwrap(
        await voicevox_synthesizer_replace_mora_data_async(
          synthesizerGetHandle(this).raw,
          jsonBuf,
          voiceId,
          ptrCell,
        ),
        "voicevox_synthesizer_replace_mora_data",
      );
      livenessBarrier(jsonBuf);
      const ptr = Pointer.create(ptrCell[0])!;
      let json: string;
      try {
        json = PointerView.getCString(ptr);
      } finally {
        voicevox_json_free(ptr);
      }
      return (JSON.parse(json) as AccentPhraseJson[]).map(
        accentPhraseFromJson,
      );
    }

    replacePhonemeLengthAndMoraPitchSync(
      voiceId: number,
      accentPhrases: AccentPhrase[],
    ): AccentPhrase[] {
      unwrap(
        voicevox_synthesizer_replace_mora_data(
          synthesizerGetHandle(this).raw,
          encodeCString(JSON.stringify(accentPhrases.map(accentPhraseToJson))),
          voiceId,
          syncPtrBuf,
        ),
        "voicevox_synthesizer_replace_mora_data",
      );
      const ptr = Pointer.create(syncPtrCell[0])!;
      let json: string;
      try {
        json = PointerView.getCString(ptr);
      } finally {
        voicevox_json_free(ptr);
      }
      return (JSON.parse(json) as AccentPhraseJson[]).map(
        accentPhraseFromJson,
      );
    }

    async replacePhonemeLength(
      voiceId: number,
      accentPhrases: AccentPhrase[],
    ): Promise<AccentPhrase[]> {
      const ptrCell = new BigUint64Array(1);
      const jsonBuf = encodeCString(
        JSON.stringify(accentPhrases.map(accentPhraseToJson)),
      );
      unwrap(
        await voicevox_synthesizer_replace_phoneme_length_async(
          synthesizerGetHandle(this).raw,
          jsonBuf,
          voiceId,
          ptrCell,
        ),
        "voicevox_synthesizer_replace_phoneme_length",
      );
      livenessBarrier(jsonBuf);
      const ptr = Pointer.create(ptrCell[0])!;
      let json: string;
      try {
        json = PointerView.getCString(ptr);
      } finally {
        voicevox_json_free(ptr);
      }
      return (JSON.parse(json) as AccentPhraseJson[]).map(
        accentPhraseFromJson,
      );
    }

    replacePhonemeLengthSync(
      voiceId: number,
      accentPhrases: AccentPhrase[],
    ): AccentPhrase[] {
      unwrap(
        voicevox_synthesizer_replace_phoneme_length(
          synthesizerGetHandle(this).raw,
          encodeCString(JSON.stringify(accentPhrases.map(accentPhraseToJson))),
          voiceId,
          syncPtrBuf,
        ),
        "voicevox_synthesizer_replace_phoneme_length",
      );
      const ptr = Pointer.create(syncPtrCell[0])!;
      let json: string;
      try {
        json = PointerView.getCString(ptr);
      } finally {
        voicevox_json_free(ptr);
      }
      return (JSON.parse(json) as AccentPhraseJson[]).map(
        accentPhraseFromJson,
      );
    }

    async replaceMoraPitch(
      voiceId: number,
      accentPhrases: AccentPhrase[],
    ): Promise<AccentPhrase[]> {
      const ptrCell = new BigUint64Array(1);
      const jsonBuf = encodeCString(
        JSON.stringify(accentPhrases.map(accentPhraseToJson)),
      );
      unwrap(
        await voicevox_synthesizer_replace_mora_pitch_async(
          synthesizerGetHandle(this).raw,
          jsonBuf,
          voiceId,
          ptrCell,
        ),
        "voicevox_synthesizer_replace_mora_pitch",
      );
      livenessBarrier(jsonBuf);
      const ptr = Pointer.create(ptrCell[0])!;
      let json: string;
      try {
        json = PointerView.getCString(ptr);
      } finally {
        voicevox_json_free(ptr);
      }
      return (JSON.parse(json) as AccentPhraseJson[]).map(
        accentPhraseFromJson,
      );
    }

    replaceMoraPitchSync(
      voiceId: number,
      accentPhrases: AccentPhrase[],
    ): AccentPhrase[] {
      unwrap(
        voicevox_synthesizer_replace_mora_pitch(
          synthesizerGetHandle(this).raw,
          encodeCString(JSON.stringify(accentPhrases.map(accentPhraseToJson))),
          voiceId,
          syncPtrBuf,
        ),
        "voicevox_synthesizer_replace_mora_pitch",
      );
      const ptr = Pointer.create(syncPtrCell[0])!;
      let json: string;
      try {
        json = PointerView.getCString(ptr);
      } finally {
        voicevox_json_free(ptr);
      }
      return (JSON.parse(json) as AccentPhraseJson[]).map(
        accentPhraseFromJson,
      );
    }

    readonly #handle: SynthesizerHandle;

    constructor(key: unknown = undefined, handle: SynthesizerHandle) {
      illegalConstructor(key);
      this.#handle = handle;
    }

    dispose(): undefined {
      this.#handle.drop();
      this.#cachedSpeakers = undefined;
    }

    declare [Symbol.dispose]: () => undefined;

    static {
      Object.defineProperty(this.prototype, Symbol.dispose, {
        value: this.prototype.dispose,
        writable: true,
        configurable: true,
      });
      synthesizerGetHandle = (o) => (o as SynthesizerImpl).#handle;
    }
  }

  let voiceModelGetHandle: (o: VoiceModel) => VoiceModelHandle;

  class VoiceModelImpl implements VoiceModel {
    readonly #id: string;
    #cachedSpeakers?: Speakers;

    static async fromFile(path: string | URL): Promise<VoiceModel> {
      const ptrCell = new BigUint64Array(1);
      const pathBuf = encodeCString(asPath(path));
      unwrap(
        await voicevox_voice_model_new_from_path_async(pathBuf, ptrCell),
        "voicevox_voice_model_new_from_path",
      );
      livenessBarrier(pathBuf);
      return new VoiceModelImpl(
        illegalConstructorKey,
        new VoiceModelHandle(Pointer.create(ptrCell[0])),
      );
    }

    static fromFileSync(path: string | URL): VoiceModel {
      unwrap(
        voicevox_voice_model_new_from_path(
          encodeCString(asPath(path)),
          syncPtrBuf,
        ),
        "voicevox_voice_model_new_from_path",
      );
      return new VoiceModelImpl(
        illegalConstructorKey,
        new VoiceModelHandle(Pointer.create(syncPtrCell[0])),
      );
    }

    get id(): string {
      return this.#id;
    }

    get speakers(): Speakers {
      if (!this.#cachedSpeakers) {
        const json = PointerView.getCString(
          voicevox_voice_model_get_metas_json(voiceModelGetHandle(this).raw)!,
        );
        this.#cachedSpeakers = speakersFromJson(
          JSON.parse(json) as SpeakerJson[],
        );
      }
      return this.#cachedSpeakers;
    }

    readonly #handle: VoiceModelHandle;

    constructor(key: unknown = undefined, handle: VoiceModelHandle) {
      illegalConstructor(key);
      this.#handle = handle;
      this.#id = PointerView.getCString(voicevox_voice_model_id(handle.raw)!);
    }

    dispose(): undefined {
      this.#handle.drop();
      this.#cachedSpeakers = undefined;
    }

    declare [Symbol.dispose]: () => undefined;

    static {
      Object.defineProperty(this.prototype, Symbol.dispose, {
        value: this.prototype.dispose,
        writable: true,
        configurable: true,
      });
      voiceModelGetHandle = (o) => (o as VoiceModelImpl).#handle;
    }
  }

  let openJtalkGetHandle: (o: OpenJtalk) => OpenJtalkRcHandle;

  class OpenJtalkImpl implements OpenJtalk {
    static create(dictDir: string | URL): OpenJtalk {
      unwrap(
        voicevox_open_jtalk_rc_new(encodeCString(asPath(dictDir)), syncPtrBuf),
        "voicevox_open_jtalk_rc_new",
      );
      return new OpenJtalkImpl(
        illegalConstructorKey,
        new OpenJtalkRcHandle(Pointer.create(syncPtrCell[0])),
      );
    }

    useUserDict(userDict: UserDict): undefined {
      unwrap(
        voicevox_open_jtalk_rc_use_user_dict(
          openJtalkGetHandle(this).raw,
          userDictGetHandle(userDict).raw,
        ),
        "voicevox_open_jtalk_rc_use_user_dict",
      );
    }

    readonly #handle: OpenJtalkRcHandle;

    constructor(key: unknown = undefined, handle: OpenJtalkRcHandle) {
      illegalConstructor(key);
      this.#handle = handle;
    }

    dispose(): undefined {
      this.#handle.drop();
    }

    declare [Symbol.dispose]: () => undefined;

    static {
      Object.defineProperty(this.prototype, Symbol.dispose, {
        value: this.prototype.dispose,
        writable: true,
        configurable: true,
      });
      openJtalkGetHandle = (o) => (o as OpenJtalkImpl).#handle;
    }
  }

  let userDictGetHandle: (o: UserDict) => UserDictHandle;

  class UserDictImpl implements UserDict {
    static create(): UserDict {
      return new UserDictImpl(
        illegalConstructorKey,
        new UserDictHandle(voicevox_user_dict_new()),
      );
    }

    addWord(
      text: string,
      pronunciation: string,
      options?: WordOptions,
    ): Uint8Array {
      const textBuf = encodeCString(text);
      const pronunciationBuf = encodeCString(pronunciation);
      const id = new Uint8Array(16);
      unwrap(
        voicevox_user_dict_add_word(
          userDictGetHandle(this).raw,
          (() => {
            const struct = voicevox_user_dict_word_make(
              textBuf,
              pronunciationBuf,
            );
            if (options !== undefined) {
              wordOptionsToStruct(struct, options);
            }
            return struct;
          })(),
          id,
        ),
        "voicevox_user_dict_add_word",
      );
      livenessBarrier(textBuf);
      livenessBarrier(pronunciationBuf);
      return id;
    }

    updateWord(
      id: Uint8Array,
      text: string,
      pronunciation: string,
      options?: WordOptions,
    ): undefined {
      if (id.length !== 16) {
        throw new TypeError("Length of word ID must be 16");
      }
      const textBuf = encodeCString(text);
      const pronunciationBuf = encodeCString(pronunciation);
      unwrap(
        voicevox_user_dict_update_word(
          userDictGetHandle(this).raw,
          id,
          (() => {
            const struct = voicevox_user_dict_word_make(
              textBuf,
              pronunciationBuf,
            );
            if (options !== undefined) {
              wordOptionsToStruct(struct, options);
            }
            return struct;
          })(),
        ),
        "voicevox_user_dict_update_word",
      );
      livenessBarrier(textBuf);
      livenessBarrier(pronunciationBuf);
    }

    deleteWord(id: Uint8Array): undefined {
      unwrap(
        voicevox_user_dict_remove_word(userDictGetHandle(this).raw, id),
        "voicevox_user_dict_remove_word",
      );
    }

    importFrom(other: UserDict): undefined {
      unwrap(
        voicevox_user_dict_import(
          userDictGetHandle(this).raw,
          userDictGetHandle(other).raw,
        ),
        "voicevox_user_dict_import",
      );
    }

    save(path: string | URL): undefined {
      unwrap(
        voicevox_user_dict_save(
          userDictGetHandle(this).raw,
          encodeCString(asPath(path)),
        ),
        "voicevox_user_dict_save",
      );
    }

    load(path: string | URL): undefined {
      unwrap(
        voicevox_user_dict_load(
          userDictGetHandle(this).raw,
          encodeCString(asPath(path)),
        ),
        "voicevox_user_dict_load",
      );
    }

    toJSON(): unknown {
      unwrap(
        voicevox_user_dict_to_json(userDictGetHandle(this).raw, syncPtrBuf),
        "voicevox_user_dict_to_json",
      );
      const ptr = Pointer.create(syncPtrCell[0])!;
      let json: string;
      try {
        json = PointerView.getCString(ptr);
      } finally {
        voicevox_json_free(ptr);
      }
      return JSON.parse(json);
    }

    readonly #handle: UserDictHandle;

    constructor(key: unknown = undefined, handle: UserDictHandle) {
      illegalConstructor(key);
      this.#handle = handle;
    }

    dispose(): undefined {
      this.#handle.drop();
    }

    declare [Symbol.dispose]: () => undefined;

    static {
      Object.defineProperty(this.prototype, Symbol.dispose, {
        value: this.prototype.dispose,
        writable: true,
        configurable: true,
      });
      userDictGetHandle = (o) => (o as UserDictImpl).#handle;
    }
  }

  const unload = (): undefined => {
    lib.close();
    cachedSupportedDevices = undefined;
  };
  return Object.freeze({
    VERSION: PointerView.getCString(voicevox_get_version()!),
    Synthesizer: SynthesizerImpl as SynthesizerConstructor,
    VoiceModel: VoiceModelImpl as VoiceModelConstructor,
    OpenJtalk: OpenJtalkImpl as OpenJtalkConstructor,
    UserDict: UserDictImpl as UserDictConstructor,
    unload,
  });
}
