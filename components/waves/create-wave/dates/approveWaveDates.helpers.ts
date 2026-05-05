export const getEarliestApproveWaveEndTimestamp = (
  submissionStartDate: number
) => {
  const earliestValidEndDate = new Date(submissionStartDate);
  earliestValidEndDate.setSeconds(0, 0);
  earliestValidEndDate.setMinutes(earliestValidEndDate.getMinutes() + 1);
  return earliestValidEndDate.getTime();
};

export const clampApproveWaveEndDate = (
  candidateDate: Date,
  submissionStartDate: number
) =>
  new Date(
    Math.max(
      candidateDate.getTime(),
      getEarliestApproveWaveEndTimestamp(submissionStartDate)
    )
  );
