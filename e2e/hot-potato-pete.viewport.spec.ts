import { expect, test } from "@playwright/test";
import { expectResponsiveCanvas, waitForCover, waitForCoverInput, clickLogical } from "./helpers";

test("keeps the canvas centered on a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();

  const layout = await page.evaluate(() => {
    const container = document.getElementById("game-container") as HTMLElement;
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    const containerRect = container.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const viewport = window.visualViewport;

    return {
      container: {
        x: containerRect.x,
        y: containerRect.y,
        width: containerRect.width,
        height: containerRect.height
      },
      canvas: {
        x: canvasRect.x,
        y: canvasRect.y,
        width: canvasRect.width,
        height: canvasRect.height
      },
      viewport: {
        x: viewport?.offsetLeft || 0,
        y: viewport?.offsetTop || 0,
        width: viewport?.width || window.innerWidth,
        height: viewport?.height || window.innerHeight
      }
    };
  });
  const viewportCenterX = layout.viewport.x + layout.viewport.width / 2;
  const viewportCenterY = layout.viewport.y + layout.viewport.height / 2;

  expect(Math.abs(layout.container.width - layout.viewport.width)).toBeLessThan(2);
  expect(Math.abs(layout.container.height - layout.viewport.height)).toBeLessThan(2);
  expect(Math.abs(layout.container.x + layout.container.width / 2 - viewportCenterX)).toBeLessThan(2);
  expect(Math.abs(layout.container.y + layout.container.height / 2 - viewportCenterY)).toBeLessThan(2);
  expect(Math.abs(layout.canvas.x + layout.canvas.width / 2 - viewportCenterX)).toBeLessThan(2);
  expect(Math.abs(layout.canvas.y + layout.canvas.height / 2 - viewportCenterY)).toBeLessThan(2);
});

test("keeps proportional sizing after mobile rotation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
  await waitForCover(page);
  await expectResponsiveCanvas(page, 390, 844);

  await page.setViewportSize({ width: 844, height: 390 });
  await expectResponsiveCanvas(page, 844, 390);

  await waitForCoverInput(page);
  await clickLogical(page, { x: 300, y: 801 });
  await page.waitForFunction(() => (window as any).hotPotatoPete.activeScenes().includes("GameplayScreen"));

  await page.setViewportSize({ width: 390, height: 844 });
  await expectResponsiveCanvas(page, 390, 844);
});
