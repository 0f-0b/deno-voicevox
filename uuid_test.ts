import { assertEquals } from "@std/assert/assert-equals";
import { assertStrictEquals } from "@std/assert/assert-strict-equals";

import { uuidFromBytes, uuidToBytes } from "./uuid.ts";

Deno.test("uuidFromBytes", { permissions: "none" }, () => {
  assertStrictEquals(
    // deno-fmt-ignore
    uuidFromBytes(Uint8Array.of(
      0xd4, 0x1d, 0x8c, 0xd9, 0x8f, 0x00, 0x32, 0x04,
      0xa9, 0x80, 0x09, 0x98, 0xec, 0xf8, 0x42, 0x7e,
    )),
    "d41d8cd9-8f00-3204-a980-0998ecf8427e",
  );
});

Deno.test("uuidToBytes", { permissions: "none" }, () => {
  assertEquals(
    uuidToBytes("d41d8cd9-8f00-3204-a980-0998ecf8427e"),
    // deno-fmt-ignore
    Uint8Array.of(
      0xd4, 0x1d, 0x8c, 0xd9, 0x8f, 0x00, 0x32, 0x04,
      0xa9, 0x80, 0x09, 0x98, 0xec, 0xf8, 0x42, 0x7e,
    ),
  );
});
