/**
 * The mock's simulated clock, in Unix seconds. It starts at a fixed instant so
 * every scenario is deterministic, runs at a chosen speed against the wall
 * clock, and can be paused or advanced. Tests drive it with `advance` only.
 */
export class SimClock {
  private simulatedAt: number;
  private wallAt: number;
  private speed = 1;
  private paused = false;

  constructor(
    private readonly start: number,
    private readonly wallNow: () => number = () => Date.now()
  ) {
    this.simulatedAt = start;
    this.wallAt = wallNow();
  }

  /** The simulated time in whole seconds. */
  now(): number {
    if (this.paused) {
      return Math.floor(this.simulatedAt);
    }
    const elapsed = (this.wallNow() - this.wallAt) / 1_000;
    return Math.floor(this.simulatedAt + elapsed * this.speed);
  }

  getSpeed(): number {
    return this.speed;
  }

  isPaused(): boolean {
    return this.paused;
  }

  private rebase(): void {
    this.simulatedAt = this.now();
    this.wallAt = this.wallNow();
  }

  setSpeed(multiplier: number): void {
    if (!Number.isFinite(multiplier) || multiplier <= 0) {
      throw new RangeError("clock speed must be positive");
    }
    this.rebase();
    this.speed = multiplier;
  }

  setPaused(paused: boolean): void {
    this.rebase();
    this.paused = paused;
  }

  advance(seconds: number): void {
    if (!Number.isFinite(seconds) || seconds < 0) {
      throw new RangeError("the clock only moves forward");
    }
    this.rebase();
    this.simulatedAt += seconds;
  }

  reset(): void {
    this.simulatedAt = this.start;
    this.wallAt = this.wallNow();
    this.speed = 1;
    this.paused = false;
  }
}
