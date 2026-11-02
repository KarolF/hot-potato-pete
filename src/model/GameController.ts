import { DrawProgressRecorder } from "./DrawProgressRecorder";
import { BotDrawPolicy } from "./BotDrawPolicy";
import { GameSnapshotFactory } from "./GameSnapshotFactory";
import { MatchOutcomeResolver } from "./MatchOutcomeResolver";
import { CST } from "../CST";
import { GameStateModel } from "./GameStateModel";
import { OpponentModel } from "./OpponentModel";
import { PlayerModel } from "./PlayerModel";
import { ShufflePlanner } from "./ShufflePlanner";
import {
  Card,
  DrawPayload,
  DrawResult,
  GameSnapshot,
  HandShuffle,
  PlayerId
} from "./interfaces";
import { RunModel } from "./RunModel";
import { StatsModel } from "./StatsModel";

export interface StartGameOptions {
  firstGameplayTutorial?: boolean;
}

export class GameController {
  private static readonly rngName = CST.GAMEPLAY.RNG_NAME;

  public static startNewGame(
    seed: number = Date.now(),
    matchNumber: number = RunModel.getInstance().getState().matchNumber,
    options: StartGameOptions = {}
  ): GameSnapshot {
    const snapshot = GameSnapshotFactory.create(seed, matchNumber, options.firstGameplayTutorial);
    GameController.resolveGameOver(snapshot);
    GameController.recordVisibleHotPotatoPeteTurn(snapshot);
    GameStateModel.getInstance().setSnapshot(snapshot);
    StatsModel.getInstance().recordGameStarted();
    return snapshot;
  }

  public static resetForTests(): void {
    RunModel.resetForTests();
  }

  public static playerDraw(index: number): DrawResult {
    return GameController.draw("player", "bot", index);
  }

  public static playerDrawById(cardId: string): DrawResult {
    return GameController.drawByCardId("player", "bot", cardId);
  }

  public static botDraw(): DrawResult {
    const snapshot = GameStateModel.getInstance().requireSnapshot();
    GameController.assertExpectedPhase(snapshot, "bot", "player");
    const index = GameController.chooseBotCardIndex(snapshot.players.player.hand, snapshot);
    return GameController.draw("bot", "player", index);
  }

  public static draw(drawer: PlayerId, source: PlayerId, index: number): DrawResult {
    const snapshot = GameStateModel.getInstance().requireSnapshot();
    GameController.assertExpectedPhase(snapshot, drawer, source);
    const sourcePlayer = snapshot.players[source];
    const draw = PlayerModel.drawCard(sourcePlayer.hand, index);

    return GameController.applyDraw(snapshot, drawer, source, { ...draw, index });
  }

  public static drawByCardId(drawer: PlayerId, source: PlayerId, cardId: string): DrawResult {
    const snapshot = GameStateModel.getInstance().requireSnapshot();
    GameController.assertExpectedPhase(snapshot, drawer, source);
    const sourcePlayer = snapshot.players[source];
    const draw = PlayerModel.drawCardById(sourcePlayer.hand, cardId);

    return GameController.applyDraw(snapshot, drawer, source, draw);
  }

  private static applyDraw(
    snapshot: GameSnapshot,
    drawer: PlayerId,
    source: PlayerId,
    draw: DrawPayload
  ): DrawResult {
    const sourcePlayer = snapshot.players[source];
    const drawerPlayer = snapshot.players[drawer];
    const bonusScore = GameController.claimShuffleBonus(snapshot, drawer, source, draw.card.id);
    const handWithDraw = [...drawerPlayer.hand, draw.card];
    const pairResult = PlayerModel.removePairs(drawer, handWithDraw);
    const removedPairs = pairResult.pairs;
    const opponent = GameController.getOpponent(snapshot);
    const shuffle = ShufflePlanner.resolvePostDrawShuffle(
      snapshot,
      opponent,
      drawer,
      draw.card.id,
      pairResult.hand,
      GameController.rngName
    );
    const drawerHand = shuffle
      ? ShufflePlanner.reorderHandByIds(pairResult.hand, shuffle.afterCardIds)
      : pairResult.hand;

    snapshot.players[source] = {
      ...sourcePlayer,
      hand: draw.hand
    };
    snapshot.players[drawer] = {
      ...drawerPlayer,
      hand: drawerHand
    };
    snapshot.discardPile.push(...removedPairs);
    DrawProgressRecorder.record(snapshot, drawer, source, draw, shuffle);
    GameController.resolveGameOver(snapshot);
    GameController.recordVisibleHotPotatoPeteTurn(snapshot);
    GameStateModel.getInstance().setSnapshot(snapshot);
    const gameOver = snapshot.winner !== null || snapshot.loser !== null;

    return {
      snapshot,
      drawnCard: draw.card,
      removedPairs,
      gameOver,
      shuffle,
      bonusScore
    };
  }

  public static getOpponent(snapshot?: GameSnapshot | null) {
    return snapshot?.opponent ?? OpponentModel.getForMatch(1);
  }

  public static shufflePlayerHand(): HandShuffle | undefined {
    const snapshot = GameStateModel.getInstance().requireSnapshot();
    if (snapshot.phase !== CST.GAME_PHASE.PLAYER_DRAW) return undefined;

    const hand = snapshot.players.player.hand;
    if (hand.length < 2) return undefined;

    const beforeCardIds = hand.map((card) => card.id);
    const afterCardIds = ShufflePlanner.createPlayerShuffleOrder(beforeCardIds, GameController.rngName);
    if (beforeCardIds.every((cardId, index) => cardId === afterCardIds[index])) return undefined;

    const steps = [afterCardIds];
    const shuffle: HandShuffle = {
      owner: "player",
      shuffleStyle: "peeky",
      shuffleSequenceCount: 1,
      shuffleNumber: 1,
      stepCount: 1,
      stepDurationMs: CST.GAMEPLAY.PLAYER_SHUFFLE_STEP_DURATION_MS,
      movedCardIds: ShufflePlanner.getMovedCardIds(beforeCardIds, steps),
      beforeCardIds,
      afterCardIds,
      steps
    };

    snapshot.players.player = {
      ...snapshot.players.player,
      hand: ShufflePlanner.reorderHandByIds(hand, afterCardIds)
    };
    GameStateModel.getInstance().setSnapshot(snapshot);
    return shuffle;
  }

  public static getYourTurnText(opponentName: string): string {
    return GameSnapshotFactory.getYourTurnText(opponentName);
  }

  public static getBotTurnText(opponentName: string): string {
    return `${opponentName} is drawing`;
  }

  public static shouldShowHotPotatoPeteTell(snapshot: GameSnapshot): boolean {
    const opponent = GameController.getOpponent(snapshot);
    const botHand = snapshot.players.bot.hand;
    const botHasHotPotatoPete = botHand.some((card) => card.isHotPotatoPete);
    if (!botHasHotPotatoPete) return false;

    if (opponent.difficulty === "superhard1") {
      return botHand.length !== 2;
    }

    if (opponent.difficulty === "superhard2") {
      const turnCount = snapshot.hotPotatoPeteTell?.botHotPotatoPetePlayerTurnCount ?? 0;
      return turnCount <= 1;
    }

    return true;
  }

  public static chooseBotCardIndex(hand: Card[], snapshot?: GameSnapshot): number {
    return BotDrawPolicy.chooseBotCardIndex(hand, GameController.rngName, snapshot);
  }


  private static assertExpectedPhase(snapshot: GameSnapshot, drawer: PlayerId, source: PlayerId): void {
    if (drawer === source) throw new Error("Cannot draw from the same hand");
    const expectedPhase =
      drawer === "player" ? CST.GAME_PHASE.PLAYER_DRAW : CST.GAME_PHASE.BOT_DRAW;

    if (snapshot.phase !== expectedPhase || snapshot.turn !== drawer) {
      throw new Error(`Cannot draw during ${snapshot.phase}`);
    }
  }

  private static recordVisibleHotPotatoPeteTurn(snapshot: GameSnapshot): void {
    if (snapshot.phase !== CST.GAME_PHASE.PLAYER_DRAW) return;
    if (!snapshot.players.bot.hand.some((card) => card.isHotPotatoPete)) return;

    snapshot.hotPotatoPeteTell = {
      botHotPotatoPetePlayerTurnCount:
        (snapshot.hotPotatoPeteTell?.botHotPotatoPetePlayerTurnCount ?? 0) + 1
    };
  }

  private static claimShuffleBonus(
    snapshot: GameSnapshot,
    drawer: PlayerId,
    source: PlayerId,
    drawnCardId: string
  ): number | undefined {
    if (drawer !== "player" || source !== "bot") return undefined;

    const bonusCardId = snapshot.shuffleBonusCardId;
    snapshot.shuffleBonusCardId = undefined;
    if (bonusCardId !== drawnCardId) return undefined;

    RunModel.getInstance().recordMarkedCardBonus();
    return RunModel.MARKED_CARD_BONUS;
  }

  private static resolveGameOver(snapshot: GameSnapshot): void {
    MatchOutcomeResolver.resolveGameOver(snapshot);
    if (snapshot.phase === CST.GAME_PHASE.GAME_OVER) GameController.recordGameResult(snapshot);
  }

  private static recordGameResult(snapshot: GameSnapshot): void {
    if (snapshot.firstGameplayTutorial) return;

    if (snapshot.winner === "player") {
      StatsModel.getInstance().recordWin();
    } else {
      StatsModel.getInstance().recordLoss();
    }
  }
}
