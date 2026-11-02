export type Suit = "clubs" | "diamonds" | "hearts" | "spades";
export type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";
export type PlayerId = "player" | "bot";
export type GamePhase = "ready" | "player_draw" | "bot_draw" | "game_over";
export type OpponentId = "peeky_pete" | "slim_mcsleeves" | "marked_martha";
export type OpponentDifficulty = "easy" | "normal" | "hard" | "superhard1" | "superhard2";
export type OpponentEyeStyle = "hold" | "blink" | "retina";
export type OpponentShuffleStyle = "peeky" | "sleeves" | "circle";

export interface Point {
  x: number;
  y: number;
}

export interface Card {
  id: string;
  pairId: string;
  rank: Rank | "HPP";
  suit: Suit | "hot-potato-pete";
  isHotPotatoPete: boolean;
}

export interface PlayerState {
  id: PlayerId;
  name: string;
  hand: Card[];
}

export interface PairDiscard {
  owner: PlayerId;
  pairId: string;
  cards: [Card, Card];
}

export interface PairRemovalResult {
  hand: Card[];
  pairs: PairDiscard[];
}

export interface CardDraw {
  card: Card;
  hand: Card[];
}

export interface IndexedCardDraw extends CardDraw {
  index: number;
}

export interface DrawPayload extends IndexedCardDraw {}

export interface OpponentFaceConfig {
  textureKey: string;
  sourceWidth?: number;
  sourceHeight?: number;
  leftEyeCenter?: Point;
  rightEyeCenter?: Point;
}

export interface OpponentState {
  id: OpponentId;
  name: string;
  difficulty: OpponentDifficulty;
  eyeStyle: OpponentEyeStyle;
  shuffleStyle: OpponentShuffleStyle;
  hintText: string;
  face: OpponentFaceConfig;
  matchNumber: number;
}

export interface GameSnapshot {
  seed: number;
  phase: GamePhase;
  players: Record<PlayerId, PlayerState>;
  discardPile: PairDiscard[];
  turn: PlayerId;
  winner: PlayerId | null;
  loser: PlayerId | null;
  lastEvent: string;
  opponent?: OpponentState;
  peterShuffle?: PeterShuffleProgress;
  shuffleBonusCardId?: string;
  hotPotatoPeteBalance?: HotPotatoPeteBalance;
  hotPotatoPeteTell?: HotPotatoPeteTellState;
  firstGameplayTutorial?: boolean;
}

export interface PeterShuffleProgress {
  count: number;
  lastStepCount: number;
  lastStepDurationMs: number;
  shuffleDurationMultiplier?: number;
}

export interface HotPotatoPeteBalance {
  playerStartedWithHotPotatoPete: boolean;
  peterHasTakenHotPotatoPeteFromPlayer: boolean;
  peterDrawCount: number;
  peterForceHotPotatoPeteDrawOnTurn: 1 | 2 | null;
}

export interface HotPotatoPeteTellState {
  botHotPotatoPetePlayerTurnCount: number;
}

export interface HandShuffle {
  owner: PlayerId;
  shuffleStyle: OpponentShuffleStyle;
  shuffleSequenceCount: number;
  shuffleNumber: number;
  stepCount: number;
  stepDurationMs: number;
  movedCardIds: string[];
  beforeCardIds: string[];
  afterCardIds: string[];
  steps: string[][];
  focusCardId?: string;
  bonusCardId?: string;
}

export interface DrawResult {
  snapshot: GameSnapshot;
  drawnCard: Card;
  removedPairs: PairDiscard[];
  gameOver: boolean;
  shuffle?: HandShuffle;
  bonusScore?: number;
}

export interface OpeningDeal {
  playerHand: Card[];
  botHand: Card[];
  discardPile: PairDiscard[];
}
