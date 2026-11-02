import { CST } from "../CST";
import { DrawPayload, GameSnapshot, HandShuffle, PlayerId } from "./interfaces";
import { OpponentModel } from "./OpponentModel";

export class DrawProgressRecorder {
  public static record(snapshot: GameSnapshot, drawer: PlayerId, source: PlayerId, draw: DrawPayload, shuffle?: HandShuffle): void {
    if (shuffle) {
      const shuffleDurationMultiplier = snapshot.peterShuffle?.shuffleDurationMultiplier;
      snapshot.peterShuffle = {
        count: shuffle.shuffleNumber,
        lastStepCount: shuffle.stepCount,
        lastStepDurationMs: shuffle.stepDurationMs,
        ...(shuffleDurationMultiplier !== undefined ? { shuffleDurationMultiplier } : {})
      };
      snapshot.shuffleBonusCardId = shuffle.bonusCardId;
    }
    if (drawer === "bot" && source === "player" && snapshot.hotPotatoPeteBalance) {
      snapshot.hotPotatoPeteBalance = {
        ...snapshot.hotPotatoPeteBalance,
        peterDrawCount: snapshot.hotPotatoPeteBalance.peterDrawCount + 1,
        peterHasTakenHotPotatoPeteFromPlayer:
          snapshot.hotPotatoPeteBalance.peterHasTakenHotPotatoPeteFromPlayer || draw.card.isHotPotatoPete
      };
    }

    const opponentName = snapshot.opponent?.name ?? OpponentModel.getForMatch(1).name;
    snapshot.lastEvent =
      drawer === "player"
        ? CST.STRINGS.YOU_DREW_CARD
        : `${opponentName} ${CST.STRINGS.DREW_CARD}`;

    snapshot.turn = drawer === "player" ? "bot" : "player";
    snapshot.phase =
      drawer === "player" ? CST.GAME_PHASE.BOT_DRAW : CST.GAME_PHASE.PLAYER_DRAW;
  }
}
