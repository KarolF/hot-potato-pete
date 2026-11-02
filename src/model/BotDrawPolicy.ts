import { Utils } from "../utils/Utils";
import { Card, GameSnapshot } from "./interfaces";

export class BotDrawPolicy {
  public static chooseBotCardIndex(hand: Card[], rngName: string, snapshot?: GameSnapshot): number {
    if (hand.length <= 0) return 0;

    const balance = snapshot?.hotPotatoPeteBalance;
    if (
      balance &&
      !balance.peterHasTakenHotPotatoPeteFromPlayer &&
      balance.peterForceHotPotatoPeteDrawOnTurn !== null &&
      balance.peterDrawCount + 1 === balance.peterForceHotPotatoPeteDrawOnTurn
    ) {
      const hotPotatoPeteIndex = hand.findIndex((card) => card.isHotPotatoPete);
      if (hotPotatoPeteIndex >= 0) {
        return hotPotatoPeteIndex;
      }
    }

    if (
      balance &&
      !balance.peterHasTakenHotPotatoPeteFromPlayer &&
      balance.peterForceHotPotatoPeteDrawOnTurn !== null &&
      balance.peterDrawCount + 1 < balance.peterForceHotPotatoPeteDrawOnTurn
    ) {
      const safeIndices = hand
        .map((card, index) => (card.isHotPotatoPete ? -1 : index))
        .filter((index) => index >= 0);
      if (safeIndices.length > 0) {
        return safeIndices[Utils.rangeRandom(0, safeIndices.length - 1, rngName)];
      }
    }

    return Utils.rangeRandom(0, hand.length - 1, rngName);
  }
}
