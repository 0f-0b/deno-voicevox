import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

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

const root = fileURLToPath(new URL("..", import.meta.url));
const entryPoint = fileURLToPath(
  new URL(
    Deno.build.os === "windows" ? "simple_tts_wrapper.cmd" : "simple_tts.ts",
    import.meta.url,
  ),
);
const outputWavPath = `${root}/audio.wav`;

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
    assert.equal(code, 2);
    await assert.rejects(() => Deno.lstat(outputWavPath), Deno.errors.NotFound);
  });
});
