import { CST } from "../CST";
import { Utils } from "../utils/Utils";
import { HotPotatoPeteBalance } from "./interfaces";

export class HotPotatoPeteBalanceFactory {
  public static create(playerStartedWithHotPotatoPete: boolean, rngName: string): HotPotatoPeteBalance {
    return {
      playerStartedWithHotPotatoPete,
      peterHasTakenHotPotatoPeteFromPlayer: false,
      peterDrawCount: 0,
      peterForceHotPotatoPeteDrawOnTurn: playerStartedWithHotPotatoPete
        ? (Utils.rangeRandom(
            CST.GAMEPLAY.PETER_FORCE_HOT_POTATO_PETE_MIN_TURN,
            CST.GAMEPLAY.PETER_FORCE_HOT_POTATO_PETE_MAX_TURN,
            rngName
          ) as 1 | 2)
        : null
    };
  }
}
