import { motion } from "framer-motion";

export default function CreateWavesMainStepConnectionLine({
  done,
}: {
  readonly done: boolean;
}) {
  return (
    <div>
      <div
        className="tw-absolute tw-right-[11px] tw-top-9 tw-h-full tw-w-0.5 tw-rounded-sm tw-bg-iron-700"
        aria-hidden="true"
      ></div>
      <motion.div
        initial={false}
        animate={{ scaleY: done ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        className="tw-absolute tw-right-[11px] tw-top-9 tw-h-full tw-w-0.5 tw-rounded-sm tw-bg-primary-500"
        style={{
          originY: 0, // Animation origin at the top
          scaleY: 0, // Start scaled down to 0
        }}
        aria-hidden="true"
      ></motion.div>
    </div>
  );
}
