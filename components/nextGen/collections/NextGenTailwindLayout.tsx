import clsx from "clsx";
import {
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
  forwardRef,
} from "react";

type BreakpointSize = boolean | "auto" | number;
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
}

const FLEX_COL_CLASSES: Record<BreakpointPrefix, string> = {
  base: "tw-basis-0 tw-flex-1",
  sm: "min-[576px]:tw-basis-0 min-[576px]:tw-flex-1",
  md: "md:tw-basis-0 md:tw-flex-1",
  lg: "min-[992px]:tw-basis-0 min-[992px]:tw-flex-1",
  xl: "xl:tw-basis-0 xl:tw-flex-1",
  xxl: "min-[1400px]:tw-basis-0 min-[1400px]:tw-flex-1",
};

const AUTO_COL_CLASSES: Record<BreakpointPrefix, string> = {
  base: "tw-w-auto tw-flex-none",
  sm: "min-[576px]:tw-w-auto min-[576px]:tw-flex-none",
  md: "md:tw-w-auto md:tw-flex-none",
  lg: "min-[992px]:tw-w-auto min-[992px]:tw-flex-none",
  xl: "xl:tw-w-auto xl:tw-flex-none",
  xxl: "min-[1400px]:tw-w-auto min-[1400px]:tw-flex-none",
};

const SIZE_COL_CLASSES: Record<BreakpointPrefix, Record<number, string>> = {
  base: {
    1: "tw-basis-1/12",
    2: "tw-basis-1/6",
    3: "tw-basis-1/4",
    4: "tw-basis-1/3",
    5: "tw-basis-5/12",
    6: "tw-basis-1/2",
    7: "tw-basis-7/12",
    8: "tw-basis-2/3",
    9: "tw-basis-3/4",
    10: "tw-basis-5/6",
    11: "tw-basis-11/12",
    12: "tw-basis-full",
  },
  sm: {
    1: "min-[576px]:tw-basis-1/12",
    2: "min-[576px]:tw-basis-1/6",
    3: "min-[576px]:tw-basis-1/4",
    4: "min-[576px]:tw-basis-1/3",
    5: "min-[576px]:tw-basis-5/12",
    6: "min-[576px]:tw-basis-1/2",
    7: "min-[576px]:tw-basis-7/12",
    8: "min-[576px]:tw-basis-2/3",
    9: "min-[576px]:tw-basis-3/4",
    10: "min-[576px]:tw-basis-5/6",
    11: "min-[576px]:tw-basis-11/12",
    12: "min-[576px]:tw-basis-full",
  },
  md: {
    1: "md:tw-basis-1/12",
    2: "md:tw-basis-1/6",
    3: "md:tw-basis-1/4",
    4: "md:tw-basis-1/3",
    5: "md:tw-basis-5/12",
    6: "md:tw-basis-1/2",
    7: "md:tw-basis-7/12",
    8: "md:tw-basis-2/3",
    9: "md:tw-basis-3/4",
    10: "md:tw-basis-5/6",
    11: "md:tw-basis-11/12",
    12: "md:tw-basis-full",
  },
  lg: {
    1: "min-[992px]:tw-basis-1/12",
    2: "min-[992px]:tw-basis-1/6",
    3: "min-[992px]:tw-basis-1/4",
    4: "min-[992px]:tw-basis-1/3",
    5: "min-[992px]:tw-basis-5/12",
    6: "min-[992px]:tw-basis-1/2",
    7: "min-[992px]:tw-basis-7/12",
    8: "min-[992px]:tw-basis-2/3",
    9: "min-[992px]:tw-basis-3/4",
    10: "min-[992px]:tw-basis-5/6",
    11: "min-[992px]:tw-basis-11/12",
    12: "min-[992px]:tw-basis-full",
  },
  xl: {
    1: "xl:tw-basis-1/12",
    2: "xl:tw-basis-1/6",
    3: "xl:tw-basis-1/4",
    4: "xl:tw-basis-1/3",
    5: "xl:tw-basis-5/12",
    6: "xl:tw-basis-1/2",
    7: "xl:tw-basis-7/12",
    8: "xl:tw-basis-2/3",
    9: "xl:tw-basis-3/4",
    10: "xl:tw-basis-5/6",
    11: "xl:tw-basis-11/12",
    12: "xl:tw-basis-full",
  },
  xxl: {
    1: "min-[1400px]:tw-basis-1/12",
    2: "min-[1400px]:tw-basis-1/6",
    3: "min-[1400px]:tw-basis-1/4",
    4: "min-[1400px]:tw-basis-1/3",
    5: "min-[1400px]:tw-basis-5/12",
    6: "min-[1400px]:tw-basis-1/2",
    7: "min-[1400px]:tw-basis-7/12",
    8: "min-[1400px]:tw-basis-2/3",
    9: "min-[1400px]:tw-basis-3/4",
    10: "min-[1400px]:tw-basis-5/6",
    11: "min-[1400px]:tw-basis-11/12",
    12: "min-[1400px]:tw-basis-full",
  },
};

const colSizeClass = (
  size: BreakpointSize | undefined,
  prefix: BreakpointPrefix = "base"
) => {
  if (size === undefined || size === true) {
    return FLEX_COL_CLASSES[prefix];
  }

  if (size === "auto") {
    return AUTO_COL_CLASSES[prefix];
  }

  return SIZE_COL_CLASSES[prefix][size];
};

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ children, className, fluid = false, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(
        "tw-w-full",
        fluid ? "tw-max-w-none" : "tw-mx-auto tw-max-w-[1280px] tw-px-3",
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
          hasSizedColumn ? "tw-flex-none tw-basis-full" : "tw-basis-0 tw-flex-1",
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
  ({ children, className, ...props }, ref) => (
    <table ref={ref} className={clsx("tw-w-full", className)} {...props}>
      {children}
    </table>
  )
);

Table.displayName = "NextGenTailwindTable";
