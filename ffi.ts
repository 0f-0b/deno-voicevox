type Merge<T, U> = Omit<T, keyof U> & U;
type Contra<T> = (_: T) => unknown;
export const Pointer: Omit<typeof Deno.UnsafePointer, "prototype"> =
  Deno.UnsafePointer;
export type Pointer<Brand = unknown> = Deno.PointerValue<Brand>;
export const PointerView = Deno.UnsafePointerView;
export type PointerView = Deno.UnsafePointerView;
export type NativeType = Deno.NativeType | { readonly struct: [] };
export type NativePointerType<Brand = unknown> = Deno.NativeTypedPointer<
  Deno.PointerObject<Brand>
>;
export type NativeU8EnumType<T extends number> = Deno.NativeU8Enum<T>;
export type NativeI8EnumType<T extends number> = Deno.NativeI8Enum<T>;
export type NativeU16EnumType<T extends number> = Deno.NativeU16Enum<T>;
export type NativeI16EnumType<T extends number> = Deno.NativeI16Enum<T>;
export type NativeU32EnumType<T extends number> = Deno.NativeU32Enum<T>;
export type NativeI32EnumType<T extends number> = Deno.NativeI32Enum<T>;
export type NativeParams = readonly NativeType[] | [];
export type NativeResult = Deno.NativeResultType;
export type ForeignStatic = Deno.ForeignStatic;
export type ForeignFunction = Deno.ForeignFunction<NativeParams>;
export const ForeignFunctionHandle = Deno.UnsafeFnPointer as
  & (new <F extends Omit<ForeignFunction, "name">>(
    pointer: Pointer,
    type: F,
  ) => ForeignFunctionHandle<F>)
  & Omit<typeof Deno.UnsafeFnPointer, never>;
export type ForeignFunctionHandle<F extends Omit<ForeignFunction, "name">> =
  Deno.UnsafeFnPointer<F>;
export type Callback = Deno.UnsafeCallbackDefinition<NativeParams>;
export const CallbackHandle = Deno.UnsafeCallback as
  & (new <F extends Callback>(
    type: F,
    callback: CallbackHandle<F>["callback"],
  ) => CallbackHandle<F>)
  & Omit<typeof Deno.UnsafeCallback, never>;
export type CallbackHandle<F extends Callback> = Deno.UnsafeCallback<F>;
export type DynamicLibraryInterface = {
  [name: string]: ForeignStatic | ForeignFunction;
};
export type DynamicLibrary<S extends DynamicLibraryInterface> =
  Deno.DynamicLibrary<S>;
export const DynamicLibrary = {
  open: Deno.dlopen as <S extends DynamicLibraryInterface>(
    path: string | URL,
    symbols: S,
  ) => DynamicLibrary<S>,
};
type GenerateAsyncVariantsInput = {
  [name: string]:
    | Merge<ForeignFunction, { nonblocking?: boolean | "varies" }>
    | ForeignStatic;
};
type GenerateAsyncVariants<
  S extends GenerateAsyncVariantsInput,
> = keyof S extends infer K ? (
    K extends string ? S[K] extends infer T ? Contra<
          {
            true:
              & Record<K, Merge<T, { nonblocking: false }>>
              & Record<`${K}_async`, Merge<T, { nonblocking: true }>>;
            false: Record<K, T>;
          }[
            `${T extends { type: unknown } ? false : (
              T extends { nonblocking: unknown } ?
                  | ("varies" extends T["nonblocking"] ? true : never)
                  | (T["nonblocking"] extends "varies" ? never : false)
                : false
            )}`
          ]
        >
      : never
      : never
  ) extends Contra<infer R> ? R : never
  : never;

export function generateAsyncVariants<
  S extends GenerateAsyncVariantsInput,
>(symbols: S): GenerateAsyncVariants<S> {
  return Object.fromEntries(
    Object.entries(symbols).flatMap(([name, type]) =>
      !("type" in type) && type.nonblocking === "varies"
        ? [
          [name, { name, ...type, nonblocking: false }],
          [name + "_async", { name, ...type, nonblocking: true }],
        ]
        : [[name, { name, ...type }]]
    ),
  ) as GenerateAsyncVariants<S>;
}

export function livenessBarrier(obj: WeakKey): undefined {
  new WeakRef(obj);
}

export const littleEndian = new Uint8Array(Uint16Array.of(1).buffer)[0] === 1;
const encoder = new TextEncoder();

export function encodeCString(str: string): Uint8Array<ArrayBuffer> {
  const nulPos = str.indexOf("\0");
  if (nulPos !== -1) {
    throw new TypeError(`String contains NUL character at position ${nulPos}`);
  }
  return encoder.encode(str + "\0");
}

export interface ManagedPointer<Brand> {
  readonly raw: Pointer<Brand>;
  drop(): undefined;
}

export interface ManagedPointerConstructor<Brand> {
  new (ptr: Pointer<Brand>): ManagedPointer<Brand>;
  readonly prototype: ManagedPointer<Brand>;
}

export function createManagedPointerClass<Brand>(
  drop: (ptr: Pointer<Brand>) => unknown,
): ManagedPointerConstructor<Brand> {
  const finalizer = new FinalizationRegistry(drop);
  return class ManagedPointer {
    #raw: Pointer<Brand> | undefined;

    constructor(raw: Pointer<Brand>) {
      this.#raw = raw;
      finalizer.register(this, raw, this);
    }

    get raw(): Pointer<Brand> {
      if (this.#raw === undefined) {
        throw new ReferenceError("Object is disposed");
      }
      return this.#raw;
    }

    drop(): undefined {
      if (this.#raw !== undefined) {
        finalizer.unregister(this);
        drop(this.#raw);
        this.#raw = undefined;
      }
    }
  };
}
