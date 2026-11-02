import { ConsoleMessage, expect, Page } from "@playwright/test";

export function collectRuntimeErrors(pageErrors: string[], page: Page): void {
  page.on("pageerror", (error: Error) => {
    if (error.message.includes("Framebuffer status: Framebuffer Unsupported")) return;
    pageErrors.push(error.message);
  });
  page.on("console", (message: ConsoleMessage) => {
    if (message.type() === "error") pageErrors.push(message.text());
  });
}

export async function getCanvasBox(page: Page): Promise<{ x: number; y: number; width: number; height: number }> {
  return page.locator("canvas").evaluate((canvas) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height
    };
  });
}

export async function expectResponsiveCanvas(page: Page, width: number, height: number): Promise<void> {
  await page.waitForFunction(
    ({ expectedWidth, expectedHeight }) => {
      const canvas = document.querySelector("canvas");
      const game = (window as any).game;
      if (!canvas || !game?.scale?.gameSize) return false;

      const rect = canvas.getBoundingClientRect();
      const gameRatio = game.scale.gameSize.width / game.scale.gameSize.height;
      const viewportRatio = expectedWidth / expectedHeight;

      return (
        Math.abs(rect.width - expectedWidth) < 2 &&
        Math.abs(rect.height - expectedHeight) < 2 &&
        Math.abs(gameRatio - viewportRatio) < 0.02
      );
    },
    { expectedWidth: width, expectedHeight: height }
  );

  const layout = await page.evaluate(() => {
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const game = (window as any).game;
    const center = (window as any).hotPotatoPete.logicalToCss({ x: 300, y: 480 });

    return {
      rect: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
      },
      gameSize: {
        width: game.scale.gameSize.width,
        height: game.scale.gameSize.height
      },
      center
    };
  });

  expect(layout.rect.width).toBeLessThanOrEqual(width + 2);
  expect(layout.rect.height).toBeLessThanOrEqual(height + 2);
  expect(Math.abs(layout.rect.x + layout.rect.width / 2 - width / 2)).toBeLessThan(2);
  expect(Math.abs(layout.rect.y + layout.rect.height / 2 - height / 2)).toBeLessThan(2);
  expect(Math.abs(layout.gameSize.width / layout.gameSize.height - width / height)).toBeLessThan(0.02);
  expect(Math.abs(layout.center.x - width / 2)).toBeLessThan(2);
  expect(Math.abs(layout.center.y - height / 2)).toBeLessThan(2);
}

export async function waitForCover(page: Page): Promise<void> {
  await page.waitForFunction(() =>
    Boolean((window as any).game?.scene?.getScenes(true).some((scene: any) => scene.scene.key === "CoverScreen"))
  );
}

export async function waitForCoverInput(page: Page): Promise<void> {
  await waitForCover(page);
  await page.waitForFunction(() => Boolean((window as any).hotPotatoPete.coverReadyForInput()));
}

export async function waitForGameplayInput(page: Page): Promise<void> {
  await page.waitForFunction(() => Boolean((window as any).hotPotatoPete.readyForInput()));
}

export async function waitForGameplayButtons(page: Page): Promise<void> {
  await page.waitForFunction(() =>
    Boolean((window as any).hotPotatoPete.gameplayButtonsReadyForInput())
  );
}

export async function clickLogical(page: Page, point: { x: number; y: number }): Promise<void> {
  const cssPoint = await page.evaluate((p) => (window as any).hotPotatoPete.logicalToCss(p), point);
  await page.mouse.click(cssPoint.x, cssPoint.y);
}

export async function markAllOpponentHintsSeen(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const raw = localStorage.getItem("hot-potato-pete-stats");
    const stats = raw ? JSON.parse(raw) : {};
    localStorage.setItem(
      "hot-potato-pete-stats",
      JSON.stringify({
        ...stats,
        opponentHintsSeen: {
          peeky_pete: true,
          slim_mcsleeves: true,
          marked_martha: true
        }
      })
    );
  });
}

export async function waitForOpponentHint(page: Page, hintText: string): Promise<void> {
  await page.waitForFunction(
    (expectedHint) =>
      Boolean(
        (window as any).hotPotatoPete.opponentHintVisible() &&
          (window as any).hotPotatoPete.opponentHintText().includes(expectedHint)
      ),
    hintText
  );
}

export async function waitForGameplayTutorialStage(page: Page, stage: string): Promise<void> {
  await page.waitForFunction(
    (expectedStage) => (window as any).hotPotatoPete.gameplayTutorialStage() === expectedStage,
    stage
  );
}

export async function clickBotCardByIndex(page: Page, index: number): Promise<void> {
  const point = await page.evaluate(
    (cardIndex) => (window as any).hotPotatoPete.botCardCssClickPoints()[cardIndex],
    index
  );
  await page.mouse.click(point.x, point.y);
}

export async function clickBotCardHitPoint(
  page: Page,
  index: number,
  localPoint: { x: number; y: number }
): Promise<void> {
  const point = await page.evaluate(
    ({ cardIndex, hitPoint }) =>
      (window as any).hotPotatoPete.botCardCssHitPoints(cardIndex, [hitPoint])[0],
    { cardIndex: index, hitPoint: localPoint }
  );
  await page.mouse.click(point.x, point.y);
}
