import { expect, test } from "@playwright/test";
import { waitForCover, waitForGameplayInput, waitForGameplayButtons, clickLogical, markAllOpponentHintsSeen, waitForOpponentHint } from "./helpers";

test("debug start can select each run opponent", async ({ page }) => {
  await page.goto("/");
  await waitForCover(page);

  const opponents = [
    { matchNumber: 1, id: "marked_martha", name: "Marked Martha", difficulty: "easy" },
    { matchNumber: 2, id: "slim_mcsleeves", name: "Slim McSleeves", difficulty: "easy" },
    { matchNumber: 3, id: "peeky_pete", name: "Peeky Pete", difficulty: "easy" }
  ];

  for (const opponent of opponents) {
    await page.evaluate(
      ({ seed, matchNumber }) => (window as any).hotPotatoPete.startGame(seed, matchNumber),
      { seed: 3000 + opponent.matchNumber, matchNumber: opponent.matchNumber }
    );
    await page.waitForFunction(() => (window as any).hotPotatoPete.activeScenes().includes("GameplayScreen"));
    const snapshot = await page.evaluate(() => (window as any).hotPotatoPete.snapshot());

    expect(snapshot.opponent).toMatchObject(opponent);
    expect(snapshot.players.bot.name).toBe(opponent.name);
  }
});

test("auto-shows each opponent hint once", async ({ page }) => {
  await page.goto("/");
  await waitForCover(page);

  const hints = [
    {
      matchNumber: 1,
      name: "Marked Martha",
      text: "My eyes goes bigger, when I see Hot Potato Pete card"
    },
    {
      matchNumber: 2,
      name: "Slim McSleeves",
      text: "I blink, when I see Hot Potato Pete card"
    },
    {
      matchNumber: 3,
      name: "Peeky Pete",
      text: "I look on Hot Potato Pete card little longer"
    }
  ];

  for (const hint of hints) {
    await page.evaluate(
      ({ seed, matchNumber }) => (window as any).hotPotatoPete.startGame(seed, matchNumber),
      { seed: 4100 + hint.matchNumber, matchNumber: hint.matchNumber }
    );
    await page.waitForFunction(() => (window as any).hotPotatoPete.activeScenes().includes("GameplayScreen"));
    await waitForOpponentHint(page, hint.text);

    const overlayText = await page.evaluate(() => (window as any).hotPotatoPete.opponentHintText());
    expect(overlayText).toContain(hint.name);
    expect(overlayText).toContain(hint.text);

    await page.evaluate(() => (window as any).hotPotatoPete.dismissOpponentHint());
    await page.waitForFunction(() => !(window as any).hotPotatoPete.opponentHintVisible());
  }

  await page.evaluate(() => (window as any).hotPotatoPete.startGame(4201, 1));
  await page.waitForFunction(() => (window as any).hotPotatoPete.activeScenes().includes("GameplayScreen"));
  await waitForGameplayInput(page);
  const visibleAfterRepeat = await page.evaluate(() => (window as any).hotPotatoPete.opponentHintVisible());
  expect(visibleAfterRepeat).toBe(false);
});

test("gameplay help button includes the current opponent hint", async ({ page }) => {
  await markAllOpponentHintsSeen(page);
  await page.goto("/");
  await waitForCover(page);
  await page.evaluate(() => (window as any).hotPotatoPete.startGame(4302, 2));
  await page.waitForFunction(() => (window as any).hotPotatoPete.activeScenes().includes("GameplayScreen"));
  await waitForGameplayInput(page);
  await waitForGameplayButtons(page);

  await clickLogical(page, { x: 572, y: 42 });

  await page.waitForFunction(
    () => (window as any).hotPotatoPete.howToPlayText().includes("Slim McSleeves")
  );
  const modalText = await page.evaluate(() => (window as any).hotPotatoPete.howToPlayText());

  expect(modalText).toContain("OPPONENT HINT");
  expect(modalText).toContain("I blink, when I see Hot Potato Pete card");
});

test("keeps opponent sunglasses after superhard tells are suppressed", async ({ page }) => {
  await markAllOpponentHintsSeen(page);
  await page.goto("/");
  await waitForCover(page);
  await page.evaluate(() => (window as any).hotPotatoPete.startGame(4403, 13));
  await page.waitForFunction(() => (window as any).hotPotatoPete.activeScenes().includes("GameplayScreen"));
  await waitForGameplayInput(page);

  const visibility = await page.evaluate(() => {
    const scene = (window as any).hotPotatoPeteScene;
    const snapshot = (window as any).hotPotatoPete.snapshot();
    const playerHotPotatoPete = snapshot.players.player.hand.find((card: any) => card.isHotPotatoPete);

    if (playerHotPotatoPete) {
      snapshot.players.player.hand = snapshot.players.player.hand.filter((card: any) => !card.isHotPotatoPete);
      snapshot.players.bot.hand = [playerHotPotatoPete, ...snapshot.players.bot.hand];
    }

    snapshot.phase = "player_draw";
    snapshot.hotPotatoPeteTell = { botHotPotatoPetePlayerTurnCount: 1 };
    scene.renderSnapshot(snapshot);
    const visibleWithTell = (window as any).hotPotatoPete.opponentSunglassesVisible();

    snapshot.hotPotatoPeteTell = { botHotPotatoPetePlayerTurnCount: 2 };
    scene.renderSnapshot(snapshot);
    const visibleWithoutTell = (window as any).hotPotatoPete.opponentSunglassesVisible();

    snapshot.hotPotatoPeteTell = { botHotPotatoPetePlayerTurnCount: 1 };
    scene.renderSnapshot(snapshot);
    const visibleAfterTellWouldReturn = (window as any).hotPotatoPete.opponentSunglassesVisible();

    snapshot.phase = "game_over";
    scene.renderSnapshot(snapshot);
    const visibleOnGameOver = (window as any).hotPotatoPete.opponentSunglassesVisible();

    return {
      visibleWithTell,
      visibleWithoutTell,
      visibleAfterTellWouldReturn,
      visibleOnGameOver
    };
  });

  expect(visibility.visibleWithTell).toBe(false);
  expect(visibility.visibleWithoutTell).toBe(true);
  expect(visibility.visibleAfterTellWouldReturn).toBe(true);
  expect(visibility.visibleOnGameOver).toBe(true);

  await page.evaluate(() => (window as any).hotPotatoPete.startGame(4404, 14));
  await page.waitForFunction(() => (window as any).hotPotatoPete.activeScenes().includes("GameplayScreen"));
  await waitForGameplayInput(page);
  await expect.poll(() => page.evaluate(() => (window as any).hotPotatoPete.opponentSunglassesVisible()))
    .toBe(false);
});
