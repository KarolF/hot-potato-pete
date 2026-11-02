import { describe, expect, it } from "vitest";
import { OpponentModel } from "../model/OpponentModel";

describe("OpponentModel isolation", () => {
  it.each([1, 2, 3])("isolates the face configuration for opponent %i", (matchNumber) => {
    const first = OpponentModel.getForMatch(matchNumber);
    const expected = JSON.parse(JSON.stringify(first));
    first.face.textureKey = "changed";
    if (first.face.leftEyeCenter) first.face.leftEyeCenter.x = -999;
    if (first.face.rightEyeCenter) first.face.rightEyeCenter.y = -999;

    expect(OpponentModel.getForMatch(matchNumber)).toEqual(expected);
    const nextTier = OpponentModel.getForMatch(matchNumber + 3);
    expect(nextTier.face).toEqual(expected.face);
    expect(nextTier.difficulty).toBe("normal");
    expect(nextTier.matchNumber).toBe(matchNumber + 3);
  });
});
