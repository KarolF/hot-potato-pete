import { CST } from "../CST";
import { Utils } from "../utils/Utils";
import { HotPotatoPeteBalanceFactory } from "./HotPotatoPeteBalanceFactory";
import { OpeningDealFactory } from "./OpeningDealFactory";
import { OpponentModel } from "./OpponentModel";
import { ShuffleTimingPlanner } from "./ShuffleTimingPlanner";
import { GameSnapshot } from "./interfaces";

export class GameSnapshotFactory {
  public static create(seed: number, matchNumber: number, tutorialRequested = false): GameSnapshot {
    Utils.seed(seed, CST.GAMEPLAY.RNG_NAME);
    const opponent = OpponentModel.getForMatch(matchNumber);
    const shuffleDurationMultiplier =
      (opponent.matchNumber === 1
        ? CST.GAMEPLAY.FIRST_MATCH_SHUFFLE_DURATION_MULTIPLIER
        : 1) * ShuffleTimingPlanner.getOpponentShuffleDurationMultiplier(opponent);

    const firstGameplayTutorial = Boolean(tutorialRequested && opponent.matchNumber === 1);
    const openingDeal = OpeningDealFactory.create(CST.GAMEPLAY.RNG_NAME, {
      firstGameplayTutorial
    });
    const playerStartedWithHotPotatoPete = openingDeal.playerHand.some((card) => card.isHotPotatoPete);

    const snapshot: GameSnapshot = {
      seed,
      phase: CST.GAME_PHASE.PLAYER_DRAW,
      players: {
        player: {
          id: "player",
          name: CST.STRINGS.PLAYER,
          hand: openingDeal.playerHand
        },
        bot: {
          id: "bot",
          name: opponent.name,
          hand: openingDeal.botHand
        }
      },
      discardPile: openingDeal.discardPile,
      turn: "player",
      winner: null,
      loser: null,
      lastEvent: GameSnapshotFactory.getYourTurnText(opponent.name),
      opponent,
      peterShuffle: ShuffleTimingPlanner.createInitialPeterShuffleProgress(shuffleDurationMultiplier),
      firstGameplayTutorial,
      hotPotatoPeteBalance: HotPotatoPeteBalanceFactory.create(
        playerStartedWithHotPotatoPete,
        CST.GAMEPLAY.RNG_NAME
      )
    };

    return snapshot;
  }

  public static getYourTurnText(opponentName: string): string {
    return `Choose one of ${opponentName}'s cards`;
  }
}
