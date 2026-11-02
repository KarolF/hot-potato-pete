import { GameSnapshot } from "./interfaces";

export class GameStateModel {
  private static instance: GameStateModel;
  private snapshot: GameSnapshot | null = null;

  private constructor() {}

  public static getInstance(): GameStateModel {
    if (!GameStateModel.instance) {
      GameStateModel.instance = new GameStateModel();
    }
    return GameStateModel.instance;
  }

  public setSnapshot(snapshot: GameSnapshot): void {
    this.snapshot = GameStateModel.cloneSnapshot(snapshot);
  }

  public getSnapshot(): GameSnapshot | null {
    if (!this.snapshot) return null;
    return GameStateModel.cloneSnapshot(this.snapshot);
  }

  public requireSnapshot(): GameSnapshot {
    const snapshot = this.getSnapshot();
    if (!snapshot) {
      throw new Error("Game has not been initialized");
    }
    return snapshot;
  }

  private static cloneSnapshot(snapshot: GameSnapshot): GameSnapshot {
    return {
      ...snapshot,
      players: {
        player: {
          ...snapshot.players.player,
          hand: snapshot.players.player.hand.map((card) => ({ ...card }))
        },
        bot: {
          ...snapshot.players.bot,
          hand: snapshot.players.bot.hand.map((card) => ({ ...card }))
        }
      },
      discardPile: snapshot.discardPile.map((pair) => ({
        ...pair,
        cards: [{ ...pair.cards[0] }, { ...pair.cards[1] }]
      })),
      opponent: snapshot.opponent
        ? {
            ...snapshot.opponent,
            face: {
              ...snapshot.opponent.face,
              leftEyeCenter: snapshot.opponent.face.leftEyeCenter
                ? { ...snapshot.opponent.face.leftEyeCenter }
                : undefined,
              rightEyeCenter: snapshot.opponent.face.rightEyeCenter
                ? { ...snapshot.opponent.face.rightEyeCenter }
                : undefined
            }
          }
        : undefined,
      peterShuffle: snapshot.peterShuffle ? { ...snapshot.peterShuffle } : undefined,
      shuffleBonusCardId: snapshot.shuffleBonusCardId,
      hotPotatoPeteBalance: snapshot.hotPotatoPeteBalance ? { ...snapshot.hotPotatoPeteBalance } : undefined,
      hotPotatoPeteTell: snapshot.hotPotatoPeteTell ? { ...snapshot.hotPotatoPeteTell } : undefined,
      firstGameplayTutorial: snapshot.firstGameplayTutorial
    };
  }
}
