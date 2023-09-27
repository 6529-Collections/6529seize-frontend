import { motion } from "framer-motion";

export default function DistributionPlanTableRowWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {children}
    </motion.tr>
  );
}
