import { CST } from "../CST";
import { OpponentDifficulty, OpponentState } from "./interfaces";

const OPPONENTS: Omit<OpponentState, "difficulty" | "matchNumber">[] = [
  {
    id: "marked_martha",
    name: "Marked Martha",
    eyeStyle: "retina",
    shuffleStyle: "circle",
    hintText: CST.STRINGS.HINT_MARKED_MARTHA,
    face: {
      textureKey: CST.ASSETS.OPPONENT_FACE_B,
      sourceWidth: 535,
      sourceHeight: 401,
      leftEyeCenter: { x: 174, y: 177 },
      rightEyeCenter: { x: 357, y: 177 }
    }
  },
  {
    id: "slim_mcsleeves",
    name: "Slim McSleeves",
    eyeStyle: "blink",
    shuffleStyle: "sleeves",
    hintText: CST.STRINGS.HINT_SLIM_MCSLEEVES,
    face: {
      textureKey: CST.ASSETS.OPPONENT_FACE_C,
      sourceWidth: 535,
      sourceHeight: 401,
      leftEyeCenter: { x: 200, y: 228 },
      rightEyeCenter: { x: 338, y: 228 }
    }
  },
  {
    id: "peeky_pete",
    name: "Peeky Pete",
    eyeStyle: "hold",
    shuffleStyle: "peeky",
    hintText: CST.STRINGS.HINT_PEEKY_PETE,
    face: {
      textureKey: CST.ASSETS.PETER_FACE_2
    }
  }
];

export class OpponentModel {
  private static readonly difficulties: OpponentDifficulty[] = [
    "easy",
    "normal",
    "hard",
    "superhard1",
    "superhard2"
  ];

  public static getForMatch(matchNumber: number): OpponentState {
    const safeMatchNumber = Math.max(1, Math.floor(matchNumber));
    const opponent = OPPONENTS[(safeMatchNumber - 1) % OPPONENTS.length];

    return {
      ...opponent,
      face: {
        ...opponent.face,
        ...(opponent.face.leftEyeCenter
          ? { leftEyeCenter: { ...opponent.face.leftEyeCenter } } : {}),
        ...(opponent.face.rightEyeCenter
          ? { rightEyeCenter: { ...opponent.face.rightEyeCenter } } : {})
      },
      difficulty: OpponentModel.getDifficulty(safeMatchNumber),
      matchNumber: safeMatchNumber
    };
  }

  private static getDifficulty(matchNumber: number): OpponentDifficulty {
    const tier = Math.floor((matchNumber - 1) / OPPONENTS.length);
    return OpponentModel.difficulties[
      Math.min(tier, OpponentModel.difficulties.length - 1)
    ];
  }
}
