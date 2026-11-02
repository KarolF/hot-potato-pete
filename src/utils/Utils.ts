export type RandomNumberGenerator = (min: number, max: number) => number;

interface SeedState {
  mW: number;
  mZ: number;
}

export class Utils {
  private static states: Map<string, SeedState> = new Map();

  public static seed(seed: number, name: string = "default"): void {
    const normalized = Math.max(1, Math.floor(seed));
    Utils.states.set(name, {
      mW: (123456789 + normalized) & 0xffffffff,
      mZ: (987654321 - normalized) & 0xffffffff
    });
  }

  public static random(name: string = "default"): number {
    let state = Utils.states.get(name);
    if (!state) {
      Utils.seed(Date.now(), name);
      state = Utils.states.get(name)!;
    }

    state.mZ = (36969 * (state.mZ & 65535) + (state.mZ >>> 16)) & 0xffffffff;
    state.mW = (18000 * (state.mW & 65535) + (state.mW >>> 16)) & 0xffffffff;

    let result = ((state.mZ << 16) + (state.mW & 65535)) >>> 0;
    result /= 4294967296;
    return result;
  }

  public static rangeRandom(min: number, max: number, name: string = "default"): number {
    return Math.floor(Utils.random(name) * (max - min + 1)) + min;
  }

  public static shuffle<T>(items: T[], rng: () => number): T[] {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const item = result[i];
      result[i] = result[j];
      result[j] = item;
    }
    return result;
  }
}
