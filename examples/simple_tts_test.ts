import { assert } from "../deps/std/assert/assert.ts";
import { assertRejects } from "../deps/std/assert/assert_rejects.ts";
import { assertStrictEquals } from "../deps/std/assert/assert_strict_equals.ts";
import { fromFileUrl } from "../deps/std/path/from_file_url.ts";
import { join } from "../deps/std/path/join.ts";

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

const root = fromFileUrl(new URL("..", import.meta.url));
const examples = fromFileUrl(new URL(".", import.meta.url));
const entryPoint = join(
  examples,
  Deno.build.os === "windows" ? "simple_tts_wrapper.cmd" : "simple_tts.ts",
);
const outputWavPath = join(root, "audio.wav");
const permissions: Deno.PermissionOptions = {
  read: [outputWavPath],
  write: [outputWavPath],
  run: [entryPoint],
};

Deno.test("simple tts", { permissions }, async (t) => {
  if (await exists(outputWavPath)) {
    throw new TypeError("Aborting test to avoid overwriting 'audio.wav'");
  }

  await t.step("synthesize audio", async () => {
    const { success } = await new Deno.Command(entryPoint, {
      args: ["テスト"],
      cwd: root,
      stdout: "inherit",
      stderr: "inherit",
    }).output();
    assert(success);
    const info = await Deno.lstat(outputWavPath);
    assert(info.isFile);
    await Deno.remove(outputWavPath);
  });

  await t.step("print usage", async () => {
    const { code } = await new Deno.Command(entryPoint, {
      cwd: root,
      stdout: "inherit",
      stderr: "inherit",
    }).output();
    assertStrictEquals(code, 2);
    await assertRejects(() => Deno.lstat(outputWavPath), Deno.errors.NotFound);
  });
});
