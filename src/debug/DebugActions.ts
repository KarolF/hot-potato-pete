import { CST } from "../CST";
import { GameStateModel } from "../model/GameStateModel";
import { GameSnapshot } from "../model/interfaces";
import { StatsModel } from "../model/StatsModel";
import { RunModel } from "../model/RunModel";
import { GameplayMediator } from "../mediators/GameplayMediator";
import type { GameplayScreen } from "../view/scenes/GameplayScreen";

export function forcePlayerWin(): GameSnapshot | null {
  const snapshot = GameStateModel.getInstance().getSnapshot();
  if (!snapshot || snapshot.phase === CST.GAME_PHASE.GAME_OVER) return null;

  snapshot.phase = CST.GAME_PHASE.GAME_OVER;
  snapshot.turn = "player";
  snapshot.winner = "player";
  snapshot.loser = "bot";
  snapshot.lastEvent = CST.STRINGS.YOU_WIN;

  if (!snapshot.firstGameplayTutorial) StatsModel.getInstance().recordWin();
  GameStateModel.getInstance().setSnapshot(snapshot);
  return snapshot;
}

export function winMatch(screen: GameplayScreen): GameSnapshot | null {
  if (!screen.isReadyForInput()) return null;
  const snapshot = forcePlayerWin();
  if (!snapshot) return null;
  if (!snapshot.firstGameplayTutorial) RunModel.getInstance().recordWin();
  const mediator = GameplayMediator.getInstance();
  mediator.destroy();
  mediator.init(screen);
  return snapshot;
}
