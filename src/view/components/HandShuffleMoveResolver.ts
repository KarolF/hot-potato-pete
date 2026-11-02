interface MoveCandidate {
  cardId: string;
  fromIndex: number;
  toIndex: number;
}

export class HandShuffleMoveResolver {
  public static findMovedCardId(
    previousCardIds: string[],
    nextCardIds: string[],
    focusCardId?: string
  ): string | undefined {
    const candidates = HandShuffleMoveResolver.getMoveCandidates(previousCardIds, nextCardIds);
    if (candidates.length > 0) {
      return (
        candidates.find((candidate) => candidate.cardId === focusCardId)?.cardId ??
        candidates[0].cardId
      );
    }

    return HandShuffleMoveResolver.getFallbackMovedCardId(previousCardIds, nextCardIds, focusCardId);
  }

  private static getMoveCandidates(
    previousCardIds: string[],
    nextCardIds: string[]
  ): MoveCandidate[] {
    if (previousCardIds.length !== nextCardIds.length) return [];

    const candidates: MoveCandidate[] = [];
    for (let fromIndex = 0; fromIndex < previousCardIds.length; fromIndex++) {
      for (let toIndex = 0; toIndex < previousCardIds.length; toIndex++) {
        if (fromIndex === toIndex) continue;
        if (HandShuffleMoveResolver.matchesMove(previousCardIds, nextCardIds, fromIndex, toIndex)) {
          candidates.push({
            cardId: previousCardIds[fromIndex],
            fromIndex,
            toIndex
          });
        }
      }
    }

    return candidates;
  }

  private static matchesMove(
    previousCardIds: string[],
    nextCardIds: string[],
    fromIndex: number,
    toIndex: number
  ): boolean {
    const movedCardIds = previousCardIds.slice();
    const [movedCardId] = movedCardIds.splice(fromIndex, 1);
    movedCardIds.splice(toIndex, 0, movedCardId);
    return movedCardIds.every((cardId, index) => cardId === nextCardIds[index]);
  }

  private static getFallbackMovedCardId(
    previousCardIds: string[],
    nextCardIds: string[],
    focusCardId?: string
  ): string | undefined {
    const changedCardIds = nextCardIds.filter(
      (cardId, index) => previousCardIds[index] !== cardId
    );
    return changedCardIds.find((cardId) => cardId === focusCardId) ?? changedCardIds[0];
  }
}
