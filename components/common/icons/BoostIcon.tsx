interface BoostIconProps {
  readonly className?: string;
  /**
   * - "filled": Solid flame (for boosted state)
   * - "outlined": Stroke-only flame (for non-boosted state)
   * - "animated": Filled flame with inner highlight (for animations)
   */
  readonly variant?: "filled" | "outlined" | "animated";
}

const BoostIcon = ({ className, variant = "filled" }: BoostIconProps) => {
  const isFilled = variant === "filled" || variant === "animated";

  return (
    <svg
      className={className}
      viewBox="0 2 24 24"
      fill={isFilled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={isFilled ? 0 : 1.5}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 23C16.1421 23 19.5 19.6421 19.5 15.5C19.5 14.1685 19.1755 12.9177 18.6062 11.8214C17.7863 13.0488 16.5 13.5 15.5 13C15.5 11 14.5 8 12 5.5C11 8 10.5 9.5 9 11C8.11281 11.8872 7.5 13.1287 7.5 14.5C7.5 15.5 8 17 9 18C8 17.5 7 16.5 6.5 15C5.83333 16 5 17.5 5 19C5 20.5 5.5 21.5 6.5 22.5C8 21 8.5 20 8.5 19C8.5 20.5 9.5 22 11 23H12Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {variant === "animated" && (
        <path
          d="M12 20C13.6569 20 15 18.6569 15 17C15 16.2316 14.7076 15.5308 14.2337 15C13.5 16 12.5 16.5 12 16.5C11.5 16.5 10.5 16 10 15C9.5 16 9 17 9 17.5C9 18.8807 10.1193 20 12 20Z"
          fill="rgba(255,255,255,0.3)"
        />
      )}
    </svg>
  );
};

export default BoostIcon;
