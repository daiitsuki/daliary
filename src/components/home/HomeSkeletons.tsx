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

export const HeartGaugeSkeleton = () => (
  <motion.div variants={shimmerVariants} initial="initial" animate="animate" className="mx-auto w-full px-8 pt-4 pb-8">
    <div className="relative h-6 w-full overflow-hidden rounded-full bg-gray-100">
      <div className="h-full w-1/3 bg-gray-200 rounded-full" />
    </div>
    <div className="mt-4 flex justify-between px-2">
      <div className="h-2 w-12 bg-gray-200 rounded-full" />
      <div className="h-2 w-12 bg-gray-200 rounded-full" />
    </div>
  </motion.div>
);

export const DailyTabSkeleton = () => (
  <motion.div variants={shimmerVariants} initial="initial" animate="animate" className="px-6 pb-8">
    {/* Tabs */}
    <div className="relative z-20 flex translate-y-[1px] items-end justify-end gap-1.5 px-6">
      <div className="h-10 w-[52px] rounded-t-[16px] bg-gray-200" />
      <div className="h-9 w-[52px] rounded-t-[16px] bg-gray-100" />
    </div>
    {/* Card */}
    <div className="h-[380px] w-full rounded-[32px] bg-white border border-gray-100 shadow-sm p-6 flex flex-col">
      <div className="flex flex-col items-center space-y-5 pt-8">
        <div className="h-4 w-24 bg-gray-200 rounded-full" />
        <div className="h-7 w-56 bg-gray-200 rounded-full mt-4" />
        <div className="h-7 w-40 bg-gray-200 rounded-full" />
      </div>
      <div className="mt-auto space-y-4 pt-12">
        <div className="h-[80px] w-full bg-gray-50 rounded-2xl" />
      </div>
    </div>
  </motion.div>
);

export const RelayNovelWidgetSkeleton = () => (
  <motion.div variants={shimmerVariants} initial="initial" animate="animate" className="px-6 pb-8">
    <div className="flex items-center justify-between mb-3 px-2">
      <div className="h-4 w-28 bg-gray-200 rounded-full" />
      <div className="h-4 w-16 bg-gray-100 rounded-full" />
    </div>
    <div className="h-[120px] w-full rounded-[28px] bg-white border border-gray-100 shadow-sm p-6 flex flex-col justify-center">
      <div className="h-3 w-20 bg-gray-200 rounded-full mb-5" />
      <div className="space-y-3">
        <div className="h-4 w-full bg-gray-100 rounded-full" />
        <div className="h-4 w-3/4 bg-gray-100 rounded-full" />
      </div>
    </div>
  </motion.div>
);

export const QuickLinksSkeleton = () => (
  <motion.div variants={shimmerVariants} initial="initial" animate="animate" className="px-6 mb-6">
    <div className="relative bg-white rounded-[32px] py-5 shadow-sm border border-gray-50 overflow-hidden">
      <div className="flex flex-row overflow-hidden gap-4 sm:px-4 sm:justify-center">
        <div className="flex-shrink-0 w-4 sm:hidden" />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex-shrink-0 flex flex-col items-center w-14">
            <div className="w-14 h-14 rounded-[20px] bg-gray-100 mb-2" />
            <div className="h-[11px] w-10 bg-gray-100 rounded-full" />
          </div>
        ))}
        <div className="flex-shrink-0 w-4 sm:hidden" />
      </div>
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white via-white/80 to-transparent sm:hidden" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white via-white/80 to-transparent sm:hidden" />
    </div>
  </motion.div>
);
