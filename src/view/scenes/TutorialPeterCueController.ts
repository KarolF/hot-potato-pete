import { CST } from "../../CST";
import type { CardScanTarget } from "../components/HandView";
import type { GameplayScreen } from "./GameplayScreen";

export class TutorialPeterCueController {
  private timer?: Phaser.Time.TimerEvent;

  constructor(private readonly screen: GameplayScreen) {}

  public start(target: CardScanTarget): void {
    this.stop();
    const cue = () => {
      this.screen.peterFace.focusOn({
        ...target,
        showHotPotatoPeteTell: true
      });
    };
    cue();
    this.timer = this.screen.time.addEvent({
      delay: CST.GAMEPLAY.FIRST_TUTORIAL_REPEATED_CUE_MS,
      loop: true,
      callback: cue
    });
  }

  public stop(): void {
    this.timer?.remove(false);
    this.timer = undefined;
  }
}
