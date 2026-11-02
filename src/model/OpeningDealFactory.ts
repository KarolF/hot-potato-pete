import { CST } from "../CST";
import { Utils } from "../utils/Utils";
import { Card, OpeningDeal, PairDiscard, Rank } from "./interfaces";
import { DeckModel } from "./DeckModel";
import { PlayerModel } from "./PlayerModel";

export interface OpeningDealOptions {
  firstGameplayTutorial?: boolean;
}

export class OpeningDealFactory {
  public static create(rngName: string, options: OpeningDealOptions = {}): OpeningDeal {
    if (options.firstGameplayTutorial) {
      return OpeningDealFactory.createFirstGameplayTutorialDeal();
    }

    for (let attempt = 0; attempt < CST.GAMEPLAY.OPENING_DEAL_MAX_ATTEMPTS; attempt++) {
      const deck = DeckModel.shuffle(DeckModel.createDeck(), () => Utils.random(rngName));
      const [playerHandRaw, botHandRaw] = DeckModel.deal(deck);
      const playerPairs = PlayerModel.removePairs("player", playerHandRaw);
      const botPairs = PlayerModel.removePairs("bot", botHandRaw);

      if (
        playerPairs.hand.length >= CST.GAMEPLAY.OPENING_DEAL_MIN_HAND_SIZE &&
        botPairs.hand.length >= CST.GAMEPLAY.OPENING_DEAL_MIN_HAND_SIZE
      ) {
        OpeningDealFactory.prepareOpeningHotPotatoPete(playerPairs.hand, botPairs.hand, rngName);
        return {
          playerHand: playerPairs.hand,
          botHand: botPairs.hand,
          discardPile: [...playerPairs.pairs, ...botPairs.pairs]
        };
      }
    }

    return OpeningDealFactory.createBalanced(rngName);
  }

  private static createBalanced(rngName: string): OpeningDeal {
    const deck = DeckModel.shuffle(DeckModel.createDeck(), () => Utils.random(rngName));
    const cardsByPairId = new Map<string, Card[]>();
    const playerHand: Card[] = [];
    const botHand: Card[] = [];
    let hotPotatoPete: Card | undefined;
    let pairIndex = 0;

    deck.forEach((card) => {
      if (card.isHotPotatoPete) {
        hotPotatoPete = card;
        return;
      }

      const cards = cardsByPairId.get(card.pairId) ?? [];
      cards.push(card);
      cardsByPairId.set(card.pairId, cards);
    });

    cardsByPairId.forEach((cards) => {
      if (cards.length < 2) return;
      if (pairIndex % 2 === 0) {
        playerHand.push(cards[0]);
        botHand.push(cards[1]);
      } else {
        playerHand.push(cards[1]);
        botHand.push(cards[0]);
      }
      pairIndex += 1;
    });

    if (hotPotatoPete) {
      if (playerHand.length <= botHand.length) {
        playerHand.push(hotPotatoPete);
      } else {
        botHand.push(hotPotatoPete);
      }
    }

    OpeningDealFactory.prepareOpeningHotPotatoPete(playerHand, botHand, rngName);
    return {
      playerHand,
      botHand,
      discardPile: []
    };
  }

  private static createFirstGameplayTutorialDeal(): OpeningDeal {
    const deck = DeckModel.createDeck();
    const activeRanks = new Set<Rank>(CST.CARD_RULES.RANKS.slice(0, 4));
    const hotPotatoPete = deck.find((card) => card.isHotPotatoPete);
    const cardsByPairId = new Map<string, Card[]>();
    const playerHand: Card[] = [];
    const botHand: Card[] = [];
    const discardPile: PairDiscard[] = [];

    deck.forEach((card) => {
      if (card.isHotPotatoPete) return;

      const cards = cardsByPairId.get(card.pairId) ?? [];
      cards.push(card);
      cardsByPairId.set(card.pairId, cards);
    });

    if (hotPotatoPete) {
      botHand.push(hotPotatoPete);
    }

    CST.CARD_RULES.RANKS.forEach((rank) => {
      const cards = cardsByPairId.get(rank);
      if (!cards || cards.length < 2) return;

      if (activeRanks.has(rank)) {
        botHand.push(cards[0]);
        playerHand.push(cards[1]);
        return;
      }

      discardPile.push({
        owner: "player",
        pairId: rank,
        cards: [cards[0], cards[1]]
      });
    });

    return {
      playerHand,
      botHand,
      discardPile
    };
  }

  private static prepareOpeningHotPotatoPete(
    playerHand: Card[],
    botHand: Card[],
    rngName: string
  ): void {
    if (playerHand.some((card) => card.isHotPotatoPete) || botHand.length < 2) return;
    const hotPotatoPeteIndex = botHand.findIndex((card) => card.isHotPotatoPete);
    if (hotPotatoPeteIndex < 0) return;

    const maxTargetIndex = Math.min(
      CST.GAMEPLAY.OPENING_HOT_POTATO_PETE_TARGET_MAX_INDEX,
      botHand.length - 1
    );
    const targetIndex = Utils.rangeRandom(0, maxTargetIndex, rngName);
    if (hotPotatoPeteIndex === targetIndex) return;

    const [hotPotatoPete] = botHand.splice(hotPotatoPeteIndex, 1);
    botHand.splice(targetIndex, 0, hotPotatoPete);
  }
}
