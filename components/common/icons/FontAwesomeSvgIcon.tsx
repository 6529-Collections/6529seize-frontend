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
 * Components in the root layout graph use it with per-icon imports
 * (`@fortawesome/free-solid-svg-icons/faPlus`) so the icon library stays out
 * of every page's startup bundle. It supports only the plain-icon case; use
 * `FontAwesomeIcon` for transforms, masks, layers or animation props.
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
      {paths.map((d) => (
        <path key={d} fill="currentColor" d={d} />
      ))}
    </svg>
  );
}
