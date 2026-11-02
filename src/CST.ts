import type { OpponentDifficulty, Rank, Suit } from "./model/interfaces";

export const CST = {
  GAME: {
    WIDTH: 600,
    HEIGHT: 960
  },
  GAME_PHASE: {
    READY: "ready" as const,
    PLAYER_DRAW: "player_draw" as const,
    BOT_DRAW: "bot_draw" as const,
    GAME_OVER: "game_over" as const
  },
  CARD_RULES: {
    RANKS: [
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "J",
      "Q",
      "K"
    ] as Rank[],
    PAIR_SUITS: [
      ["hearts", "diamonds"],
      ["clubs", "spades"]
    ] as [Suit, Suit][],
    HOT_POTATO_PETE: {
      ID: "hot-potato-pete",
      PAIR_ID: "hot-potato-pete",
      RANK: "HPP" as const,
      SUIT: "hot-potato-pete" as const
    }
  },
  GAMEPLAY: {
    RNG_NAME: "hot-potato-pete",
    BOT_THINK_DELAY_MS: 900,
    FIRST_PETER_SHUFFLE_MIN_STEPS: 3,
    FIRST_PETER_SHUFFLE_MAX_STEPS: 8,
    PETER_SHUFFLE_STEP_INCREASE: 3,
    PETER_SHUFFLE_BASE_STEP_DURATION_MS: 250,
    PETER_SHUFFLE_SPEED_MULTIPLIER: 0.86,
    PETER_SHUFFLE_MIN_STEP_DURATION_MS: 90,
    PEEKY_TWO_CARD_SHUFFLE_DURATION_MULTIPLIER: 1.4,
    SLIM_TWO_CARD_SHUFFLE_DURATION_DIVISOR: 3,
    SHUFFLE_BONUS_STAR_DURATION_MS: 400,
    SHUFFLE_BONUS_STAR_COUNT: 8,
    SHUFFLE_BONUS_STAR_RADIUS: 16,
    SHUFFLE_BONUS_SCORE_STAR_DURATION_MS: 520,
    SHUFFLE_BONUS_SCORE_STAR_DELAY_MS: 35,
    SHUFFLE_BONUS_SCORE_STAR_SPREAD: 18,
    PLAYER_SHUFFLE_STEP_DURATION_MS: 220,
    FIRST_MATCH_SHUFFLE_DURATION_MULTIPLIER: 2,
    OPENING_DEAL_MIN_HAND_SIZE: 4,
    OPENING_DEAL_MAX_ATTEMPTS: 100,
    OPENING_HOT_POTATO_PETE_TARGET_MAX_INDEX: 1,
    PETER_FORCE_HOT_POTATO_PETE_MIN_TURN: 1,
    PETER_FORCE_HOT_POTATO_PETE_MAX_TURN: 2,
    NORMAL_PEEKY_OR_SLEEVES_DURATION_MULTIPLIER: 1.3,
    HARD_DURATION_MULTIPLIER: 1.2,
    SLIM_HARD_DURATION_MULTIPLIER: 1.25,
    FIRST_TUTORIAL_CUE_MS: 2000,
    FIRST_TUTORIAL_REPEATED_CUE_MS: 760,
    DIFFICULTY_STARS: {
      easy: 1,
      normal: 2,
      hard: 3,
      superhard1: 4,
      superhard2: 5
    } as Record<OpponentDifficulty, number>,
    MATCH_AWARD_PARTICLE_MULTIPLIER: 10,
    MATCH_AWARD_PARTICLE_SIZE_MULTIPLIER: 3,
    ADVANCED_SHUFFLE_DURATION_MULTIPLIERS: {
      easy: 1,
      normal: 2 / 3,
      hard: 0.56,
      superhard1: 0.48,
      superhard2: 0.42
    } as Record<OpponentDifficulty, number>
  },
  COLORS: {
    TABLE: 0x1f6f45,
    TABLE_DARK: 0x123823,
    FELT: 0x2f8a58,
    GOLD: 0xf4c95d,
    CREAM: 0xfff2d5,
    RED: 0xc73e3a,
    BLACK: 0x202328,
    BLUE: 0x2f65a7,
    PANEL: 0x244f3a,
    PANEL_DARK: 0x163326
  },
  FONT: {
    MAIN: "Trebuchet MS, Arial, sans-serif",
    CARD: "Georgia, Times New Roman, serif"
  },
  ASSETS: {
    PACK: "asset-pack",
    BACKGROUND: "background",
    COVER_ILLUSTRATION_HOT_POTATO_PETE: "cover-illustration-hot-potato-pete",
    COVER_ILLUSTRATION_QUEEN: "cover_illustration_queen",
    BUTTON_PLAY: "button_play",
    HTP_ARROW: "htp_arrow",
    HTP_OK: "htp_ok",
    HTP_NO: "htp_no",
    BUTTON_MENU_1: "button_menu1",
    BUTTON_NEXT: "button_next",
    GAME_WIN_MODAL: "game_win_modal",
    PROGRESS_BAR: "progress_bar",
    PLAYER_PROGRESS_BAR: "player_progress_bar",
    OPPONENT_PROGRESS_BAR: [
      "opponent_progress_bar1",
      "opponent_progress_bar2",
      "opponent_progress_bar3"
    ],
    PETER_FACE_2: "peter_face_2",
    OPPONENT_FACE_B: "opponent_face_b",
    OPPONENT_FACE_C: "opponent_face_c",
    EYE: "eye",
    SUNGLASSES: "sunglasses",
    CARDS: {
      BACK: "card_back",
      HOT_POTATO_PETE: "card-hot-potato-pete",
      RANKS: {
        "2": "card_2",
        "3": "card_3",
        "4": "card_4",
        "5": "card_5",
        "6": "card_6",
        "7": "card_7",
        "8": "card_8",
        "9": "card_9",
        "10": "card_10",
        J: "card_j",
        Q: "card_q",
        K: "card_k"
      }
    }
  },
  AUDIO: {
    SND_CARD_FLIP: "SND_CARD_CLICK",
    SND_CARD_CLICK: "SND_CARD_CLICK",
    SND_CARD_DRAW: "SND_CARD_PASS",
    SND_CARD_PASS: "SND_CARD_PASS",
    SND_PAIR_MATCH: "SND_PAIR_FOUND",
    SND_HOT_POTATO_PETE: "SND_HOT_POTATO_PETE",
    SND_WIN: "SND_MATCH_WIN",
    SND_LOSE: "SND_MATCH_LOSE",
    MUSIC_BGM: "MUSIC_BGM"
  },
  STORAGE: {
    STATS: "hot-potato-pete-stats",
    RUN_HIGHSCORE: "hot-potato-pete-run-highscore"
  },
  STRINGS: {
    TITLE: "HOT POTATO PETE",
    PLAY: "PLAY",
    PLAY_AGAIN: "PLAY AGAIN",
    NEXT_MATCH: "NEXT MATCH",
    NEW_RUN: "NEW RUN",
    END_RUN: "END RUN",
    MAIN: "MAIN",
    MENU: "MENU",
    SETTINGS: "SETTINGS",
    HOW_TO_PLAY: "HOW TO PLAY",
    CLOSE: "CLOSE",
    SOUND_ON: "SOUND: ON",
    SOUND_OFF: "SOUND: OFF",
    MUSIC_ON: "MUSIC: ON",
    MUSIC_OFF: "MUSIC: OFF",
    ARE_YOU_SURE: "ARE YOU SURE?",
    ABANDON_RUN_CONFIRM: "Abandon this run and return to main?",
    YES: "YES",
    CANCEL: "CANCEL",
    OPPONENT_HINT: "OPPONENT HINT",
    PLAYER: "You",
    BOT: "Peter",
    YOUR_TURN: "Choose one of Peter's cards",
    BOT_TURN: "Peter is drawing",
    PAIR_REMOVED: "Pair removed",
    YOU_WIN: "You win",
    YOU_LOSE: "You lose",
    MATCH_WON: "Match won",
    RUN_OVER: "Run over",
    SCORE: "Score",
    BEST: "Best",
    STREAK: "Streak",
    FINAL_SCORE: "Final score",
    NEW_BEST: "NEW BEST",
    HOT_POTATO_PETE_LEFT: "Hot Potato Pete was left behind",
    PAIRS: "Pairs",
    HOW_TO_PLAY_BODY:
      "Draw one hidden card from the opponent. Matching pairs leave your hand automatically. The player left holding Hot Potato Pete loses.",
    HINT_PEEKY_PETE: "I look on Hot Potato Pete card little longer",
    HINT_SLIM_MCSLEEVES: "I blink, when I see Hot Potato Pete card",
    HINT_MARKED_MARTHA: "My eyes goes bigger, when I see Hot Potato Pete card",
    TUTORIAL_CLICK_THAT_CARD: "click that card",
    YOU_DREW_CARD: "You drew a card.",
    DREW_CARD: "drew a card."
  }
};
