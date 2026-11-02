import { CST } from "../CST";
import { OpponentId } from "./interfaces";

export interface Stats {
  tutorialSeen: boolean;
  wins: number;
  losses: number;
  gamesStarted: number;
  musicEnabled: boolean;
  soundEnabled: boolean;
  opponentHintsSeen: Partial<Record<OpponentId, boolean>>;
}

const BOOLEAN_FIELDS = ["tutorialSeen", "musicEnabled", "soundEnabled"] as const;
const COUNTER_FIELDS = ["wins", "losses", "gamesStarted"] as const;
const OPPONENT_IDS: OpponentId[] = ["peeky_pete", "slim_mcsleeves", "marked_martha"];

export class StatsModel {
  private static instance?: StatsModel;

  private stats: Stats = {
    tutorialSeen: false,
    wins: 0,
    losses: 0,
    gamesStarted: 0,
    musicEnabled: true,
    soundEnabled: true,
    opponentHintsSeen: {}
  };

  private constructor() {
    this.load();
  }

  public static getInstance(): StatsModel {
    if (!StatsModel.instance) {
      StatsModel.instance = new StatsModel();
    }
    return StatsModel.instance;
  }

  public getStats(): Stats {
    return {
      ...this.stats,
      opponentHintsSeen: { ...this.stats.opponentHintsSeen }
    };
  }

  public static resetForTests(): void {
    StatsModel.instance = undefined;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.stats.soundEnabled = enabled;
    this.save();
  }

  public setMusicEnabled(enabled: boolean): void {
    this.stats.musicEnabled = enabled;
    this.save();
  }

  public markTutorialSeen(): void {
    this.stats.tutorialSeen = true;
    this.save();
  }

  public hasSeenTutorial(): boolean {
    return this.stats.tutorialSeen;
  }

  public hasSeenOpponentHint(opponentId: OpponentId): boolean {
    return Boolean(this.stats.opponentHintsSeen[opponentId]);
  }

  public markOpponentHintSeen(opponentId: OpponentId): void {
    this.stats.opponentHintsSeen = {
      ...this.stats.opponentHintsSeen,
      [opponentId]: true
    };
    this.save();
  }

  public recordGameStarted(): void {
    this.stats.gamesStarted++;
    this.save();
  }

  public recordWin(): void {
    this.stats.wins++;
    this.save();
  }

  public recordLoss(): void {
    this.stats.losses++;
    this.save();
  }

  private save(): void {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(CST.STORAGE.STATS, JSON.stringify(this.stats));
      }
    } catch (error) {
      console.error("Failed to save stats", error);
    }
  }

  private load(): void {
    try {
      if (typeof localStorage === "undefined") return;
      const raw = localStorage.getItem(CST.STORAGE.STATS);
      if (!raw) return;
      this.restoreStats(JSON.parse(raw));
    } catch (error) {
      console.error("Failed to load stats", error);
    }
  }

  private restoreStats(value: unknown): void {
    if (!value || typeof value !== "object" || Array.isArray(value)) return;
    const saved = value as Record<string, unknown>;
    for (const key of BOOLEAN_FIELDS) {
      if (typeof saved[key] === "boolean") this.stats[key] = saved[key];
    }
    for (const key of COUNTER_FIELDS) {
      const counter = saved[key];
      if (typeof counter === "number" && Number.isSafeInteger(counter) && counter >= 0) {
        this.stats[key] = counter;
      }
    }
    const hints = saved.opponentHintsSeen;
    if (!hints || typeof hints !== "object" || Array.isArray(hints)) return;
    for (const id of OPPONENT_IDS) {
      const seen = (hints as Record<string, unknown>)[id];
      if (typeof seen === "boolean") this.stats.opponentHintsSeen[id] = seen;
    }
  }
}
