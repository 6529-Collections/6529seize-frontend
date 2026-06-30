import clsx from "clsx";
import {
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
  forwardRef,
} from "react";

type ColumnSpan = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
type BreakpointSize = boolean | "auto" | ColumnSpan;
type BreakpointPrefix = "base" | "sm" | "md" | "lg" | "xl" | "xxl";

interface ContainerProps extends ComponentPropsWithoutRef<"div"> {
  children?: ReactNode;
  fluid?: boolean;
}

interface RowProps extends ComponentPropsWithoutRef<"div"> {
  children?: ReactNode;
}

interface ColProps extends ComponentPropsWithoutRef<"div"> {
  children?: ReactNode;
  xs?: BreakpointSize;
  sm?: BreakpointSize;
  md?: BreakpointSize;
  lg?: BreakpointSize;
  xl?: BreakpointSize;
  xxl?: BreakpointSize;
}

interface TableProps extends ComponentPropsWithoutRef<"table"> {
  children?: ReactNode;
  bordered?: boolean;
}

const FLEX_COL_CLASSES: Record<BreakpointPrefix, string> = {
  base: "tw-basis-0 tw-grow tw-shrink-0",
  sm: "min-[576px]:tw-basis-0 min-[576px]:tw-grow min-[576px]:tw-shrink-0",
  md: "md:tw-basis-0 md:tw-grow md:tw-shrink-0",
  lg: "min-[992px]:tw-basis-0 min-[992px]:tw-grow min-[992px]:tw-shrink-0",
  xl: "min-[1200px]:tw-basis-0 min-[1200px]:tw-grow min-[1200px]:tw-shrink-0",
  xxl: "min-[1400px]:tw-basis-0 min-[1400px]:tw-grow min-[1400px]:tw-shrink-0",
};

const AUTO_COL_CLASSES: Record<BreakpointPrefix, string> = {
  base: "tw-w-auto tw-grow-0 tw-shrink-0",
  sm: "min-[576px]:tw-w-auto min-[576px]:tw-grow-0 min-[576px]:tw-shrink-0",
  md: "md:tw-w-auto md:tw-grow-0 md:tw-shrink-0",
  lg: "min-[992px]:tw-w-auto min-[992px]:tw-grow-0 min-[992px]:tw-shrink-0",
  xl: "min-[1200px]:tw-w-auto min-[1200px]:tw-grow-0 min-[1200px]:tw-shrink-0",
  xxl: "min-[1400px]:tw-w-auto min-[1400px]:tw-grow-0 min-[1400px]:tw-shrink-0",
};

const CONTAINER_CLASSES =
  "tw-mx-auto tw-px-3 min-[1000px]:tw-max-w-[850px] min-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-7xl";

const SIZE_COL_CLASSES: Record<BreakpointPrefix, Record<ColumnSpan, string>> = {
  base: {
    1: "tw-w-1/12",
    2: "tw-w-1/6",
    3: "tw-w-1/4",
    4: "tw-w-1/3",
    5: "tw-w-5/12",
    6: "tw-w-1/2",
    7: "tw-w-7/12",
    8: "tw-w-2/3",
    9: "tw-w-3/4",
    10: "tw-w-5/6",
    11: "tw-w-11/12",
    12: "tw-w-full",
  },
  sm: {
    1: "min-[576px]:tw-w-1/12",
    2: "min-[576px]:tw-w-1/6",
    3: "min-[576px]:tw-w-1/4",
    4: "min-[576px]:tw-w-1/3",
    5: "min-[576px]:tw-w-5/12",
    6: "min-[576px]:tw-w-1/2",
    7: "min-[576px]:tw-w-7/12",
    8: "min-[576px]:tw-w-2/3",
    9: "min-[576px]:tw-w-3/4",
    10: "min-[576px]:tw-w-5/6",
    11: "min-[576px]:tw-w-11/12",
    12: "min-[576px]:tw-w-full",
  },
  md: {
    1: "md:tw-w-1/12",
    2: "md:tw-w-1/6",
    3: "md:tw-w-1/4",
    4: "md:tw-w-1/3",
    5: "md:tw-w-5/12",
    6: "md:tw-w-1/2",
    7: "md:tw-w-7/12",
    8: "md:tw-w-2/3",
    9: "md:tw-w-3/4",
    10: "md:tw-w-5/6",
    11: "md:tw-w-11/12",
    12: "md:tw-w-full",
  },
  lg: {
    1: "min-[992px]:tw-w-1/12",
    2: "min-[992px]:tw-w-1/6",
    3: "min-[992px]:tw-w-1/4",
    4: "min-[992px]:tw-w-1/3",
    5: "min-[992px]:tw-w-5/12",
    6: "min-[992px]:tw-w-1/2",
    7: "min-[992px]:tw-w-7/12",
    8: "min-[992px]:tw-w-2/3",
    9: "min-[992px]:tw-w-3/4",
    10: "min-[992px]:tw-w-5/6",
    11: "min-[992px]:tw-w-11/12",
    12: "min-[992px]:tw-w-full",
  },
  xl: {
    1: "min-[1200px]:tw-w-1/12",
    2: "min-[1200px]:tw-w-1/6",
    3: "min-[1200px]:tw-w-1/4",
    4: "min-[1200px]:tw-w-1/3",
    5: "min-[1200px]:tw-w-5/12",
    6: "min-[1200px]:tw-w-1/2",
    7: "min-[1200px]:tw-w-7/12",
    8: "min-[1200px]:tw-w-2/3",
    9: "min-[1200px]:tw-w-3/4",
    10: "min-[1200px]:tw-w-5/6",
    11: "min-[1200px]:tw-w-11/12",
    12: "min-[1200px]:tw-w-full",
  },
  xxl: {
    1: "min-[1400px]:tw-w-1/12",
    2: "min-[1400px]:tw-w-1/6",
    3: "min-[1400px]:tw-w-1/4",
    4: "min-[1400px]:tw-w-1/3",
    5: "min-[1400px]:tw-w-5/12",
    6: "min-[1400px]:tw-w-1/2",
    7: "min-[1400px]:tw-w-7/12",
    8: "min-[1400px]:tw-w-2/3",
    9: "min-[1400px]:tw-w-3/4",
    10: "min-[1400px]:tw-w-5/6",
    11: "min-[1400px]:tw-w-11/12",
    12: "min-[1400px]:tw-w-full",
  },
};

const colSizeClass = (
  size: BreakpointSize | undefined,
  prefix: BreakpointPrefix = "base"
) => {
  if (size === undefined || size === false) {
    return undefined;
  }

  if (size === true) {
    return FLEX_COL_CLASSES[prefix];
  }

  if (size === "auto") {
    return AUTO_COL_CLASSES[prefix];
  }

  return typeof size === "number" ? SIZE_COL_CLASSES[prefix][size] : undefined;
};

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ children, className, fluid = false, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(
        "tw-w-full",
        fluid ? "tw-max-w-none" : CONTAINER_CLASSES,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

Container.displayName = "NextGenTailwindContainer";

export const Row = forwardRef<HTMLDivElement, RowProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx("tw-flex tw-flex-wrap -tw-mx-3", className)}
      {...props}
    >
      {children}
    </div>
  )
);

Row.displayName = "NextGenTailwindRow";

export const Col = forwardRef<HTMLDivElement, ColProps>(
  (
    { children, className, xs, sm, md, lg, xl, xxl, style, ...props },
    ref
  ) => {
    const hasSizedColumn =
      xs !== undefined ||
      sm !== undefined ||
      md !== undefined ||
      lg !== undefined ||
      xl !== undefined ||
      xxl !== undefined;
    const widthStyle = hasSizedColumn
      ? ({ maxWidth: "100%", ...style } satisfies CSSProperties)
      : style;

    return (
      <div
        ref={ref}
        className={clsx(
          "tw-relative tw-w-full tw-px-3",
          hasSizedColumn
            ? "tw-grow-0 tw-shrink-0"
            : FLEX_COL_CLASSES.base,
          colSizeClass(xs),
          colSizeClass(sm, "sm"),
          colSizeClass(md, "md"),
          colSizeClass(lg, "lg"),
          colSizeClass(xl, "xl"),
          colSizeClass(xxl, "xxl"),
          className
        )}
        style={widthStyle}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Col.displayName = "NextGenTailwindCol";

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ bordered, children, className, ...props }, ref) => (
    <table
      ref={ref}
      className={clsx(
        "tw-w-full tw-border-collapse",
        bordered &&
          "[&_td]:tw-border [&_td]:tw-border-solid [&_td]:tw-border-iron-700 [&_th]:tw-border [&_th]:tw-border-solid [&_th]:tw-border-iron-700",
        className
      )}
      {...props}
    >
      {children}
    </table>
  )
);

Table.displayName = "NextGenTailwindTable";
