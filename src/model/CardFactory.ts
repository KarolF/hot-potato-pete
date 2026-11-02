import { CST } from "../CST";
import { Card, Rank, Suit } from "./interfaces";

export class CardFactory {
  public static createCard(rank: Rank, suit: Suit): Card {
    return {
      id: `${rank}_${suit}`,
      pairId: rank,
      rank,
      suit,
      isHotPotatoPete: false
    };
  }

  public static createHotPotatoPete(): Card {
    const hotPotatoPete = CST.CARD_RULES.HOT_POTATO_PETE;

    return {
      id: hotPotatoPete.ID,
      pairId: hotPotatoPete.PAIR_ID,
      rank: hotPotatoPete.RANK,
      suit: hotPotatoPete.SUIT,
      isHotPotatoPete: true
    };
  }
}
