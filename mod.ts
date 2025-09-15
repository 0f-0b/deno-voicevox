import { fromFileUrl } from "@std/path/from-file-url";

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
import { uuidFromBytes, uuidToBytes } from "./uuid.ts";
import symbols, {
  type OpenJtalkRc,
  type VoicevoxAccelerationMode,
  type VoicevoxOnnxruntime,
  type VoicevoxSynthesizer,
  type VoicevoxUserDict,
  type VoicevoxUserDictWordType,
  type VoicevoxVoiceModelFile,
} from "./voicevox_core.h.ts";

export class VoicevoxError extends Error {
  code: number;

  constructor(code: number, message?: string) {
    super(message);
    this.name = "VoicevoxError";
    this.code = code;
  }
}

export interface Onnxruntime {
  readonly versionedFilename: string;
  readonly unversionedFilename: string;
  load: (path?: string | URL) => undefined;
}

export type Capability = "talk" | "singing teacher" | "frame decode";

export interface Voice {
  readonly id: number;
  readonly style: string;
  readonly capabilities: readonly Capability[];
  readonly order: number | null;
}

export interface Speaker {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly voices: readonly Voice[];
  readonly order: number | null;
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
  consonant?: Phoneme | undefined;
  vowel: Phoneme;
  pitch: number;
}

export interface AccentPhrase {
  moras: Mora[];
  accent: number;
  pause?: Mora | undefined;
  interrogative?: boolean | undefined;
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
  enableInterrogativeUpspeak?: boolean | undefined;
}

export interface SynthesisOptions {
  enableInterrogativeUpspeak?: boolean | undefined;
}

export interface Synthesizer extends Disposable {
  readonly gpuEnabled: boolean;
  readonly speakers: readonly Speaker[];
  loadModel(model: VoiceModelFile): Promise<undefined>;
  loadModelSync(model: VoiceModelFile): undefined;
  unloadModel(modelId: string): undefined;
  isModelLoaded(modelId: string): boolean;
  tts(
    voiceId: number,
    text: string,
    options?: TtsOptions,
  ): Promise<Uint8Array<ArrayBuffer>>;
  ttsSync(
    voiceId: number,
    text: string,
    options?: TtsOptions,
  ): Uint8Array<ArrayBuffer>;
  ttsFromKana(
    voiceId: number,
    kana: string,
    options?: TtsOptions,
  ): Promise<Uint8Array<ArrayBuffer>>;
  ttsFromKanaSync(
    voiceId: number,
    kana: string,
    options?: TtsOptions,
  ): Uint8Array<ArrayBuffer>;
  speak(
    utterance: Utterance,
    options?: SynthesisOptions,
  ): Promise<Uint8Array<ArrayBuffer>>;
  speakSync(
    utterance: Utterance,
    options?: SynthesisOptions,
  ): Uint8Array<ArrayBuffer>;
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
    accentPhrases: readonly AccentPhrase[],
  ): Promise<AccentPhrase[]>;
  replacePhonemeLengthAndMoraPitchSync(
    voiceId: number,
    accentPhrases: readonly AccentPhrase[],
  ): AccentPhrase[];
  replacePhonemeLength(
    voiceId: number,
    accentPhrases: readonly AccentPhrase[],
  ): Promise<AccentPhrase[]>;
  replacePhonemeLengthSync(
    voiceId: number,
    accentPhrases: readonly AccentPhrase[],
  ): AccentPhrase[];
  replaceMoraPitch(
    voiceId: number,
    accentPhrases: readonly AccentPhrase[],
  ): Promise<AccentPhrase[]>;
  replaceMoraPitchSync(
    voiceId: number,
    accentPhrases: readonly AccentPhrase[],
  ): AccentPhrase[];
  dispose(): undefined;
}

export type AccelerationMode = "auto" | "cpu" | "gpu";

export interface SynthesizerOptions {
  accelerationMode?: AccelerationMode | undefined;
  numThreads?: number | undefined;
}

export interface SynthesizerConstructor {
  new (): never;
  readonly supportedDevices: SupportedDevices;
  create(openJtalk: OpenJtalk, options?: SynthesizerOptions): Synthesizer;
  createUtteranceFromAccentPhrases(
    voiceId: number,
    accentPhrases: readonly AccentPhrase[],
  ): CreateUtteranceResult;
  readonly prototype: Synthesizer;
}

export interface VoiceModelFile extends Disposable {
  readonly id: string;
  readonly speakers: readonly Speaker[];
  dispose(): undefined;
}

export interface VoiceModelFileConstructor {
  new (): never;
  open(path: string | URL): Promise<VoiceModelFile>;
  openSync(path: string | URL): VoiceModelFile;
  readonly prototype: VoiceModelFile;
}

export interface OpenJtalk extends Disposable {
  useUserDict(userDict: UserDict): Promise<undefined>;
  useUserDictSync(userDict: UserDict): undefined;
  analyze(text: string): AccentPhrase[];
  dispose(): undefined;
}

export interface OpenJtalkConstructor {
  new (): never;
  create(dictDir: string | URL): Promise<OpenJtalk>;
  createSync(dictDir: string | URL): OpenJtalk;
  readonly prototype: OpenJtalk;
}

export type PartOfSpeech =
  | "proper noun"
  | "common noun"
  | "verb"
  | "adjective"
  | "suffix";

export interface Word {
  text: string;
  pronunciation: string;
  accentType: number;
  partOfSpeech?: PartOfSpeech | undefined;
  priority?: number | undefined;
}

export interface UserDict extends Disposable {
  addWord(word: Word): string;
  updateWord(id: string, word: Word): undefined;
  deleteWord(id: string): undefined;
  importFrom(other: UserDict): undefined;
  save(path: string | URL): Promise<undefined>;
  saveSync(path: string | URL): undefined;
  load(path: string | URL): Promise<undefined>;
  loadSync(path: string | URL): undefined;
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
  readonly Onnxruntime: Onnxruntime | undefined;
  readonly Synthesizer: SynthesizerConstructor;
  readonly VoiceModelFile: VoiceModelFileConstructor;
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

function encodePath(pathOrURL: string | URL): Uint8Array<ArrayBuffer> {
  return encodeCString(asPath(pathOrURL));
}

function asDataView(view: ArrayBufferView<ArrayBuffer>): DataView<ArrayBuffer> {
  return new DataView(view.buffer, view.byteOffset, view.byteLength);
}

const syncLenCell = new BigUint64Array(1);
const syncPtrCell = new BigUint64Array(1);
const syncLenBuf = new Uint8Array(syncLenCell.buffer);
const syncPtrBuf = new Uint8Array(syncPtrCell.buffer);
const syncIdBuf = new Uint8Array(16);

interface SupportedDevicesJson {
  cpu: boolean;
  cuda: boolean;
  dml: boolean;
}

type StyleTypeJson = "talk" | "singing_teacher" | "frame_decode" | "sing";

interface StyleJson {
  id: number;
  name: string;
  type: StyleTypeJson;
  order: number | null;
}

interface SpeakerJson {
  name: string;
  styles: StyleJson[];
  version: string;
  speaker_uuid: string;
  order: number | null;
}

interface MoraJson {
  text: string;
  consonant?: string | null | undefined;
  consonant_length?: number | null | undefined;
  vowel: string;
  vowel_length: number;
  pitch: number;
}

interface AccentPhraseJson {
  moras: MoraJson[];
  accent: number;
  pause_mora?: MoraJson | null | undefined;
  is_interrogative?: boolean | undefined;
}

interface AudioQueryJson {
  accent_phrases: AccentPhraseJson[];
  speedScale: number;
  pitchScale: number;
  intonationScale: number;
  volumeScale: number;
  prePhonemeLength: number;
  postPhonemeLength: number;
  outputSamplingRate: number;
  outputStereo: boolean;
  kana?: string;
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

function capabilitiesFromJson(json: StyleTypeJson): readonly Capability[] {
  switch (json) {
    case "talk":
      return Object.freeze(["talk"]);
    case "singing_teacher":
      return Object.freeze(["singing teacher"]);
    case "frame_decode":
      return Object.freeze(["frame decode"]);
    case "sing":
      return Object.freeze(["singing teacher", "frame decode"]);
  }
}

function voiceFromJson(json: StyleJson): Voice {
  return Object.freeze({
    id: json.id,
    style: json.name,
    capabilities: capabilitiesFromJson(json.type),
    order: json.order,
  });
}

function speakerFromJson(json: SpeakerJson): Speaker {
  return Object.freeze({
    id: json.speaker_uuid,
    name: json.name,
    version: json.version,
    voices: Object.freeze(json.styles.map(voiceFromJson)),
    order: json.order,
  });
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
    speedScale: value.rate,
    pitchScale: value.pitch,
    intonationScale: value.intonation,
    volumeScale: value.volume,
    prePhonemeLength: value.paddingStart,
    postPhonemeLength: value.paddingEnd,
    outputSamplingRate: value.outputSampleRate,
    outputStereo: value.outputStereo,
  };
}

function utteranceFromJson(voiceId: number, json: AudioQueryJson): Utterance {
  return {
    accentPhrases: json.accent_phrases.map(accentPhraseFromJson),
    voiceId,
    volume: json.volumeScale,
    rate: json.speedScale,
    pitch: json.pitchScale,
    intonation: json.intonationScale,
    paddingStart: json.prePhonemeLength,
    paddingEnd: json.postPhonemeLength,
    outputSampleRate: json.outputSamplingRate,
    outputStereo: json.outputStereo,
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

function accelerationModeToInt(
  value: AccelerationMode,
): VoicevoxAccelerationMode {
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

function partOfSpeechToInt(value: PartOfSpeech): VoicevoxUserDictWordType {
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
  struct: Uint8Array<ArrayBuffer>,
  value: SynthesizerOptions,
): undefined {
  const view = asDataView(struct);
  const { accelerationMode } = value;
  if (accelerationMode !== undefined) {
    view.setInt32(0, accelerationModeToInt(accelerationMode), littleEndian);
  }
  const { numThreads } = value;
  if (numThreads !== undefined) {
    view.setUint16(4, numThreads, littleEndian);
  }
}

function ttsOptionsToStruct(
  struct: Uint8Array<ArrayBuffer>,
  value: TtsOptions,
): undefined {
  const view = asDataView(struct);
  const { enableInterrogativeUpspeak } = value;
  if (enableInterrogativeUpspeak !== undefined) {
    view.setUint8(0, enableInterrogativeUpspeak ? 1 : 0);
  }
}

function synthesisOptionsToStruct(
  struct: Uint8Array<ArrayBuffer>,
  value: SynthesisOptions,
): undefined {
  const view = asDataView(struct);
  const { enableInterrogativeUpspeak } = value;
  if (enableInterrogativeUpspeak !== undefined) {
    view.setUint8(0, enableInterrogativeUpspeak ? 1 : 0);
  }
}

function wordOptionsToStruct(
  struct: Uint8Array<ArrayBuffer>,
  value: Word,
): undefined {
  const view = asDataView(struct);
  const { partOfSpeech } = value;
  if (partOfSpeech !== undefined) {
    view.setInt32(24, partOfSpeechToInt(partOfSpeech), littleEndian);
  }
  const { priority } = value;
  if (priority !== undefined) {
    view.setUint32(28, priority, littleEndian);
  }
}

type SynthesizerHandle = ManagedPointer<VoicevoxSynthesizer>;
type VoiceModelFileHandle = ManagedPointer<VoicevoxVoiceModelFile>;
type OpenJtalkRcHandle = ManagedPointer<OpenJtalkRc>;
type UserDictHandle = ManagedPointer<VoicevoxUserDict>;

/** @tags allow-ffi */
export function load(libraryPath: string | URL): VoicevoxCoreModule {
  const lib = DynamicLibrary.open(libraryPath, symbols);
  const {
    voicevox_get_onnxruntime_lib_versioned_filename,
    voicevox_get_onnxruntime_lib_unversioned_filename,
    voicevox_make_default_load_onnxruntime_options,
    voicevox_onnxruntime_load_once,
    voicevox_onnxruntime_init_once,
    voicevox_open_jtalk_rc_new,
    voicevox_open_jtalk_rc_new_async,
    voicevox_open_jtalk_rc_use_user_dict,
    voicevox_open_jtalk_rc_use_user_dict_async,
    voicevox_open_jtalk_rc_analyze,
    voicevox_open_jtalk_rc_delete,
    voicevox_make_default_initialize_options,
    voicevox_get_version,
    voicevox_audio_query_create_from_accent_phrases,
    voicevox_voice_model_file_open,
    voicevox_voice_model_file_open_async,
    voicevox_voice_model_file_id,
    voicevox_voice_model_file_create_metas_json,
    voicevox_voice_model_file_delete,
    voicevox_synthesizer_new,
    voicevox_synthesizer_delete,
    voicevox_synthesizer_load_voice_model,
    voicevox_synthesizer_load_voice_model_async,
    voicevox_synthesizer_unload_voice_model,
    voicevox_synthesizer_is_gpu_mode,
    voicevox_synthesizer_is_loaded_voice_model,
    voicevox_synthesizer_create_metas_json,
    voicevox_onnxruntime_create_supported_devices_json,
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
    voicevox_user_dict_load_async,
    voicevox_user_dict_add_word,
    voicevox_user_dict_update_word,
    voicevox_user_dict_remove_word,
    voicevox_user_dict_to_json,
    voicevox_user_dict_import,
    voicevox_user_dict_save,
    voicevox_user_dict_save_async,
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
  let onnxruntime: Pointer<VoicevoxOnnxruntime> | undefined;
  const getOnnxruntime = (path?: string) => {
    if (onnxruntime === undefined) {
      if (voicevox_onnxruntime_init_once) {
        unwrap(
          voicevox_onnxruntime_init_once(syncPtrBuf),
          "voicevox_onnxruntime_init_once",
        );
      } else {
        const optionsStruct = voicevox_make_default_load_onnxruntime_options!();
        let pathBuf: Uint8Array<ArrayBuffer> | undefined;
        if (path !== undefined) {
          pathBuf = encodeCString(path);
          const view = asDataView(optionsStruct);
          const ptr = Pointer.value(Pointer.of(pathBuf));
          view.setBigUint64(0, ptr, littleEndian);
        }
        unwrap(
          voicevox_onnxruntime_load_once!(optionsStruct, syncPtrBuf),
          "voicevox_onnxruntime_load_once",
        );
        if (pathBuf) {
          livenessBarrier(pathBuf);
        }
      }
      onnxruntime = Pointer.create(syncPtrCell[0]);
    }
    return onnxruntime;
  };
  const SynthesizerHandle = createManagedPointerClass(
    voicevox_synthesizer_delete,
  );
  const VoiceModelFileHandle = createManagedPointerClass(
    voicevox_voice_model_file_delete,
  );
  const OpenJtalkRcHandle = createManagedPointerClass(
    voicevox_open_jtalk_rc_delete,
  );
  const UserDictHandle = createManagedPointerClass(
    voicevox_user_dict_delete,
  );
  let cachedVersionedFilename: string | undefined;
  let cachedUnversionedFilename: string | undefined;
  const Onnxruntime = voicevox_onnxruntime_init_once ? undefined : {
    get versionedFilename() {
      return cachedVersionedFilename ??= PointerView.getCString(
        voicevox_get_onnxruntime_lib_versioned_filename!()!,
      );
    },
    get unversionedFilename() {
      return cachedUnversionedFilename ??= PointerView.getCString(
        voicevox_get_onnxruntime_lib_unversioned_filename!()!,
      );
    },
    load(path?: string | URL) {
      getOnnxruntime(path === undefined ? undefined : asPath(path));
    },
  } satisfies Onnxruntime;
  let cachedSupportedDevices: SupportedDevices | undefined;
  let synthesizerGetHandle: (o: Synthesizer) => SynthesizerHandle;

  class SynthesizerImpl implements Synthesizer {
    #cachedGpuEnabled: boolean | undefined;
    #cachedSpeakers: readonly Speaker[] | undefined;

    static get supportedDevices(): SupportedDevices {
      if (cachedSupportedDevices === undefined) {
        unwrap(
          voicevox_onnxruntime_create_supported_devices_json(
            getOnnxruntime(),
            syncPtrBuf,
          ),
          "voicevox_onnxruntime_create_supported_devices_json",
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

    static create(
      openJtalk: OpenJtalk,
      options?: SynthesizerOptions,
    ): Synthesizer {
      const openJtalkHandle = openJtalkGetHandle(openJtalk);
      const optionsStruct = voicevox_make_default_initialize_options();
      if (options !== undefined) {
        synthesizerOptionsToStruct(optionsStruct, options);
      }
      unwrap(
        voicevox_synthesizer_new(
          getOnnxruntime(),
          openJtalkHandle.raw,
          optionsStruct,
          syncPtrBuf,
        ),
        "voicevox_synthesizer_new",
      );
      return new SynthesizerImpl(
        illegalConstructorKey,
        new SynthesizerHandle(Pointer.create(syncPtrCell[0])),
      );
    }

    static createUtteranceFromAccentPhrases(
      voiceId: number,
      accentPhrases: readonly AccentPhrase[],
    ): CreateUtteranceResult {
      const jsonBuf = encodeCString(
        JSON.stringify(accentPhrases.map(accentPhraseToJson)),
      );
      unwrap(
        voicevox_audio_query_create_from_accent_phrases(jsonBuf, syncPtrBuf),
        "voicevox_audio_query_create_from_accent_phrases",
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

    get gpuEnabled(): boolean {
      return this.#cachedGpuEnabled ??= voicevox_synthesizer_is_gpu_mode(
        synthesizerGetHandle(this).raw,
      );
    }

    get speakers(): readonly Speaker[] {
      if (this.#cachedSpeakers === undefined) {
        const ptr = voicevox_synthesizer_create_metas_json(
          synthesizerGetHandle(this).raw,
        )!;
        let json: string;
        try {
          json = PointerView.getCString(ptr);
        } finally {
          voicevox_json_free(ptr);
        }
        this.#cachedSpeakers = Object.freeze(
          (JSON.parse(json) as SpeakerJson[]).map(speakerFromJson),
        );
      }
      return this.#cachedSpeakers;
    }

    async loadModel(model: VoiceModelFile): Promise<undefined> {
      const thisHandle = synthesizerGetHandle(this);
      const modelHandle = voiceModelFileGetHandle(model);
      unwrap(
        await voicevox_synthesizer_load_voice_model_async(
          thisHandle.raw,
          modelHandle.raw,
        ),
        "voicevox_synthesizer_load_voice_model",
      );
      livenessBarrier(thisHandle);
      livenessBarrier(modelHandle);
      this.#cachedSpeakers = undefined;
    }

    loadModelSync(model: VoiceModelFile): undefined {
      const thisHandle = synthesizerGetHandle(this);
      const modelHandle = voiceModelFileGetHandle(model);
      unwrap(
        voicevox_synthesizer_load_voice_model(thisHandle.raw, modelHandle.raw),
        "voicevox_synthesizer_load_voice_model",
      );
      this.#cachedSpeakers = undefined;
    }

    unloadModel(modelId: string): undefined {
      const thisHandle = synthesizerGetHandle(this);
      const modelIdBuf = uuidToBytes(modelId);
      unwrap(
        voicevox_synthesizer_unload_voice_model(thisHandle.raw, modelIdBuf),
        "voicevox_synthesizer_unload_voice_model",
      );
      this.#cachedSpeakers = undefined;
    }

    isModelLoaded(modelId: string): boolean {
      return voicevox_synthesizer_is_loaded_voice_model(
        synthesizerGetHandle(this).raw,
        uuidToBytes(modelId),
      );
    }

    async tts(
      voiceId: number,
      text: string,
      options?: TtsOptions,
    ): Promise<Uint8Array<ArrayBuffer>> {
      const thisHandle = synthesizerGetHandle(this);
      const textBuf = encodeCString(text);
      const optionsStruct = voicevox_make_default_tts_options();
      if (options !== undefined) {
        ttsOptionsToStruct(optionsStruct, options);
      }
      const ptrCell = new BigUint64Array(1);
      const lenCell = new BigUint64Array(1);
      unwrap(
        await voicevox_synthesizer_tts_async(
          thisHandle.raw,
          textBuf,
          voiceId,
          optionsStruct,
          lenCell,
          ptrCell,
        ),
        "voicevox_synthesizer_tts",
      );
      livenessBarrier(thisHandle);
      livenessBarrier(textBuf);
      const ptr = Pointer.create(ptrCell[0])!;
      const len = Number(lenCell[0]);
      let buf: Uint8Array<ArrayBuffer>;
      try {
        buf = new Uint8Array(len);
        PointerView.copyInto(ptr, buf);
      } finally {
        voicevox_wav_free(ptr);
      }
      return buf;
    }

    ttsSync(
      voiceId: number,
      text: string,
      options?: TtsOptions,
    ): Uint8Array<ArrayBuffer> {
      const thisHandle = synthesizerGetHandle(this);
      const textBuf = encodeCString(text);
      const optionsStruct = voicevox_make_default_tts_options();
      if (options !== undefined) {
        ttsOptionsToStruct(optionsStruct, options);
      }
      unwrap(
        voicevox_synthesizer_tts(
          thisHandle.raw,
          textBuf,
          voiceId,
          optionsStruct,
          syncLenBuf,
          syncPtrBuf,
        ),
        "voicevox_synthesizer_tts",
      );
      const ptr = Pointer.create(syncPtrCell[0])!;
      const len = Number(syncLenCell[0]);
      let buf: Uint8Array<ArrayBuffer>;
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
    ): Promise<Uint8Array<ArrayBuffer>> {
      const thisHandle = synthesizerGetHandle(this);
      const kanaBuf = encodeCString(kana);
      const optionsStruct = voicevox_make_default_tts_options();
      if (options !== undefined) {
        ttsOptionsToStruct(optionsStruct, options);
      }
      const ptrCell = new BigUint64Array(1);
      const lenCell = new BigUint64Array(1);
      unwrap(
        await voicevox_synthesizer_tts_from_kana_async(
          thisHandle.raw,
          kanaBuf,
          voiceId,
          optionsStruct,
          lenCell,
          ptrCell,
        ),
        "voicevox_synthesizer_tts_from_kana",
      );
      livenessBarrier(thisHandle);
      livenessBarrier(kanaBuf);
      const ptr = Pointer.create(ptrCell[0])!;
      const len = Number(lenCell[0]);
      let buf: Uint8Array<ArrayBuffer>;
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
    ): Uint8Array<ArrayBuffer> {
      const thisHandle = synthesizerGetHandle(this);
      const kanaBuf = encodeCString(kana);
      const optionsStruct = voicevox_make_default_tts_options();
      if (options !== undefined) {
        ttsOptionsToStruct(optionsStruct, options);
      }
      unwrap(
        voicevox_synthesizer_tts_from_kana(
          thisHandle.raw,
          kanaBuf,
          voiceId,
          optionsStruct,
          syncLenBuf,
          syncPtrBuf,
        ),
        "voicevox_synthesizer_tts_from_kana",
      );
      const ptr = Pointer.create(syncPtrCell[0])!;
      const len = Number(syncLenCell[0]);
      let buf: Uint8Array<ArrayBuffer>;
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
    ): Promise<Uint8Array<ArrayBuffer>> {
      const thisHandle = synthesizerGetHandle(this);
      const jsonBuf = encodeCString(JSON.stringify(utteranceToJson(utterance)));
      const voiceId = utterance.voiceId;
      const optionsStruct = voicevox_make_default_synthesis_options();
      if (options !== undefined) {
        synthesisOptionsToStruct(optionsStruct, options);
      }
      const ptrCell = new BigUint64Array(1);
      const lenCell = new BigUint64Array(1);
      unwrap(
        await voicevox_synthesizer_synthesis_async(
          thisHandle.raw,
          jsonBuf,
          voiceId,
          optionsStruct,
          lenCell,
          ptrCell,
        ),
        "voicevox_synthesizer_synthesis",
      );
      livenessBarrier(thisHandle);
      livenessBarrier(jsonBuf);
      const ptr = Pointer.create(ptrCell[0])!;
      const len = Number(lenCell[0]);
      let buf: Uint8Array<ArrayBuffer>;
      try {
        buf = new Uint8Array(len);
        PointerView.copyInto(ptr, buf);
      } finally {
        voicevox_wav_free(ptr);
      }
      return buf;
    }

    speakSync(
      utterance: Utterance,
      options?: SynthesisOptions,
    ): Uint8Array<ArrayBuffer> {
      const thisHandle = synthesizerGetHandle(this);
      const jsonBuf = encodeCString(JSON.stringify(utteranceToJson(utterance)));
      const voiceId = utterance.voiceId;
      const optionsStruct = voicevox_make_default_synthesis_options();
      if (options !== undefined) {
        synthesisOptionsToStruct(optionsStruct, options);
      }
      unwrap(
        voicevox_synthesizer_synthesis(
          thisHandle.raw,
          jsonBuf,
          voiceId,
          optionsStruct,
          syncLenBuf,
          syncPtrBuf,
        ),
        "voicevox_synthesizer_synthesis",
      );
      const ptr = Pointer.create(syncPtrCell[0])!;
      const len = Number(syncLenCell[0]);
      let buf: Uint8Array<ArrayBuffer>;
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
      const thisHandle = synthesizerGetHandle(this);
      const textBuf = encodeCString(text);
      const ptrCell = new BigUint64Array(1);
      unwrap(
        await voicevox_synthesizer_create_audio_query_async(
          thisHandle.raw,
          textBuf,
          voiceId,
          ptrCell,
        ),
        "voicevox_synthesizer_create_audio_query",
      );
      livenessBarrier(thisHandle);
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
      const thisHandle = synthesizerGetHandle(this);
      const textBuf = encodeCString(text);
      unwrap(
        voicevox_synthesizer_create_audio_query(
          thisHandle.raw,
          textBuf,
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
      const thisHandle = synthesizerGetHandle(this);
      const kanaBuf = encodeCString(kana);
      const ptrCell = new BigUint64Array(1);
      unwrap(
        await voicevox_synthesizer_create_audio_query_from_kana_async(
          thisHandle.raw,
          kanaBuf,
          voiceId,
          ptrCell,
        ),
        "voicevox_synthesizer_create_audio_query_from_kana",
      );
      livenessBarrier(thisHandle);
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
      const thisHandle = synthesizerGetHandle(this);
      const kanaBuf = encodeCString(kana);
      unwrap(
        voicevox_synthesizer_create_audio_query_from_kana(
          thisHandle.raw,
          kanaBuf,
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
      const thisHandle = synthesizerGetHandle(this);
      const textBuf = encodeCString(text);
      const ptrCell = new BigUint64Array(1);
      unwrap(
        await voicevox_synthesizer_create_accent_phrases_async(
          thisHandle.raw,
          textBuf,
          voiceId,
          ptrCell,
        ),
        "voicevox_synthesizer_create_accent_phrases",
      );
      livenessBarrier(thisHandle);
      livenessBarrier(textBuf);
      const ptr = Pointer.create(ptrCell[0])!;
      let json: string;
      try {
        json = PointerView.getCString(ptr);
      } finally {
        voicevox_json_free(ptr);
      }
      return (JSON.parse(json) as AccentPhraseJson[]).map(accentPhraseFromJson);
    }

    createAccentPhrasesSync(voiceId: number, text: string): AccentPhrase[] {
      const thisHandle = synthesizerGetHandle(this);
      const textBuf = encodeCString(text);
      unwrap(
        voicevox_synthesizer_create_accent_phrases(
          thisHandle.raw,
          textBuf,
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
      return (JSON.parse(json) as AccentPhraseJson[]).map(accentPhraseFromJson);
    }

    async createAccentPhrasesFromKana(
      voiceId: number,
      kana: string,
    ): Promise<AccentPhrase[]> {
      const thisHandle = synthesizerGetHandle(this);
      const kanaBuf = encodeCString(kana);
      const ptrCell = new BigUint64Array(1);
      unwrap(
        await voicevox_synthesizer_create_accent_phrases_from_kana_async(
          thisHandle.raw,
          kanaBuf,
          voiceId,
          ptrCell,
        ),
        "voicevox_synthesizer_create_accent_phrases_from_kana",
      );
      livenessBarrier(thisHandle);
      livenessBarrier(kanaBuf);
      const ptr = Pointer.create(ptrCell[0])!;
      let json: string;
      try {
        json = PointerView.getCString(ptr);
      } finally {
        voicevox_json_free(ptr);
      }
      return (JSON.parse(json) as AccentPhraseJson[]).map(accentPhraseFromJson);
    }

    createAccentPhrasesFromKanaSync(
      voiceId: number,
      kana: string,
    ): AccentPhrase[] {
      const thisHandle = synthesizerGetHandle(this);
      const kanaBuf = encodeCString(kana);
      unwrap(
        voicevox_synthesizer_create_accent_phrases_from_kana(
          thisHandle.raw,
          kanaBuf,
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
      return (JSON.parse(json) as AccentPhraseJson[]).map(accentPhraseFromJson);
    }

    async replacePhonemeLengthAndMoraPitch(
      voiceId: number,
      accentPhrases: readonly AccentPhrase[],
    ): Promise<AccentPhrase[]> {
      const thisHandle = synthesizerGetHandle(this);
      const jsonBuf = encodeCString(
        JSON.stringify(accentPhrases.map(accentPhraseToJson)),
      );
      const ptrCell = new BigUint64Array(1);
      unwrap(
        await voicevox_synthesizer_replace_mora_data_async(
          thisHandle.raw,
          jsonBuf,
          voiceId,
          ptrCell,
        ),
        "voicevox_synthesizer_replace_mora_data",
      );
      livenessBarrier(thisHandle);
      livenessBarrier(jsonBuf);
      const ptr = Pointer.create(ptrCell[0])!;
      let json: string;
      try {
        json = PointerView.getCString(ptr);
      } finally {
        voicevox_json_free(ptr);
      }
      return (JSON.parse(json) as AccentPhraseJson[]).map(accentPhraseFromJson);
    }

    replacePhonemeLengthAndMoraPitchSync(
      voiceId: number,
      accentPhrases: readonly AccentPhrase[],
    ): AccentPhrase[] {
      const thisHandle = synthesizerGetHandle(this);
      const jsonBuf = encodeCString(
        JSON.stringify(accentPhrases.map(accentPhraseToJson)),
      );
      unwrap(
        voicevox_synthesizer_replace_mora_data(
          thisHandle.raw,
          jsonBuf,
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
      return (JSON.parse(json) as AccentPhraseJson[]).map(accentPhraseFromJson);
    }

    async replacePhonemeLength(
      voiceId: number,
      accentPhrases: readonly AccentPhrase[],
    ): Promise<AccentPhrase[]> {
      const thisHandle = synthesizerGetHandle(this);
      const jsonBuf = encodeCString(
        JSON.stringify(accentPhrases.map(accentPhraseToJson)),
      );
      const ptrCell = new BigUint64Array(1);
      unwrap(
        await voicevox_synthesizer_replace_phoneme_length_async(
          thisHandle.raw,
          jsonBuf,
          voiceId,
          ptrCell,
        ),
        "voicevox_synthesizer_replace_phoneme_length",
      );
      livenessBarrier(thisHandle);
      livenessBarrier(jsonBuf);
      const ptr = Pointer.create(ptrCell[0])!;
      let json: string;
      try {
        json = PointerView.getCString(ptr);
      } finally {
        voicevox_json_free(ptr);
      }
      return (JSON.parse(json) as AccentPhraseJson[]).map(accentPhraseFromJson);
    }

    replacePhonemeLengthSync(
      voiceId: number,
      accentPhrases: readonly AccentPhrase[],
    ): AccentPhrase[] {
      const thisHandle = synthesizerGetHandle(this);
      const jsonBuf = encodeCString(
        JSON.stringify(accentPhrases.map(accentPhraseToJson)),
      );
      unwrap(
        voicevox_synthesizer_replace_phoneme_length(
          thisHandle.raw,
          jsonBuf,
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
      return (JSON.parse(json) as AccentPhraseJson[]).map(accentPhraseFromJson);
    }

    async replaceMoraPitch(
      voiceId: number,
      accentPhrases: readonly AccentPhrase[],
    ): Promise<AccentPhrase[]> {
      const thisHandle = synthesizerGetHandle(this);
      const jsonBuf = encodeCString(
        JSON.stringify(accentPhrases.map(accentPhraseToJson)),
      );
      const ptrCell = new BigUint64Array(1);
      unwrap(
        await voicevox_synthesizer_replace_mora_pitch_async(
          thisHandle.raw,
          jsonBuf,
          voiceId,
          ptrCell,
        ),
        "voicevox_synthesizer_replace_mora_pitch",
      );
      livenessBarrier(thisHandle);
      livenessBarrier(jsonBuf);
      const ptr = Pointer.create(ptrCell[0])!;
      let json: string;
      try {
        json = PointerView.getCString(ptr);
      } finally {
        voicevox_json_free(ptr);
      }
      return (JSON.parse(json) as AccentPhraseJson[]).map(accentPhraseFromJson);
    }

    replaceMoraPitchSync(
      voiceId: number,
      accentPhrases: readonly AccentPhrase[],
    ): AccentPhrase[] {
      const thisHandle = synthesizerGetHandle(this);
      const jsonBuf = encodeCString(
        JSON.stringify(accentPhrases.map(accentPhraseToJson)),
      );
      unwrap(
        voicevox_synthesizer_replace_mora_pitch(
          thisHandle.raw,
          jsonBuf,
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
      return (JSON.parse(json) as AccentPhraseJson[]).map(accentPhraseFromJson);
    }

    readonly #handle: SynthesizerHandle;

    constructor(key: unknown = undefined, handle: SynthesizerHandle) {
      illegalConstructor(key);
      this.#handle = handle;
    }

    dispose(): undefined {
      this.#handle.drop();
      this.#cachedGpuEnabled = undefined;
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

  let voiceModelFileGetHandle: (o: VoiceModelFile) => VoiceModelFileHandle;

  class VoiceModelFileImpl implements VoiceModelFile {
    readonly #id: string;
    #cachedSpeakers: readonly Speaker[] | undefined;

    static async open(path: string | URL): Promise<VoiceModelFile> {
      const pathBuf = encodePath(path);
      const ptrCell = new BigUint64Array(1);
      unwrap(
        await voicevox_voice_model_file_open_async(pathBuf, ptrCell),
        "voicevox_voice_model_file_open",
      );
      livenessBarrier(pathBuf);
      return new VoiceModelFileImpl(
        illegalConstructorKey,
        new VoiceModelFileHandle(Pointer.create(ptrCell[0])),
      );
    }

    static openSync(path: string | URL): VoiceModelFile {
      const pathBuf = encodePath(path);
      unwrap(
        voicevox_voice_model_file_open(pathBuf, syncPtrBuf),
        "voicevox_voice_model_file_open",
      );
      return new VoiceModelFileImpl(
        illegalConstructorKey,
        new VoiceModelFileHandle(Pointer.create(syncPtrCell[0])),
      );
    }

    get id(): string {
      return this.#id;
    }

    get speakers(): readonly Speaker[] {
      if (this.#cachedSpeakers === undefined) {
        const ptr = voicevox_voice_model_file_create_metas_json(
          voiceModelFileGetHandle(this).raw,
        )!;
        let json: string;
        try {
          json = PointerView.getCString(ptr);
        } finally {
          voicevox_json_free(ptr);
        }
        this.#cachedSpeakers = Object.freeze(
          (JSON.parse(json) as SpeakerJson[]).map(speakerFromJson),
        );
      }
      return this.#cachedSpeakers;
    }

    readonly #handle: VoiceModelFileHandle;

    constructor(key: unknown = undefined, handle: VoiceModelFileHandle) {
      illegalConstructor(key);
      this.#handle = handle;
      voicevox_voice_model_file_id(handle.raw, syncIdBuf);
      this.#id = uuidFromBytes(syncIdBuf);
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
      voiceModelFileGetHandle = (o) => (o as VoiceModelFileImpl).#handle;
    }
  }

  let openJtalkGetHandle: (o: OpenJtalk) => OpenJtalkRcHandle;

  class OpenJtalkImpl implements OpenJtalk {
    static async create(dictDir: string | URL): Promise<OpenJtalk> {
      const dictDirBuf = encodePath(dictDir);
      const ptrCell = new BigUint64Array(1);
      unwrap(
        await voicevox_open_jtalk_rc_new_async(dictDirBuf, ptrCell),
        "voicevox_open_jtalk_rc_new",
      );
      livenessBarrier(dictDirBuf);
      return new OpenJtalkImpl(
        illegalConstructorKey,
        new OpenJtalkRcHandle(Pointer.create(ptrCell[0])),
      );
    }

    static createSync(dictDir: string | URL): OpenJtalk {
      const dictDirBuf = encodePath(dictDir);
      unwrap(
        voicevox_open_jtalk_rc_new(dictDirBuf, syncPtrBuf),
        "voicevox_open_jtalk_rc_new",
      );
      return new OpenJtalkImpl(
        illegalConstructorKey,
        new OpenJtalkRcHandle(Pointer.create(syncPtrCell[0])),
      );
    }

    async useUserDict(userDict: UserDict): Promise<undefined> {
      const thisHandle = openJtalkGetHandle(this);
      const userDictHandle = userDictGetHandle(userDict);
      unwrap(
        await voicevox_open_jtalk_rc_use_user_dict_async(
          thisHandle.raw,
          userDictHandle.raw,
        ),
        "voicevox_open_jtalk_rc_use_user_dict",
      );
      livenessBarrier(thisHandle);
      livenessBarrier(userDictHandle);
    }

    useUserDictSync(userDict: UserDict): undefined {
      const thisHandle = openJtalkGetHandle(this);
      const userDictHandle = userDictGetHandle(userDict);
      unwrap(
        voicevox_open_jtalk_rc_use_user_dict(
          thisHandle.raw,
          userDictHandle.raw,
        ),
        "voicevox_open_jtalk_rc_use_user_dict",
      );
    }

    analyze(text: string): AccentPhrase[] {
      const thisHandle = openJtalkGetHandle(this);
      const textBuf = encodeCString(text);
      unwrap(
        voicevox_open_jtalk_rc_analyze(thisHandle.raw, textBuf, syncPtrBuf),
        "voicevox_open_jtalk_rc_analyze",
      );
      const ptr = Pointer.create(syncPtrCell[0])!;
      let json: string;
      try {
        json = PointerView.getCString(ptr);
      } finally {
        voicevox_json_free(ptr);
      }
      return (JSON.parse(json) as AccentPhraseJson[]).map(accentPhraseFromJson);
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

    addWord(word: Word): string {
      const thisHandle = userDictGetHandle(this);
      const textBuf = encodeCString(word.text);
      const pronunciationBuf = encodeCString(word.pronunciation);
      const wordStruct = voicevox_user_dict_word_make(
        textBuf,
        pronunciationBuf,
        BigInt(word.accentType),
      );
      wordOptionsToStruct(wordStruct, word);
      const id = new Uint8Array(16);
      unwrap(
        voicevox_user_dict_add_word(thisHandle.raw, wordStruct, id),
        "voicevox_user_dict_add_word",
      );
      livenessBarrier(textBuf);
      livenessBarrier(pronunciationBuf);
      return uuidFromBytes(id);
    }

    updateWord(id: string, word: Word): undefined {
      const thisHandle = userDictGetHandle(this);
      const idBuf = uuidToBytes(id);
      const textBuf = encodeCString(word.text);
      const pronunciationBuf = encodeCString(word.pronunciation);
      const wordStruct = voicevox_user_dict_word_make(
        textBuf,
        pronunciationBuf,
        BigInt(word.accentType),
      );
      wordOptionsToStruct(wordStruct, word);
      unwrap(
        voicevox_user_dict_update_word(thisHandle.raw, idBuf, wordStruct),
        "voicevox_user_dict_update_word",
      );
      livenessBarrier(textBuf);
      livenessBarrier(pronunciationBuf);
    }

    deleteWord(id: string): undefined {
      const thisHandle = userDictGetHandle(this);
      const idBuf = uuidToBytes(id);
      unwrap(
        voicevox_user_dict_remove_word(thisHandle.raw, idBuf),
        "voicevox_user_dict_remove_word",
      );
    }

    importFrom(other: UserDict): undefined {
      const thisHandle = userDictGetHandle(this);
      const otherHandle = userDictGetHandle(other);
      unwrap(
        voicevox_user_dict_import(thisHandle.raw, otherHandle.raw),
        "voicevox_user_dict_import",
      );
    }

    async save(path: string | URL): Promise<undefined> {
      const thisHandle = userDictGetHandle(this);
      const pathBuf = encodePath(path);
      unwrap(
        await voicevox_user_dict_save_async(thisHandle.raw, pathBuf),
        "voicevox_user_dict_save",
      );
      livenessBarrier(thisHandle);
      livenessBarrier(pathBuf);
    }

    saveSync(path: string | URL): undefined {
      const thisHandle = userDictGetHandle(this);
      const pathBuf = encodePath(path);
      unwrap(
        voicevox_user_dict_save(thisHandle.raw, pathBuf),
        "voicevox_user_dict_save",
      );
    }

    async load(path: string | URL): Promise<undefined> {
      const thisHandle = userDictGetHandle(this);
      const pathBuf = encodePath(path);
      unwrap(
        await voicevox_user_dict_load_async(thisHandle.raw, pathBuf),
        "voicevox_user_dict_load",
      );
      livenessBarrier(thisHandle);
      livenessBarrier(pathBuf);
    }

    loadSync(path: string | URL): undefined {
      const thisHandle = userDictGetHandle(this);
      const pathBuf = encodePath(path);
      unwrap(
        voicevox_user_dict_load(thisHandle.raw, pathBuf),
        "voicevox_user_dict_load",
      );
    }

    toJSON(): unknown {
      const thisHandle = userDictGetHandle(this);
      unwrap(
        voicevox_user_dict_to_json(thisHandle.raw, syncPtrBuf),
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
    cachedVersionedFilename = undefined;
    cachedUnversionedFilename = undefined;
    cachedSupportedDevices = undefined;
  };
  return Object.freeze<VoicevoxCoreModule>({
    VERSION: PointerView.getCString(voicevox_get_version()!),
    Onnxruntime,
    Synthesizer: SynthesizerImpl as SynthesizerConstructor,
    VoiceModelFile: VoiceModelFileImpl as VoiceModelFileConstructor,
    OpenJtalk: OpenJtalkImpl as OpenJtalkConstructor,
    UserDict: UserDictImpl as UserDictConstructor,
    unload,
  });
}
