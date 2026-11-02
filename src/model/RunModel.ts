import { CST } from "../CST";

export interface RunAward {
  amount: number;
  label: string;
}

export interface RunState {
  currentScore: number;
  bestScore: number;
  winStreak: number;
  matchNumber: number;
  runActive: boolean;
  lastAward: RunAward | null;
  isNewBest: boolean;
}

export class RunModel {
  public static readonly WIN_BONUS = 1000;
  public static readonly STREAK_BONUS = 250;
  public static readonly MARKED_CARD_BONUS = 250;

  private static instance: RunModel;

  private state: RunState = {
    currentScore: 0,
    bestScore: 0,
    winStreak: 0,
    matchNumber: 1,
    runActive: false,
    lastAward: null,
    isNewBest: false
  };

  private constructor() {
    this.loadBestScore();
  }

  public static getInstance(): RunModel {
    if (!RunModel.instance) {
      RunModel.instance = new RunModel();
    }
    return RunModel.instance;
  }

  public static resetForTests(): void {
    RunModel.instance = new RunModel();
  }

  public getState(): RunState {
    return {
      ...this.state,
      lastAward: this.state.lastAward ? { ...this.state.lastAward } : null
    };
  }

  public startNewRun(): RunState {
    this.state = {
      currentScore: 0,
      bestScore: this.state.bestScore,
      winStreak: 0,
      matchNumber: 1,
      runActive: true,
      lastAward: null,
      isNewBest: false
    };
    return this.getState();
  }

  public continueRun(): RunState {
    this.state.runActive = true;
    this.state.lastAward = null;
    this.state.isNewBest = false;
    return this.getState();
  }

  public endRun(): RunState {
    this.state.runActive = false;
    this.state.lastAward = null;
    this.updateBestScore();
    return this.getState();
  }

  public recordWin(): RunState {
    if (!this.state.runActive) {
      this.startNewRun();
    }

    const award = RunModel.WIN_BONUS + RunModel.STREAK_BONUS * this.state.winStreak;
    this.state.currentScore += award;
    this.state.winStreak += 1;
    this.state.matchNumber += 1;
    this.state.runActive = true;
    this.state.lastAward = {
      amount: award,
      label: this.state.winStreak > 1 ? "Win streak" : "Win"
    };
    this.updateBestScore();
    return this.getState();
  }

  public recordMarkedCardBonus(): RunState {
    if (!this.state.runActive) {
      this.startNewRun();
    }

    this.state.currentScore += RunModel.MARKED_CARD_BONUS;
    this.state.runActive = true;
    this.state.lastAward = {
      amount: RunModel.MARKED_CARD_BONUS,
      label: "Marked card"
    };
    this.updateBestScore();
    return this.getState();
  }

  public recordLoss(): RunState {
    this.state.runActive = false;
    this.state.winStreak = 0;
    this.state.lastAward = null;
    this.updateBestScore();
    return this.getState();
  }

  private updateBestScore(): void {
    if (this.state.currentScore > this.state.bestScore) {
      this.state.bestScore = this.state.currentScore;
      this.state.isNewBest = true;
      this.saveBestScore();
    } else {
      this.state.isNewBest = false;
    }
  }

  private saveBestScore(): void {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(CST.STORAGE.RUN_HIGHSCORE, String(this.state.bestScore));
      }
    } catch (error) {
      console.error("Failed to save run highscore", error);
    }
  }

  private loadBestScore(): void {
    try {
      if (typeof localStorage === "undefined") return;
      const raw = localStorage.getItem(CST.STORAGE.RUN_HIGHSCORE);
      const bestScore = raw ? Number(raw) : 0;
      this.state.bestScore = Number.isFinite(bestScore) ? Math.max(0, bestScore) : 0;
    } catch (error) {
      console.error("Failed to load run highscore", error);
    }
  }
}
