export class AnimationCancelledError extends Error {
  constructor() {
    super("Animation cancelled because its scene or sequence changed");
    this.name = "AnimationCancelledError";
  }
}
