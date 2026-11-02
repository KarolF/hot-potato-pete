import { expect, test } from "@playwright/test";
import { collectRuntimeErrors, waitForCover, waitForCoverInput, waitForGameplayInput, clickLogical, markAllOpponentHintsSeen } from "./helpers";

test("play button accepts clicks across its full rectangle", async ({ page }) => {
  const logicalPoints = [
    { x: 300, y: 801 },
    { x: 138, y: 765 },
    { x: 462, y: 765 },
    { x: 138, y: 837 },
    { x: 462, y: 837 }
  ];

  await page.goto("/");
  for (let index = 0; index < logicalPoints.length; index++) {
    const logicalPoint = logicalPoints[index];
    await waitForCoverInput(page);
    const point = await page.evaluate((p) => (window as any).hotPotatoPete.logicalToCss(p), logicalPoint);
    await page.mouse.click(point.x, point.y);
    await page.waitForFunction(() =>
      (window as any).hotPotatoPete.activeScenes().includes("GameplayScreen")
    );
    if (index < logicalPoints.length - 1) {
      await page.evaluate(() =>
        (window as any).game.scene.getScene("GameplayScreen").transitionToScene("CoverScreen")
      );
    }
  }
});

test("play works after returning to menu", async ({ page }) => {
  await page.goto("/");
  await waitForCoverInput(page);

  await clickLogical(page, { x: 300, y: 801 });
  await page.waitForFunction(() => (window as any).hotPotatoPete.activeScenes().includes("GameplayScreen"));

  await page.evaluate(() =>
    (window as any).game.scene.getScene("GameplayScreen").transitionToScene("CoverScreen")
  );
  await waitForCoverInput(page);

  await clickLogical(page, { x: 300, y: 801 });
  await page.waitForFunction(() => (window as any).hotPotatoPete.activeScenes().includes("GameplayScreen"));
});

test("clicks every visible opponent card slice reliably", async ({ page }) => {
  const runtimeErrors: string[] = [];
  collectRuntimeErrors(runtimeErrors, page);
  await markAllOpponentHintsSeen(page);
  await page.goto("/");
  await waitForCover(page);

  await page.evaluate(() => (window as any).hotPotatoPete.startGame(2233));
  await page.waitForFunction(() => (window as any).hotPotatoPete.botCardCssClickPoints().length > 0);
  await waitForGameplayInput(page);
  const cardCount = await page.evaluate(() => (window as any).hotPotatoPete.botCardCssClickPoints().length);

  for (let i = 0; i < cardCount; i++) {
    await page.evaluate(() => (window as any).hotPotatoPete.startGame(2233));
    await page.waitForFunction(
      (index) => (window as any).hotPotatoPete.botCardCssClickPoints().length > index,
      i
    );
    await waitForGameplayInput(page);

    const point = await page.evaluate((index) => (window as any).hotPotatoPete.botCardCssClickPoints()[index], i);
    await page.mouse.click(point.x, point.y);
    await page.waitForFunction(() => (window as any).hotPotatoPete.snapshot().phase !== "player_draw", null, {
      timeout: 5000
    });
    const phase = await page.evaluate(() => (window as any).hotPotatoPete.snapshot().phase);
    expect(["bot_draw", "game_over"]).toContain(phase);
  }

  expect(runtimeErrors).toEqual([]);
});

test("shuffles player cards when clicking the player's hand", async ({ page }) => {
  const runtimeErrors: string[] = [];
  collectRuntimeErrors(runtimeErrors, page);
  await markAllOpponentHintsSeen(page);
  await page.goto("/");
  await waitForCover(page);
  await page.evaluate(() => (window as any).hotPotatoPete.startGame(2244));
  await page.waitForFunction(() => (window as any).hotPotatoPete.playerCardCssClickPoints().length > 1);
  await waitForGameplayInput(page);

  const beforeCardIds = await page.evaluate(() =>
    (window as any).hotPotatoPete.snapshot().players.player.hand.map((card: any) => card.id)
  );
  const point = await page.evaluate(() => (window as any).hotPotatoPete.playerCardCssClickPoints()[0]);
  await page.mouse.click(point.x, point.y);

  await page.waitForFunction(
    (expectedBeforeCardIds) => {
      const snapshot = (window as any).hotPotatoPete.snapshot();
      const afterCardIds = snapshot.players.player.hand.map((card: any) => card.id);
      return (
        snapshot.phase === "player_draw" &&
        snapshot.turn === "player" &&
        afterCardIds.join(",") !== expectedBeforeCardIds.join(",")
      );
    },
    beforeCardIds,
    { timeout: 5000 }
  );

  const afterCardIds = await page.evaluate(() =>
    (window as any).hotPotatoPete.snapshot().players.player.hand.map((card: any) => card.id)
  );
  expect(afterCardIds).not.toEqual(beforeCardIds);
  expect(afterCardIds.slice().sort()).toEqual(beforeCardIds.slice().sort());
  expect(runtimeErrors).toEqual([]);
});

test("skips an active player hand shuffle only on a later click", async ({ page }) => {
  const runtimeErrors: string[] = [];
  collectRuntimeErrors(runtimeErrors, page);
  await markAllOpponentHintsSeen(page);
  await page.goto("/");
  await waitForCover(page);
  await page.evaluate(() => (window as any).hotPotatoPete.startGame(2244));
  await page.waitForFunction(() => (window as any).hotPotatoPete.playerCardCssClickPoints().length > 1);
  await waitForGameplayInput(page);

  const beforeCardIds = await page.evaluate(() =>
    (window as any).hotPotatoPete.snapshot().players.player.hand.map((card: any) => card.id)
  );
  const shufflePoint = await page.evaluate(() => (window as any).hotPotatoPete.playerCardCssClickPoints()[0]);
  await page.mouse.click(shufflePoint.x, shufflePoint.y);

  await page.waitForFunction(() => (window as any).hotPotatoPete.animationSkippable(), null, {
    timeout: 1000
  });
  await expect.poll(() => page.evaluate(() => (window as any).hotPotatoPete.readyForInput()))
    .toBe(false);

  const skipPoint = await page.evaluate(() => (window as any).hotPotatoPete.logicalToCss({ x: 300, y: 480 }));
  await page.mouse.click(skipPoint.x, skipPoint.y);

  await page.waitForFunction(
    (expectedBeforeCardIds) => {
      const snapshot = (window as any).hotPotatoPete.snapshot();
      const afterCardIds = snapshot.players.player.hand.map((card: any) => card.id);
      return (
        (window as any).hotPotatoPete.readyForInput() &&
        snapshot.phase === "player_draw" &&
        afterCardIds.join(",") !== expectedBeforeCardIds.join(",")
      );
    },
    beforeCardIds,
    { timeout: 5000 }
  );

  const afterCardIds = await page.evaluate(() =>
    (window as any).hotPotatoPete.snapshot().players.player.hand.map((card: any) => card.id)
  );
  expect(afterCardIds.slice().sort()).toEqual(beforeCardIds.slice().sort());
  expect(runtimeErrors).toEqual([]);
});

test("accepts clicks on card centers and corners", async ({ page }) => {
  test.setTimeout(90000);
  await markAllOpponentHintsSeen(page);
  await page.goto("/");
  await waitForCover(page);
  await page.evaluate(() => (window as any).hotPotatoPete.startGame(2233));
  await page.waitForFunction(() => (window as any).hotPotatoPete.botCardCssClickRects().length > 0);
  await waitForGameplayInput(page);

  const cardCount = await page.evaluate(() => (window as any).hotPotatoPete.botCardCssClickRects().length);
  const sampleIndices = [...new Set([0, Math.floor(cardCount / 2), cardCount - 1])];

  for (const cardIndex of sampleIndices) {
    const localPoints = [
      { x: 0.5, y: 0.5 },
      { x: 0.08, y: 0.1 },
      { x: 0.92, y: 0.1 },
      { x: 0.08, y: 0.9 },
      { x: 0.92, y: 0.9 }
    ];

    for (let pointIndex = 0; pointIndex < localPoints.length; pointIndex++) {
      await page.evaluate(() => (window as any).hotPotatoPete.startGame(2233));
      await page.waitForFunction(
        ({ index, points }) =>
          (window as any).hotPotatoPete.botCardCssHitPoints(index, points).length === points.length,
        { index: cardIndex, points: localPoints }
      );
      await waitForGameplayInput(page);

      const point = await page.evaluate(
        ({ index, points, selectedPointIndex }) =>
          (window as any).hotPotatoPete.botCardCssHitPoints(index, points)[selectedPointIndex],
        { index: cardIndex, points: localPoints, selectedPointIndex: pointIndex }
      );

      await page.mouse.click(point.x, point.y);
      await page.waitForFunction(() => (window as any).hotPotatoPete.snapshot().phase !== "player_draw", null, {
        timeout: 5000
      });
    }
  }
});
