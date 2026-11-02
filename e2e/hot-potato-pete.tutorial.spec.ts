import { expect, test } from "@playwright/test";
import { collectRuntimeErrors, waitForCoverInput, clickLogical, waitForGameplayTutorialStage, clickBotCardByIndex, clickBotCardHitPoint } from "./helpers";

test("runs the first gameplay tutorial before normal play continues", async ({ page }) => {
  const runtimeErrors: string[] = [];
  collectRuntimeErrors(runtimeErrors, page);

  await page.goto("/");
  await waitForCoverInput(page);
  await clickLogical(page, { x: 300, y: 801 });
  await page.waitForFunction(() => (window as any).hotPotatoPete.activeScenes().includes("GameplayScreen"));
  await waitForGameplayTutorialStage(page, "first_pick");

  const openingState = await page.evaluate(() => {
    const snapshot = (window as any).hotPotatoPete.snapshot();
    const targetCardId = (window as any).hotPotatoPete.gameplayTutorialTargetCardId();

    return {
      botHasHotPotatoPete: snapshot.players.bot.hand.some((card: any) => card.isHotPotatoPete),
      botHandLength: snapshot.players.bot.hand.length,
      playerHasHotPotatoPete: snapshot.players.player.hand.some((card: any) => card.isHotPotatoPete),
      targetIsHotPotatoPete: snapshot.players.bot.hand.find((card: any) => card.id === targetCardId)?.isHotPotatoPete,
      targetIndex: snapshot.players.bot.hand.findIndex((card: any) => card.id === targetCardId),
      hotPotatoPeteIndex: snapshot.players.bot.hand.findIndex((card: any) => card.isHotPotatoPete),
      arrows: (window as any).hotPotatoPete.gameplayTutorialArrows()
    };
  });

  expect(openingState.botHasHotPotatoPete).toBe(true);
  expect(openingState.playerHasHotPotatoPete).toBe(false);
  expect(openingState.targetIsHotPotatoPete).toBe(false);
  expect(openingState.targetIndex).toBe(openingState.botHandLength - 1);
  expect(openingState.hotPotatoPeteIndex).toBe(0);
  expect(openingState.arrows).toHaveLength(1);
  expect(openingState.arrows[0].side).toBe("right");
  expect(openingState.arrows[0].tail.x).toBeGreaterThan(openingState.arrows[0].target.x);
  expect(openingState.arrows[0].tail.y).toBe(openingState.arrows[0].target.y);

  await clickBotCardHitPoint(page, openingState.hotPotatoPeteIndex, { x: 0.05, y: 0.5 });
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => (window as any).hotPotatoPete.gameplayTutorialStage())).toBe("first_pick");
  expect(await page.evaluate(() => (window as any).hotPotatoPete.snapshot().phase)).toBe("player_draw");

  await clickBotCardByIndex(page, openingState.targetIndex);
  await waitForGameplayTutorialStage(page, "eye_intro");
  await expect.poll(() => page.evaluate(() => (window as any).hotPotatoPete.readyForInput())).toBe(false);

  const introText = await page.evaluate(() => (window as any).hotPotatoPete.gameplayTutorialText());
  expect(introText).toContain("Marked Martha");
  expect(introText).toContain("My eyes goes bigger, when I see Hot Potato Pete card");

  const eyeIntroState = await page.evaluate(() => {
    const snapshot = (window as any).hotPotatoPete.snapshot();
    const targetCardId = (window as any).hotPotatoPete.gameplayTutorialTargetCardId();

    return {
      botHandLength: snapshot.players.bot.hand.length,
      hotPotatoPeteIndex: snapshot.players.bot.hand.findIndex((card: any) => card.isHotPotatoPete),
      targetIndex: snapshot.players.bot.hand.findIndex((card: any) => card.id === targetCardId),
      arrows: (window as any).hotPotatoPete.gameplayTutorialArrows()
    };
  });

  expect(eyeIntroState.hotPotatoPeteIndex).toBe(0);
  expect(eyeIntroState.targetIndex).toBe(eyeIntroState.botHandLength - 1);
  expect(eyeIntroState.arrows).toHaveLength(1);
  expect(eyeIntroState.arrows[0].side).toBe("bottom");
  expect(eyeIntroState.arrows[0].tail.x).toBe(eyeIntroState.arrows[0].target.x);
  expect(eyeIntroState.arrows[0].tail.y).toBeGreaterThan(eyeIntroState.arrows[0].target.y);

  await waitForGameplayTutorialStage(page, "hot-potato-pete-intro");
  await expect.poll(() => page.evaluate(() => (window as any).hotPotatoPete.readyForInput())).toBe(false);
  expect(await page.evaluate(() => (window as any).hotPotatoPete.gameplayTutorialText()))
    .toContain("My eyes goes bigger, when I see Hot Potato Pete card");

  const hotPotatoPeteIntroState = await page.evaluate(() => {
    const snapshot = (window as any).hotPotatoPete.snapshot();

    return {
      hotPotatoPeteIndex: snapshot.players.bot.hand.findIndex((card: any) => card.isHotPotatoPete),
      arrows: (window as any).hotPotatoPete.gameplayTutorialArrows()
    };
  });

  expect(hotPotatoPeteIntroState.hotPotatoPeteIndex).toBe(0);
  expect(hotPotatoPeteIntroState.arrows).toHaveLength(1);
  expect(hotPotatoPeteIntroState.arrows[0].side).toBe("left");
  expect(hotPotatoPeteIntroState.arrows[0].tail.x)
    .toBeLessThan(hotPotatoPeteIntroState.arrows[0].target.x);
  expect(hotPotatoPeteIntroState.arrows[0].tail.y).toBe(hotPotatoPeteIntroState.arrows[0].target.y);

  await waitForGameplayTutorialStage(page, "second_pick");
  await expect.poll(() => page.evaluate(() => (window as any).hotPotatoPete.readyForInput())).toBe(true);
  expect(await page.evaluate(() => (window as any).hotPotatoPete.gameplayTutorialText()))
    .toBe("click that card");

  const secondPickState = await page.evaluate(() => {
    const snapshot = (window as any).hotPotatoPete.snapshot();
    const targetCardId = (window as any).hotPotatoPete.gameplayTutorialTargetCardId();

    return {
      botHandLength: snapshot.players.bot.hand.length,
      targetIndex: snapshot.players.bot.hand.findIndex((card: any) => card.id === targetCardId),
      hotPotatoPeteIndex: snapshot.players.bot.hand.findIndex((card: any) => card.isHotPotatoPete),
      arrows: (window as any).hotPotatoPete.gameplayTutorialArrows()
    };
  });

  expect(secondPickState.targetIndex).toBe(secondPickState.botHandLength - 1);
  expect(secondPickState.hotPotatoPeteIndex).toBe(0);
  expect(secondPickState.arrows).toHaveLength(1);
  expect(secondPickState.arrows[0].side).toBe("right");
  expect(secondPickState.arrows[0].tail.x).toBeGreaterThan(secondPickState.arrows[0].target.x);
  expect(secondPickState.arrows[0].tail.y).toBe(secondPickState.arrows[0].target.y);
  await clickBotCardHitPoint(page, secondPickState.hotPotatoPeteIndex, { x: 0.05, y: 0.5 });
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => (window as any).hotPotatoPete.gameplayTutorialStage())).toBe("second_pick");
  expect(await page.evaluate(() => (window as any).hotPotatoPete.snapshot().phase)).toBe("player_draw");

  await clickBotCardByIndex(page, secondPickState.targetIndex);
  await page.waitForFunction(() => {
    const rawStats = localStorage.getItem("hot-potato-pete-stats");
    const stats = rawStats ? JSON.parse(rawStats) : {};
    return (
      !(window as any).hotPotatoPete.gameplayTutorialVisible() &&
      (window as any).hotPotatoPete.gameplayTutorialStage() === "complete" &&
      stats.tutorialSeen === true
    );
  });

  expect(runtimeErrors).toEqual([]);
});
