import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type { SVGProps } from "react";

type FontAwesomeSvgIconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  readonly icon: IconDefinition;
};

/**
 * Renders a Font Awesome icon definition as the inline SVG that
 * `FontAwesomeIcon` produces (`svg-inline--fa fa-<name>`, sized by the
 * global `@fortawesome/fontawesome-svg-core/styles.css`), without the
 * react-fontawesome and svg-core runtime.
 *
 * Components in the root layout graph use it so react-fontawesome stays out
 * of every page's startup bundle; `modularizeImports` in config/nextConfig.ts
 * already compiles their `free-solid-svg-icons` imports to single-icon
 * modules. It supports only the plain-icon case; use `FontAwesomeIcon` for
 * transforms, masks, layers or animation props.
 */
export default function FontAwesomeSvgIcon({
  icon,
  className,
  ...svgProps
}: FontAwesomeSvgIconProps) {
  const [width, height, , , pathData] = icon.icon;
  const paths = Array.isArray(pathData) ? pathData : [pathData];
  const classes = ["svg-inline--fa", `fa-${icon.iconName}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-prefix={icon.prefix}
      data-icon={icon.iconName}
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${width} ${height}`}
      {...svgProps}
      className={classes}
    >
      {paths.map((d, index) => (
        // An icon's paths are a fixed, ordered list, so the position is a
        // stable key; path data can repeat and is too long to key on.
        <path key={index} fill="currentColor" d={d} />
      ))}
    </svg>
  );
}
