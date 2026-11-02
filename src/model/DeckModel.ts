import { CST } from "../CST";
import { CardFactory } from "./CardFactory";
import { Card } from "./interfaces";
import { Utils } from "../utils/Utils";

export class DeckModel {
  public static createDeck(): Card[] {
    const deck: Card[] = [];

    const ranks = CST.CARD_RULES.RANKS;
    const pairSuits = CST.CARD_RULES.PAIR_SUITS;

    for (let i = 0; i < ranks.length; i++) {
      const rank = ranks[i];
      const suitPair = pairSuits[i % pairSuits.length];
      deck.push(CardFactory.createCard(rank, suitPair[0]));
      deck.push(CardFactory.createCard(rank, suitPair[1]));
    }

    deck.push(CardFactory.createHotPotatoPete());
    return deck;
  }

  public static shuffle(deck: Card[], rng: () => number): Card[] {
    return Utils.shuffle(deck, rng);
  }

  public static deal(deck: Card[]): [Card[], Card[]] {
    const playerHand: Card[] = [];
    const botHand: Card[] = [];

    deck.forEach((card, index) => {
      if (index % 2 === 0) {
        playerHand.push(card);
      } else {
        botHand.push(card);
      }
    });

    return [playerHand, botHand];
  }
}
