import { assert } from "@std/assert/assert";
import { assertRejects } from "@std/assert/rejects";
import { assertStrictEquals } from "@std/assert/strict-equals";
import { fromFileUrl } from "@std/path/from-file-url";
import { join } from "@std/path/join";

async function exists(path: string | URL): Promise<boolean> {
  try {
    await Deno.lstat(path);
    return true;
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      return false;
    }
    throw e;
  }
}

const root = fromFileUrl(new URL("..", import.meta.url));
const examples = fromFileUrl(new URL(".", import.meta.url));
const entryPoint = join(
  examples,
  Deno.build.os === "windows" ? "simple_tts_wrapper.cmd" : "simple_tts.ts",
);
const outputWavPath = join(root, "audio.wav");

Deno.test("simple_tts", {
  permissions: {
    read: [outputWavPath],
    write: [outputWavPath],
    run: [entryPoint],
  },
}, async (t) => {
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
