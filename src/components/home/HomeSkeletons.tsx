import { motion } from "framer-motion";
import { shimmerVariants } from "../../constants/animations";

export const HomeHeaderSkeleton = () => (
  <div className="px-6 pt-4 pb-2 flex flex-col sticky top-0 z-20">
    {/* Navigation Row */}
    <div className="flex items-center justify-between mb-4">
      <motion.div variants={shimmerVariants} initial="initial" animate="animate">
        <div className="w-10 h-10 rounded-full bg-gray-100" />
      </motion.div>
      <motion.div variants={shimmerVariants} initial="initial" animate="animate">
        <div className="w-10 h-10 rounded-full bg-gray-100" />
      </motion.div>
    </div>

    {/* Couple Row */}
    <div className="flex items-center justify-center">
      <div className="flex items-center gap-6">
        {/* My Profile */}
        <motion.div variants={shimmerVariants} initial="initial" animate="animate" className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-gray-200" />
          <div className="h-[11px] w-8 mt-1.5 rounded-full bg-gray-100" />
        </motion.div>

        {/* D-Day */}
        <motion.div variants={shimmerVariants} initial="initial" animate="animate" className="flex flex-col items-center px-4">
          <div className="h-[30px] w-[76px] rounded-full bg-rose-50" />
        </motion.div>

        {/* Partner Profile */}
        <motion.div variants={shimmerVariants} initial="initial" animate="animate" className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-gray-200" />
          <div className="h-[11px] w-12 mt-1.5 rounded-full bg-gray-100" />
          <div className="h-[9px] w-8 mt-0.5 rounded-full bg-gray-50" />
        </motion.div>
      </div>
    </div>
  </div>
);
