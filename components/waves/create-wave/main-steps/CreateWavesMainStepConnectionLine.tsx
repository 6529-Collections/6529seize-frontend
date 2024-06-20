import { motion } from "framer-motion";

export default function CreateWavesMainStepConnectionLine({
  done,
 }: {
  readonly done: boolean
}) {
  return (
    <div>
      <div
        className="tw-bg-iron-700 tw-absolute tw-right-3 tw-top-10 tw-h-full tw-rounded-sm tw-w-0.5"
        aria-hidden="true"
      ></div>
      <motion.div
        initial={false}
        animate={{ scaleY: done ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        className=" tw-bg-primary-500 tw-absolute tw-right-3 tw-top-10 tw-h-full tw-rounded-sm tw-w-0.5"
        style={{
          originY: 0, // Animation origin at the top
          scaleY: 0, // Start scaled down to 0
        }}
        aria-hidden="true"
      ></motion.div>
    </div>
  );
}