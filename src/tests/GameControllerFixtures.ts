import { CST } from "../CST";
import { GameStateModel } from "../model/GameStateModel";
import { GameSnapshot } from "../model/interfaces";
import { Utils } from "../utils/Utils";

export function setSnapshot(snapshot: GameSnapshot): void {
  Utils.seed(snapshot.seed, CST.GAMEPLAY.RNG_NAME);
  GameStateModel.getInstance().setSnapshot(snapshot);
}
