import { generateAsyncVariants, type NativeType } from "./ffi.ts";

export const VoicevoxAccelerationMode = "i32" satisfies NativeType;
export const VoicevoxResultCode = "i32" satisfies NativeType;
export const VoicevoxUserDictWordType = "i32" satisfies NativeType;
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
    result: "pointer",
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
    parameters: ["pointer", "pointer"],
    result: VoicevoxResultCode,
    nonblocking: "varies",
  },
  voicevox_open_jtalk_rc_delete: {
    parameters: ["pointer"],
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
  voicevox_voice_model_new_from_path: {
    parameters: ["buffer", "buffer"],
    result: VoicevoxResultCode,
    nonblocking: "varies",
  },
  voicevox_voice_model_id: {
    parameters: ["pointer"],
    result: "pointer",
  },
  voicevox_voice_model_get_metas_json: {
    parameters: ["pointer"],
    result: "pointer",
  },
  voicevox_voice_model_delete: {
    parameters: ["pointer"],
    result: "void",
  },
  voicevox_synthesizer_new: {
    parameters: ["pointer", "pointer", VoicevoxInitializeOptions, "buffer"],
    result: VoicevoxResultCode,
  },
  voicevox_synthesizer_delete: {
    parameters: ["pointer"],
    result: "void",
  },
  voicevox_synthesizer_load_voice_model: {
    parameters: ["pointer", "pointer"],
    result: VoicevoxResultCode,
    nonblocking: "varies",
  },
  voicevox_synthesizer_unload_voice_model: {
    parameters: ["pointer", "buffer"],
    result: VoicevoxResultCode,
  },
  voicevox_synthesizer_get_onnxruntime: {
    parameters: ["pointer"],
    result: "pointer",
  },
  voicevox_synthesizer_is_gpu_mode: {
    parameters: ["pointer"],
    result: "bool",
  },
  voicevox_synthesizer_is_loaded_voice_model: {
    parameters: ["pointer", "buffer"],
    result: "bool",
  },
  voicevox_synthesizer_create_metas_json: {
    parameters: ["pointer"],
    result: "pointer",
  },
  voicevox_onnxruntime_create_supported_devices_json: {
    parameters: ["pointer", "buffer"],
    result: VoicevoxResultCode,
  },
  voicevox_synthesizer_create_audio_query_from_kana: {
    parameters: ["pointer", "buffer", "u32", "buffer"],
    result: VoicevoxResultCode,
    nonblocking: "varies",
  },
  voicevox_synthesizer_create_audio_query: {
    parameters: ["pointer", "buffer", "u32", "buffer"],
    result: VoicevoxResultCode,
    nonblocking: "varies",
  },
  voicevox_synthesizer_create_accent_phrases_from_kana: {
    parameters: ["pointer", "buffer", "u32", "buffer"],
    result: VoicevoxResultCode,
    nonblocking: "varies",
  },
  voicevox_synthesizer_create_accent_phrases: {
    parameters: ["pointer", "buffer", "u32", "buffer"],
    result: VoicevoxResultCode,
    nonblocking: "varies",
  },
  voicevox_synthesizer_replace_mora_data: {
    parameters: ["pointer", "buffer", "u32", "buffer"],
    result: VoicevoxResultCode,
    nonblocking: "varies",
  },
  voicevox_synthesizer_replace_phoneme_length: {
    parameters: ["pointer", "buffer", "u32", "buffer"],
    result: VoicevoxResultCode,
    nonblocking: "varies",
  },
  voicevox_synthesizer_replace_mora_pitch: {
    parameters: ["pointer", "buffer", "u32", "buffer"],
    result: VoicevoxResultCode,
    nonblocking: "varies",
  },
  voicevox_make_default_synthesis_options: {
    parameters: [],
    result: VoicevoxSynthesisOptions,
  },
  voicevox_synthesizer_synthesis: {
    parameters: [
      "pointer",
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
      "pointer",
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
      "pointer",
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
    result: "pointer",
  },
  voicevox_user_dict_load: {
    parameters: ["pointer", "buffer"],
    result: VoicevoxResultCode,
    nonblocking: "varies",
  },
  voicevox_user_dict_add_word: {
    parameters: ["pointer", "buffer", "buffer"],
    result: VoicevoxResultCode,
  },
  voicevox_user_dict_update_word: {
    parameters: ["pointer", "buffer", "buffer"],
    result: VoicevoxResultCode,
  },
  voicevox_user_dict_remove_word: {
    parameters: ["pointer", "buffer"],
    result: VoicevoxResultCode,
  },
  voicevox_user_dict_to_json: {
    parameters: ["pointer", "buffer"],
    result: VoicevoxResultCode,
  },
  voicevox_user_dict_import: {
    parameters: ["pointer", "pointer"],
    result: VoicevoxResultCode,
  },
  voicevox_user_dict_save: {
    parameters: ["pointer", "buffer"],
    result: VoicevoxResultCode,
    nonblocking: "varies",
  },
  voicevox_user_dict_delete: {
    parameters: ["pointer"],
    result: "void",
  },
});
