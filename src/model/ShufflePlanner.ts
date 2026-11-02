import { CST } from "../CST";
import { Utils } from "../utils/Utils";
import { Card, GameSnapshot, HandShuffle, OpponentState, PeterShuffleProgress, PlayerId } from "./interfaces";
import { ShuffleTimingPlanner } from "./ShuffleTimingPlanner";

export class ShufflePlanner {
  public static resolvePostDrawShuffle(
    snapshot: GameSnapshot,
    opponent: OpponentState,
    drawer: PlayerId,
    drawnCardId: string,
    hand: Card[],
    rngName: string
  ): HandShuffle | undefined {
    if (drawer !== "bot" || hand.length < 2) return undefined;

    const handCardIds = hand.map((card) => card.id);
    const receivedIndex = handCardIds.indexOf(drawnCardId);
    const hotPotatoPete = hand.find((card) => card.isHotPotatoPete);
    const focusCardId = hotPotatoPete?.id ?? drawnCardId;
    const beforeCardIds = ShufflePlanner.createBeforeShuffleCardIds(
      handCardIds,
      receivedIndex,
      Boolean(hotPotatoPete),
      rngName
    );
    if (!beforeCardIds) return undefined;

    const progress = snapshot.peterShuffle ?? ShuffleTimingPlanner.createInitialPeterShuffleProgress();
    const shuffleNumber = progress.count + 1;
    const stepCount = ShufflePlanner.getPeterShuffleStepCount(progress, rngName);
    const stepDurationMs = ShuffleTimingPlanner.getStepDurationForOpponent(
      shuffleNumber,
      opponent,
      hand.length,
      progress.shuffleDurationMultiplier ??
        ShuffleTimingPlanner.getOpponentShuffleDurationMultiplier(opponent)
    );
    const steps = ShufflePlanner.createPeterShuffleSteps(beforeCardIds, focusCardId, stepCount, rngName);
    if (steps.length === 0) return undefined;
    const bonusCardId = ShufflePlanner.getLowestNonHotPotatoPeteCardId(hand);

    return ShufflePlanner.createHandShuffle(
      drawer,
      opponent,
      shuffleNumber,
      stepCount,
      stepDurationMs,
      focusCardId,
      beforeCardIds,
      steps,
      bonusCardId
    );
  }

  public static createPlayerShuffleOrder(cardIds: string[], rngName: string): string[] {
    const shuffledCardIds = Utils.shuffle(cardIds, () => Utils.random(rngName));
    if (!cardIds.every((cardId, index) => cardId === shuffledCardIds[index])) {
      return shuffledCardIds;
    }

    return ShufflePlanner.moveCardId(cardIds, 0, cardIds.length - 1);
  }

  public static getMovedCardIds(beforeCardIds: string[], steps: string[][]): string[] {
    const movedCardIds = new Set<string>();
    let previousCardIds = beforeCardIds;

    for (const stepCardIds of steps) {
      stepCardIds.forEach((cardId, index) => {
        if (previousCardIds[index] !== cardId) {
          movedCardIds.add(cardId);
        }
      });
      previousCardIds.forEach((cardId, index) => {
        if (stepCardIds[index] !== cardId) {
          movedCardIds.add(cardId);
        }
      });
      previousCardIds = stepCardIds;
    }

    return Array.from(movedCardIds);
  }

  public static reorderHandByIds(hand: Card[], cardIds: string[]): Card[] {
    const cardsById = new Map(hand.map((card) => [card.id, card]));
    return cardIds.map((cardId) => {
      const card = cardsById.get(cardId);
      if (!card) {
        throw new Error(`Cannot reorder missing card ${cardId}`);
      }
      return card;
    });
  }

  private static getShuffleSequenceCount(opponent: OpponentState): number {
    if (opponent.shuffleStyle !== "sleeves") return 1;
    if (opponent.difficulty === "normal") return 2;
    if (
      opponent.difficulty === "hard" ||
      opponent.difficulty === "superhard1" ||
      opponent.difficulty === "superhard2"
    ) {
      return 3;
    }
    return 1;
  }

  private static getPeterShuffleStepCount(progress: PeterShuffleProgress, rngName: string): number {
    if (progress.count > 0) {
      return progress.lastStepCount + CST.GAMEPLAY.PETER_SHUFFLE_STEP_INCREASE;
    }

    return Utils.rangeRandom(
      CST.GAMEPLAY.FIRST_PETER_SHUFFLE_MIN_STEPS,
      CST.GAMEPLAY.FIRST_PETER_SHUFFLE_MAX_STEPS,
      rngName
    );
  }

  private static createHandShuffle(
    owner: PlayerId,
    opponent: OpponentState,
    shuffleNumber: number,
    stepCount: number,
    stepDurationMs: number,
    focusCardId: string,
    beforeCardIds: string[],
    steps: string[][],
    bonusCardId?: string
  ): HandShuffle {
    const afterCardIds = steps[steps.length - 1];

    return {
      owner,
      shuffleStyle: opponent.shuffleStyle,
      shuffleSequenceCount: ShufflePlanner.getShuffleSequenceCount(opponent),
      shuffleNumber,
      stepCount,
      stepDurationMs,
      movedCardIds: ShufflePlanner.getMovedCardIds(beforeCardIds, steps),
      beforeCardIds,
      afterCardIds,
      steps,
      focusCardId,
      bonusCardId
    };
  }

  private static createBeforeShuffleCardIds(
    cardIds: string[],
    receivedIndex: number,
    hasHotPotatoPete: boolean,
    rngName: string
  ): string[] | undefined {
    if (receivedIndex < 0) return hasHotPotatoPete ? cardIds : undefined;

    const receiveIndex = ShufflePlanner.chooseDifferentIndex(cardIds.length, receivedIndex, rngName);
    return ShufflePlanner.moveCardId(cardIds, receivedIndex, receiveIndex);
  }

  private static createPeterShuffleSteps(
    cardIds: string[],
    drawnCardId: string,
    stepCount: number,
    rngName: string
  ): string[][] {
    const steps: string[][] = [];
    let currentCardIds = cardIds.slice();

    for (let stepIndex = 0; stepIndex < stepCount; stepIndex++) {
      const remainingSteps = stepCount - stepIndex;
      const unmovedCardIds = ShufflePlanner.getUnmovedCardIds(cardIds, steps);
      currentCardIds =
        steps.length > 0 && unmovedCardIds.length >= remainingSteps
          ? ShufflePlanner.createPeterShuffleCoverageStep(currentCardIds, unmovedCardIds[0], rngName)
          : ShufflePlanner.createPeterShuffleStep(
              currentCardIds,
              drawnCardId,
              stepIndex,
              rngName
            );
      steps.push(currentCardIds.slice());
    }

    return steps;
  }

  private static createPeterShuffleStep(
    cardIds: string[],
    drawnCardId: string,
    stepIndex: number,
    rngName: string
  ): string[] {
    if (cardIds.length < 2) return cardIds.slice();
    if (cardIds.length === 2) return [cardIds[1], cardIds[0]];

    const drawnIndex = cardIds.indexOf(drawnCardId);
    if (stepIndex === 0 && drawnIndex >= 0) {
      const targetIndex = ShufflePlanner.chooseDifferentIndex(cardIds.length, drawnIndex, rngName);
      return ShufflePlanner.moveCardId(cardIds, drawnIndex, targetIndex);
    }

    const maxSegmentLength = Math.min(5, cardIds.length);
    const segmentLength = Utils.rangeRandom(2, maxSegmentLength, rngName);
    const startIndex = Utils.rangeRandom(
      0,
      cardIds.length - segmentLength,
      rngName
    );
    const direction = Utils.rangeRandom(0, 1, rngName) === 0 ? -1 : 1;

    return ShufflePlanner.rotateSegment(cardIds, startIndex, segmentLength, direction);
  }

  private static chooseDifferentIndex(length: number, fromIndex: number, rngName: string): number {
    let targetIndex = Utils.rangeRandom(0, length - 1, rngName);
    if (targetIndex === fromIndex) {
      targetIndex = (targetIndex + Math.ceil(length / 2)) % length;
    }

    return targetIndex;
  }

  private static createPeterShuffleCoverageStep(
    cardIds: string[],
    cardId: string,
    rngName: string
  ): string[] {
    const fromIndex = cardIds.indexOf(cardId);
    if (fromIndex < 0) return cardIds.slice();

    const toIndex = ShufflePlanner.chooseDifferentIndex(cardIds.length, fromIndex, rngName);
    return ShufflePlanner.moveCardId(cardIds, fromIndex, toIndex);
  }

  private static moveCardId(cardIds: string[], fromIndex: number, toIndex: number): string[] {
    const nextCardIds = cardIds.slice();
    const [movedCardId] = nextCardIds.splice(fromIndex, 1);
    nextCardIds.splice(toIndex, 0, movedCardId);
    return nextCardIds;
  }

  private static rotateSegment(
    cardIds: string[],
    startIndex: number,
    segmentLength: number,
    direction: number
  ): string[] {
    const nextCardIds = cardIds.slice();
    const segment = nextCardIds.slice(startIndex, startIndex + segmentLength);

    if (direction > 0) {
      const movedCardId = segment.pop();
      if (!movedCardId) return nextCardIds;
      segment.unshift(movedCardId);
    } else {
      const movedCardId = segment.shift();
      if (!movedCardId) return nextCardIds;
      segment.push(movedCardId);
    }

    nextCardIds.splice(startIndex, segmentLength, ...segment);
    return nextCardIds;
  }

  private static getUnmovedCardIds(beforeCardIds: string[], steps: string[][]): string[] {
    const movedCardIds = new Set(ShufflePlanner.getMovedCardIds(beforeCardIds, steps));
    return beforeCardIds.slice().reverse().filter((cardId) => !movedCardIds.has(cardId));
  }

  private static getLowestNonHotPotatoPeteCardId(hand: Card[]): string | undefined {
    let lowestCard: Card | undefined;
    let lowestRankIndex = Number.POSITIVE_INFINITY;

    hand.forEach((card) => {
      if (card.isHotPotatoPete) return;

      const rankIndex = CST.CARD_RULES.RANKS.findIndex((rank) => rank === card.rank);
      if (rankIndex < 0 || rankIndex >= lowestRankIndex) return;

      lowestCard = card;
      lowestRankIndex = rankIndex;
    });

    return lowestCard?.id;
  }
}
