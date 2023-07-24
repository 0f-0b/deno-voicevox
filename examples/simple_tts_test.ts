import { assert } from "../deps/std/assert/assert.ts";
import { assertRejects } from "../deps/std/assert/assert_rejects.ts";
import { assertStrictEquals } from "../deps/std/assert/assert_strict_equals.ts";

async function exists(path: string | URL): Promise<boolean> {
  try {
    await Deno.lstat(path);
  } catch (e: unknown) {
    if (e instanceof Deno.errors.NotFound) {
      return false;
    }
  }
  return true;
}

const rootURL = new URL("..", import.meta.url);
const entryPointURL = new URL(
  Deno.build.os === "windows" ? "simple_tts_wrapper.cmd" : "simple_tts.ts",
  import.meta.url,
);
const outputWavURL = new URL("audio.wav", rootURL);
const permissions: Deno.PermissionOptions = {
  read: [outputWavURL],
  write: [outputWavURL],
  run: [entryPointURL],
};

Deno.test("simple tts", { permissions }, async (t) => {
  if (await exists(outputWavURL)) {
    throw new TypeError("Aborting test to avoid overwriting 'audio.wav'");
  }

  await t.step("synthesize audio", async () => {
    const { success } = await new Deno.Command(entryPointURL, {
      args: ["テスト"],
      cwd: rootURL,
      stdout: "inherit",
      stderr: "inherit",
    }).output();
    assert(success);
    const info = await Deno.lstat(outputWavURL);
    assert(info.isFile);
    await Deno.remove(outputWavURL);
  });

  await t.step("print usage", async () => {
    const { code } = await new Deno.Command(entryPointURL, {
      cwd: rootURL,
      stdout: "inherit",
      stderr: "inherit",
    }).output();
    assertStrictEquals(code, 2);
    await assertRejects(() => Deno.lstat(outputWavURL), Deno.errors.NotFound);
  });
});
