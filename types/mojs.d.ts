declare module "@mojs/core" {
  export type MojsOptions = Record<string, unknown>;

  export interface MojsAnimation {
    replay: () => void;
    tune: (options: MojsOptions) => MojsAnimation;
    then: (options: MojsOptions) => MojsAnimation;
  }

  export interface MojsTimeline extends MojsAnimation {
    add: (animations: readonly MojsAnimation[]) => MojsTimeline;
  }

  export interface MojsEasing {
    readonly out: unknown;
    bezier: (
      startControlX: number,
      startControlY: number,
      endControlX: number,
      endControlY: number
    ) => unknown;
  }

  export interface Mojs {
    readonly Burst: new (options: MojsOptions) => MojsAnimation;
    readonly Html: new (options: MojsOptions) => MojsAnimation;
    readonly Timeline: new (options?: MojsOptions) => MojsTimeline;
    readonly easing: MojsEasing;
  }

  const mojs: Mojs;
  export default mojs;
}
