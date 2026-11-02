import { CST } from "../CST";
import { GameSnapshot } from "./interfaces";

export class MatchOutcomeResolver {
  public static resolveGameOver(snapshot: GameSnapshot): void {
    const playerHasHotPotatoPete = snapshot.players.player.hand.some((card) => card.isHotPotatoPete);
    const botHasHotPotatoPete = snapshot.players.bot.hand.some((card) => card.isHotPotatoPete);
    const nonBlackCards =
      snapshot.players.player.hand.filter((card) => !card.isHotPotatoPete).length +
      snapshot.players.bot.hand.filter((card) => !card.isHotPotatoPete).length;
    const emptyHand =
      snapshot.players.player.hand.length === 0 || snapshot.players.bot.hand.length === 0;

    if (!emptyHand && nonBlackCards > 0) return;

    snapshot.phase = CST.GAME_PHASE.GAME_OVER;
    snapshot.turn = "player";

    if (playerHasHotPotatoPete && !botHasHotPotatoPete) {
      snapshot.loser = "player";
      snapshot.winner = "bot";
      snapshot.lastEvent = CST.STRINGS.YOU_LOSE;
    } else {
      snapshot.loser = "bot";
      snapshot.winner = "player";
      snapshot.lastEvent = CST.STRINGS.YOU_WIN;
    }

  }
}
