declare module "@mojs/core" {
  type NumericRecord = Record<number | string, number>;

  interface MojsAnimatable {
    tune?(options: Record<string, unknown>): this;
    replay?(progress?: number): this;
    stop?(): this;
  }

  interface BurstOptions {
    parent?: string | Element;
    radius?: number | NumericRecord;
    count?: number;
    angle?: number;
    duration?: number;
    delay?: number | string;
    children?: Record<string, unknown>;
    [key: string]: unknown;
  }

  interface HtmlOptions {
    el: string | Element;
    duration?: number;
    scale?: number | NumericRecord;
    easing?: unknown;
    isShowStart?: boolean;
    isShowEnd?: boolean;
    opacity?: number | NumericRecord;
    y?: number | NumericRecord;
    [key: string]: unknown;
  }

  export class Burst implements MojsAnimatable {
    constructor(options?: BurstOptions);
    tune(options: Record<string, unknown>): this;
    replay(): this;
    stop(): this;
  }

  export class Html implements MojsAnimatable {
    constructor(options?: HtmlOptions);
    then(options: Record<string, unknown>): this;
    tune(options: Record<string, unknown>): this;
    replay(): this;
    stop(): this;
  }

  export class Timeline {
    add(items: MojsAnimatable | MojsAnimatable[]): this;
    replay(): this;
    stop(): this;
  }

  export const easing: {
    bezier: (...args: number[]) => unknown;
    out: unknown;
    [key: string]: unknown;
  };

  export interface MojsStatic {
    Burst: typeof Burst;
    Html: typeof Html;
    Timeline: typeof Timeline;
    easing: typeof easing;
    [key: string]: unknown;
  }

  const mojs: MojsStatic;
  export default mojs;

  export type MojsTimelineInstance = Timeline;
  export type MojsBurstInstance = Burst;
  export type MojsHtmlInstance = Html;
}
