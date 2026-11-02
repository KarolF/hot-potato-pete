import { CST } from "../../CST";
import { GameSnapshot } from "../../model/interfaces";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { CustomButton } from "../components/CustomButton";
import { DiscardPile } from "../components/DiscardPile";
import { HandView } from "../components/HandView";
import { HowToPlayModal } from "../components/HowToPlayModal";
import { GameplayTutorialOverlay } from "../components/GameplayTutorialOverlay";
import { MatchResultModal } from "../components/MatchResultModal";
import { OpponentHintOverlay } from "../components/OpponentHintOverlay";
import { PeterFaceView } from "../components/PeterFaceView";
import { SettingsModal } from "../components/SettingsModal";
import { TurnBanner } from "../components/TurnBanner";
import type { GameplayScreen } from "./GameplayScreen";

export interface GameplayScreenLayout {
  botHandRestY: number;
  playerHandRestY: number;
  opponentFaceRestY: number;
  pairPanelRestY: number;
}

export interface GameplayScreenParts {
  peterFace: PeterFaceView;
  peterFaceScaleX: number;
  peterFaceScaleY: number;
  turnBanner: TurnBanner;
  discardPile: DiscardPile;
  scoreHud: Phaser.GameObjects.Container;
  scoreHudPanel: Phaser.GameObjects.Graphics;
  scoreHudText: Phaser.GameObjects.Text;
  gameplayButtons: CustomButton[];
  botHand: HandView;
  playerHand: HandView;
  settingsModal: SettingsModal;
  confirmationModal: ConfirmationModal;
  howToPlayModal: HowToPlayModal;
  opponentHintOverlay: OpponentHintOverlay;
  gameplayTutorialOverlay: GameplayTutorialOverlay;
}

interface ScoreHudParts {
  container: Phaser.GameObjects.Container;
  panel: Phaser.GameObjects.Graphics;
  text: Phaser.GameObjects.Text;
}

export class GameplayScreenFactory {
  public static create(screen: GameplayScreen): GameplayScreenParts {
    GameplayScreenFactory.createBackground(screen);
    const hud = GameplayScreenFactory.createHud(screen);
    const hands = GameplayScreenFactory.createHands(screen);
    const modals = GameplayScreenFactory.createModals(screen);

    return {
      ...hud,
      ...hands,
      ...modals
    };
  }

  public static createGameOverModal(
    screen: GameplayScreen,
    snapshot: GameSnapshot
  ): MatchResultModal {
    return new MatchResultModal(screen, snapshot, screen.runState, {
      onMenu: () => screen.requestTransitionToMenu(),
      onNextMatch: () => screen.playNextMatch()
    });
  }

  private static createBackground(screen: GameplayScreen): void {
    const bg = new Phaser.GameObjects.Image(screen, 0, 0, CST.ASSETS.BACKGROUND);
    bg.setDisplaySize(CST.GAME.WIDTH, CST.GAME.HEIGHT);
    screen.m_layer_cover00.add(bg);
  }

  private static createHud(
    screen: GameplayScreen
  ): Pick<
    GameplayScreenParts,
    | "peterFace"
    | "peterFaceScaleX"
    | "peterFaceScaleY"
    | "turnBanner"
    | "discardPile"
    | "scoreHud"
    | "scoreHudPanel"
    | "scoreHudText"
    | "gameplayButtons"
  > {
    const layout = screen.screenLayout;
    const peterFace = new PeterFaceView(screen, 0, layout.opponentFaceRestY);
    const peterFaceScaleX = peterFace.scaleX;
    const peterFaceScaleY = peterFace.scaleY;
    peterFace.setAlpha(0);
    peterFace.setScale(peterFaceScaleX * 0.82, peterFaceScaleY * 0.82);

    const turnBanner = new TurnBanner(screen, 0, -57);
    const discardPile = new DiscardPile(screen, 0, layout.pairPanelRestY);
    const scoreHud = GameplayScreenFactory.createScoreHud(screen);
    const gameplayButtons = GameplayScreenFactory.createButtons(screen);
    [turnBanner, discardPile, scoreHud.container].forEach((item) => item.setAlpha(0));

    screen.m_layer_cover22.add([
      peterFace,
      scoreHud.container,
      turnBanner,
      discardPile,
      ...gameplayButtons
    ]);

    return {
      peterFace,
      peterFaceScaleX,
      peterFaceScaleY,
      turnBanner,
      discardPile,
      scoreHud: scoreHud.container,
      scoreHudPanel: scoreHud.panel,
      scoreHudText: scoreHud.text,
      gameplayButtons
    };
  }

  private static createHands(
    screen: GameplayScreen
  ): Pick<GameplayScreenParts, "botHand" | "playerHand"> {
    const layout = screen.screenLayout;
    const botHand = new HandView(screen, 0, layout.botHandRestY, "opponent");
    const playerHand = new HandView(screen, 0, layout.playerHandRestY, "player");
    botHand.setAlpha(0);
    botHand.y -= 18;
    playerHand.setAlpha(0);
    playerHand.y += 22;
    screen.m_layer_cover22.add([botHand, playerHand]);
    return { botHand, playerHand };
  }

  private static createModals(
    screen: GameplayScreen
  ): Pick<
    GameplayScreenParts,
    | "settingsModal"
    | "confirmationModal"
    | "howToPlayModal"
    | "opponentHintOverlay"
    | "gameplayTutorialOverlay"
  > {
    const settingsModal = new SettingsModal(screen, 0, 0, {
      onHide: () => screen.handleGameplayModalClosed(),
      onMain: () => screen.requestTransitionToMenu()
    });
    const howToPlayModal = new HowToPlayModal(screen, 0, 0, () =>
      screen.handleGameplayModalClosed()
    );
    const opponentHintOverlay = new OpponentHintOverlay(screen, 0, 0, () =>
      screen.handleOpponentHintClosed()
    );
    const gameplayTutorialOverlay = new GameplayTutorialOverlay(screen, 0, 0);
    const confirmationModal = new ConfirmationModal(screen, 0, 0);
    screen.m_layer_cover22Top.add([
      gameplayTutorialOverlay,
      settingsModal,
      howToPlayModal,
      opponentHintOverlay,
      confirmationModal
    ]);
    return {
      settingsModal,
      confirmationModal,
      howToPlayModal,
      opponentHintOverlay,
      gameplayTutorialOverlay
    };
  }

  private static createScoreHud(screen: GameplayScreen): ScoreHudParts {
    const container = new Phaser.GameObjects.Container(screen, -274, -438);
    const panel = new Phaser.GameObjects.Graphics(screen);
    const text = new Phaser.GameObjects.Text(screen, 0, 0, "", {
      fontFamily: CST.FONT.MAIN,
      fontSize: "21px",
      color: "#fff2d5",
      align: "left"
    }).setOrigin(0, 0.5);
    container.add([panel, text]);
    return { container, panel, text };
  }

  private static createButtons(screen: GameplayScreen): CustomButton[] {
    const settingsButton = new CustomButton(
      screen,
      218,
      -438,
      "||",
      () => screen.showSettingsModal(),
      48,
      48,
      CST.COLORS.BLUE
    );
    const howButton = new CustomButton(
      screen,
      272,
      -438,
      "?",
      () => screen.showHowToPlay(),
      48,
      48,
      CST.COLORS.BLUE
    );
    const gameplayButtons = [settingsButton, howButton];
    gameplayButtons.forEach((button) => {
      button.setAlpha(0);
      button.y += 22;
      button.setActive(false);
    });
    return gameplayButtons;
  }
}
