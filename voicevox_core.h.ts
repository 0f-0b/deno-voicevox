import {
  generateAsyncVariants,
  type NativeI32EnumType,
  type NativePointerType,
  type NativeType,
} from "./ffi.ts";

export type VoicevoxAccelerationMode = 0 | 1 | 2;
export const VoicevoxAccelerationMode = "i32" as NativeI32EnumType<
  VoicevoxAccelerationMode
>;
export const VoicevoxResultCode = "i32" satisfies NativeType;
export type VoicevoxUserDictWordType = 0 | 1 | 2 | 3 | 4;
export const VoicevoxUserDictWordType = "i32" as NativeI32EnumType<
  VoicevoxUserDictWordType
>;
declare const openJtalkRcBrand: unique symbol;
export type OpenJtalkRc = typeof openJtalkRcBrand;
export const OpenJtalkRcPointer = "pointer" as NativePointerType<OpenJtalkRc>;
declare const voicevoxOnnxruntimeBrand: unique symbol;
export type VoicevoxOnnxruntime = typeof voicevoxOnnxruntimeBrand;
export const VoicevoxOnnxruntimePointer = "pointer" as NativePointerType<
  VoicevoxOnnxruntime
>;
declare const voicevoxSynthesizerBrand: unique symbol;
export type VoicevoxSynthesizer = typeof voicevoxSynthesizerBrand;
export const VoicevoxSynthesizerPointer = "pointer" as NativePointerType<
  VoicevoxSynthesizer
>;
declare const voicevoxUserDictBrand: unique symbol;
export type VoicevoxUserDict = typeof voicevoxUserDictBrand;
export const VoicevoxUserDictPointer = "pointer" as NativePointerType<
  VoicevoxUserDict
>;
declare const voicevoxVoiceModelFileBrand: unique symbol;
export type VoicevoxVoiceModelFile = typeof voicevoxVoiceModelFileBrand;
export const VoicevoxVoiceModelFilePointer = "pointer" as NativePointerType<
  VoicevoxVoiceModelFile
>;
export const VoicevoxLoadOnnxruntimeOptions = {
  struct: ["pointer"],
} satisfies NativeType;
export const VoicevoxInitializeOptions = {
  struct: [VoicevoxAccelerationMode, "u16"],
} satisfies NativeType;
export const VoicevoxSynthesisOptions = {
  struct: ["bool"],
} satisfies NativeType;
export const VoicevoxTtsOptions = {
  struct: ["bool"],
} satisfies NativeType;
export const VoicevoxUserDictWord = {
  struct: ["pointer", "pointer", "usize", VoicevoxUserDictWordType, "u32"],
} satisfies NativeType;
export default generateAsyncVariants({
  voicevox_get_onnxruntime_lib_versioned_filename: {
    parameters: [],
    result: "pointer",
    optional: true,
  },
  voicevox_get_onnxruntime_lib_unversioned_filename: {
    parameters: [],
    result: "pointer",
    optional: true,
  },
  voicevox_make_default_load_onnxruntime_options: {
    parameters: [],
    result: VoicevoxLoadOnnxruntimeOptions,
    optional: true,
  },
  voicevox_onnxruntime_get: {
    parameters: [],
    result: VoicevoxOnnxruntimePointer,
  },
  voicevox_onnxruntime_load_once: {
    parameters: [VoicevoxLoadOnnxruntimeOptions, "buffer"],
    result: VoicevoxResultCode,
    optional: true,
  },
  voicevox_onnxruntime_init_once: {
    parameters: ["buffer"],
    result: VoicevoxResultCode,
    optional: true,
  },
  voicevox_open_jtalk_rc_new: {
    parameters: ["buffer", "buffer"],
    result: VoicevoxResultCode,
    nonblocking: "varies",
  },
  voicevox_open_jtalk_rc_use_user_dict: {
    parameters: [OpenJtalkRcPointer, VoicevoxUserDictPointer],
    result: VoicevoxResultCode,
    nonblocking: "varies",
  },
  voicevox_open_jtalk_rc_delete: {
    parameters: [OpenJtalkRcPointer],
    result: "void",
  },
  voicevox_make_default_initialize_options: {
    parameters: [],
    result: VoicevoxInitializeOptions,
  },
  voicevox_get_version: {
    parameters: [],
    result: "pointer",
  },
  voicevox_voice_model_file_open: {
    parameters: ["buffer", "buffer"],
    result: VoicevoxResultCode,
    nonblocking: "varies",
  },
  voicevox_voice_model_file_id: {
    parameters: [VoicevoxVoiceModelFilePointer, "buffer"],
    result: "void",
  },
  voicevox_voice_model_file_create_metas_json: {
    parameters: [VoicevoxVoiceModelFilePointer],
    result: "pointer",
  },
  voicevox_voice_model_file_delete: {
    parameters: [VoicevoxVoiceModelFilePointer],
    result: "void",
  },
  voicevox_synthesizer_new: {
    parameters: [
      VoicevoxOnnxruntimePointer,
      OpenJtalkRcPointer,
      VoicevoxInitializeOptions,
      "buffer",
    ],
    result: VoicevoxResultCode,
  },
  voicevox_synthesizer_delete: {
    parameters: [VoicevoxSynthesizerPointer],
    result: "void",
  },
  voicevox_synthesizer_load_voice_model: {
    parameters: [VoicevoxSynthesizerPointer, VoicevoxVoiceModelFilePointer],
    result: VoicevoxResultCode,
    nonblocking: "varies",
  },
  voicevox_synthesizer_unload_voice_model: {
    parameters: [VoicevoxSynthesizerPointer, "buffer"],
    result: VoicevoxResultCode,
  },
  voicevox_synthesizer_get_onnxruntime: {
    parameters: [VoicevoxSynthesizerPointer],
    result: VoicevoxOnnxruntimePointer,
  },
  voicevox_synthesizer_is_gpu_mode: {
    parameters: [VoicevoxSynthesizerPointer],
    result: "bool",
  },
  voicevox_synthesizer_is_loaded_voice_model: {
    parameters: [VoicevoxSynthesizerPointer, "buffer"],
    result: "bool",
  },
  voicevox_synthesizer_create_metas_json: {
    parameters: [VoicevoxSynthesizerPointer],
    result: "pointer",
  },
  voicevox_onnxruntime_create_supported_devices_json: {
    parameters: [VoicevoxOnnxruntimePointer, "buffer"],
    result: VoicevoxResultCode,
  },
  voicevox_synthesizer_create_audio_query_from_kana: {
    parameters: [VoicevoxSynthesizerPointer, "buffer", "u32", "buffer"],
    result: VoicevoxResultCode,
    nonblocking: "varies",
  },
  voicevox_synthesizer_create_audio_query: {
    parameters: [VoicevoxSynthesizerPointer, "buffer", "u32", "buffer"],
    result: VoicevoxResultCode,
    nonblocking: "varies",
  },
  voicevox_synthesizer_create_accent_phrases_from_kana: {
    parameters: [VoicevoxSynthesizerPointer, "buffer", "u32", "buffer"],
    result: VoicevoxResultCode,
    nonblocking: "varies",
  },
  voicevox_synthesizer_create_accent_phrases: {
    parameters: [VoicevoxSynthesizerPointer, "buffer", "u32", "buffer"],
    result: VoicevoxResultCode,
    nonblocking: "varies",
  },
  voicevox_synthesizer_replace_mora_data: {
    parameters: [VoicevoxSynthesizerPointer, "buffer", "u32", "buffer"],
    result: VoicevoxResultCode,
    nonblocking: "varies",
  },
  voicevox_synthesizer_replace_phoneme_length: {
    parameters: [VoicevoxSynthesizerPointer, "buffer", "u32", "buffer"],
    result: VoicevoxResultCode,
    nonblocking: "varies",
  },
  voicevox_synthesizer_replace_mora_pitch: {
    parameters: [VoicevoxSynthesizerPointer, "buffer", "u32", "buffer"],
    result: VoicevoxResultCode,
    nonblocking: "varies",
  },
  voicevox_make_default_synthesis_options: {
    parameters: [],
    result: VoicevoxSynthesisOptions,
  },
  voicevox_synthesizer_synthesis: {
    parameters: [
      VoicevoxSynthesizerPointer,
      "buffer",
      "u32",
      VoicevoxSynthesisOptions,
      "buffer",
      "buffer",
    ],
    result: VoicevoxResultCode,
    nonblocking: "varies",
  },
  voicevox_make_default_tts_options: {
    parameters: [],
    result: VoicevoxTtsOptions,
  },
  voicevox_synthesizer_tts_from_kana: {
    parameters: [
      VoicevoxSynthesizerPointer,
      "buffer",
      "u32",
      VoicevoxTtsOptions,
      "buffer",
      "buffer",
    ],
    result: VoicevoxResultCode,
    nonblocking: "varies",
  },
  voicevox_synthesizer_tts: {
    parameters: [
      VoicevoxSynthesizerPointer,
      "buffer",
      "u32",
      VoicevoxTtsOptions,
      "buffer",
      "buffer",
    ],
    result: VoicevoxResultCode,
    nonblocking: "varies",
  },
  voicevox_json_free: {
    parameters: ["pointer"],
    result: "void",
  },
  voicevox_wav_free: {
    parameters: ["pointer"],
    result: "void",
  },
  voicevox_error_result_to_message: {
    parameters: [VoicevoxResultCode],
    result: "pointer",
  },
  voicevox_user_dict_word_make: {
    parameters: ["buffer", "buffer"],
    result: VoicevoxUserDictWord,
  },
  voicevox_user_dict_new: {
    parameters: [],
    result: VoicevoxUserDictPointer,
  },
  voicevox_user_dict_load: {
    parameters: [VoicevoxUserDictPointer, "buffer"],
    result: VoicevoxResultCode,
    nonblocking: "varies",
  },
  voicevox_user_dict_add_word: {
    parameters: [VoicevoxUserDictPointer, "buffer", "buffer"],
    result: VoicevoxResultCode,
  },
  voicevox_user_dict_update_word: {
    parameters: [VoicevoxUserDictPointer, "buffer", "buffer"],
    result: VoicevoxResultCode,
  },
  voicevox_user_dict_remove_word: {
    parameters: [VoicevoxUserDictPointer, "buffer"],
    result: VoicevoxResultCode,
  },
  voicevox_user_dict_to_json: {
    parameters: [VoicevoxUserDictPointer, "buffer"],
    result: VoicevoxResultCode,
  },
  voicevox_user_dict_import: {
    parameters: [VoicevoxUserDictPointer, VoicevoxUserDictPointer],
    result: VoicevoxResultCode,
  },
  voicevox_user_dict_save: {
    parameters: [VoicevoxUserDictPointer, "buffer"],
    result: VoicevoxResultCode,
    nonblocking: "varies",
  },
  voicevox_user_dict_delete: {
    parameters: [VoicevoxUserDictPointer],
    result: "void",
  },
});
