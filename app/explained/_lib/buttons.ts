/**
 * The kit's buttons keep to one line. At 400% zoom (a 320 px window with
 * the site's rail) a long label is wider than the column, so below 360 px
 * it may wrap and the button grows to fit.
 */
export const WRAP_WHEN_NARROW =
  "max-[359px]:tw-h-auto max-[359px]:tw-min-h-[46px] max-[359px]:tw-whitespace-normal max-[359px]:tw-py-2";
