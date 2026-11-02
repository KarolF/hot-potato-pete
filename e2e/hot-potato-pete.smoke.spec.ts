import { expect, test } from "@playwright/test";
import { collectRuntimeErrors, getCanvasBox } from "./helpers";

test("loads the game canvas centered and exposes a playable debug API", async ({ page }) => {
  const runtimeErrors: string[] = [];
  collectRuntimeErrors(runtimeErrors, page);

  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
  const canvasBox = await getCanvasBox(page);
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  expect(Math.abs(canvasBox.x + canvasBox.width / 2 - viewport!.width / 2)).toBeLessThan(2);
  expect(Math.abs(canvasBox.y + canvasBox.height / 2 - viewport!.height / 2)).toBeLessThan(2);

  await page.evaluate(() => (window as any).hotPotatoPete.startGame(1234));
  await page.waitForFunction(() => Boolean((window as any).hotPotatoPete.snapshot()));

  const snapshot = await page.evaluate(() => (window as any).hotPotatoPete.snapshot());
  expect(snapshot.players.player.hand.length + snapshot.players.bot.hand.length).toBeGreaterThan(0);
  expect(runtimeErrors).toEqual([]);

  const centerPixel = await page.evaluate(() => {
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    const gl = (canvas.getContext("webgl") || canvas.getContext("webgl2")) as WebGLRenderingContext | null;
    if (gl) {
      const pixel = new Uint8Array(4);
      gl.readPixels(
        Math.floor(canvas.width / 2),
        Math.floor(canvas.height / 2),
        1,
        1,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        pixel
      );
      return Array.from(pixel);
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return [0, 0, 0, 0];
    return Array.from(ctx.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data);
  });
  expect(centerPixel[3]).toBeGreaterThan(0);
});
