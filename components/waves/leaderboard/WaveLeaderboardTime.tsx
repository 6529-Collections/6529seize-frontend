import React, { useState, useEffect } from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { Time } from "../../../helpers/time";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDays, faClock } from "@fortawesome/free-regular-svg-icons";
import { faRepeat } from "@fortawesome/free-solid-svg-icons";

interface WaveLeaderboardTimeProps {
  readonly wave: ApiWave;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface DecisionPoint {
  id: number;
  name: string;
  timestamp: number;
}

enum WaveLeaderboardTimeType {
  DROPPING = "DROPPING",
  VOTING = "VOTING",
}

enum WaveLeaderboardTimeState {
  UPCOMING = "UPCOMING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

export const WaveLeaderboardTime: React.FC<WaveLeaderboardTimeProps> = ({
  wave,
}) => {
  // Check for multi-decision wave
  const isMultiDecisionWave =
    !!wave.wave.decisions_strategy &&
    wave.wave.decisions_strategy.subsequent_decisions.length > 0;

  // Check for rolling wave
  const isRollingWave =
    isMultiDecisionWave && !!wave.wave.decisions_strategy?.is_rolling;

  // Track expanded/collapsed state for decision details
  const [isDecisionDetailsOpen, setIsDecisionDetailsOpen] =
    useState<boolean>(false);

  // Track next decision point time for multi-decision waves
  const [nextDecisionTime, setNextDecisionTime] = useState<number | null>(
    wave.wave.next_decision_time || null
  );

  // Track upcoming decision points for multi-decision waves
  const [upcomingDecisions, setUpcomingDecisions] = useState<DecisionPoint[]>(
    []
  );

  // Current cycle count for rolling waves
  const [currentCycle, setCurrentCycle] = useState<number>(1);

  // Track time left until next decision for multi-decision waves
  const [nextDecisionTimeLeft, setNextDecisionTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const participationPeriodMin =
    wave.participation.period?.min ?? Time.currentMillis();
  const participationPeriodMax =
    wave.participation.period?.max ?? Time.currentMillis();
  const votingPeriodMin = wave.voting.period?.min ?? Time.currentMillis();
  const votingPeriodMax = wave.voting.period?.max ?? Time.currentMillis();

  // Calculate upcoming decision points for multi-decision waves
  useEffect(() => {
    if (isMultiDecisionWave && wave.wave.decisions_strategy) {
      const strategy = wave.wave.decisions_strategy;
      const firstDecisionTime = strategy.first_decision_time;
      const subsequentDecisions = strategy.subsequent_decisions;

      // Calculate future decision points
      const decisions: DecisionPoint[] = [];

      // Add first decision point
      decisions.push({
        id: 1,
        name: "First Decision",
        timestamp: firstDecisionTime,
      });

      // Add subsequent decision points
      let currentTime = firstDecisionTime;
      for (let i = 0; i < subsequentDecisions.length; i++) {
        currentTime += subsequentDecisions[i];
        decisions.push({
          id: i + 2,
          name: `Decision ${i + 2}`,
          timestamp: currentTime,
        });
      }

      // For rolling waves, calculate additional cycles if needed
      if (isRollingWave && subsequentDecisions.length > 0) {
        const cycleLength = subsequentDecisions.reduce(
          (sum, time) => sum + time,
          0
        );
        let cycleStartTime = currentTime;

        // Add 2 more cycles for display purposes
        for (let cycle = 2; cycle <= 3; cycle++) {
          for (let i = 0; i < subsequentDecisions.length; i++) {
            cycleStartTime += subsequentDecisions[i];
            decisions.push({
              id: cycle * subsequentDecisions.length + i + 1,
              name: `Cycle ${cycle}, Decision ${i + 1}`,
              timestamp: cycleStartTime,
            });
          }
        }
      }

      // Filter to only show future decision points
      const now = Time.currentMillis();
      const futureDecisions = decisions.filter((d) => d.timestamp > now);

      // Calculate current cycle for rolling waves
      if (isRollingWave && decisions.length > 0) {
        const passedDecisions = decisions.filter(
          (d) => d.timestamp <= now
        ).length;
        const decisionsPerCycle = subsequentDecisions.length + 1; // First + subsequent
        const currentCycleNumber =
          Math.floor(passedDecisions / decisionsPerCycle) + 1;
        setCurrentCycle(currentCycleNumber);
      }

      setUpcomingDecisions(futureDecisions.slice(0, 3)); // Show up to 3 future decision points

      // Set the next decision time
      if (futureDecisions.length > 0) {
        setNextDecisionTime(futureDecisions[0].timestamp);
      }
    }
  }, [wave, isMultiDecisionWave, isRollingWave]);

  const getDroppingTimeState = (): WaveLeaderboardTimeState => {
    if (!participationPeriodMin || !participationPeriodMax) {
      return WaveLeaderboardTimeState.UPCOMING;
    }
    if (participationPeriodMin > Time.currentMillis()) {
      return WaveLeaderboardTimeState.UPCOMING;
    }
    if (participationPeriodMax < Time.currentMillis()) {
      return WaveLeaderboardTimeState.COMPLETED;
    }
    return WaveLeaderboardTimeState.IN_PROGRESS;
  };

  const getVotingTimeState = (): WaveLeaderboardTimeState => {
    if (!votingPeriodMin || !votingPeriodMax) {
      return WaveLeaderboardTimeState.UPCOMING;
    }
    if (votingPeriodMin > Time.currentMillis()) {
      return WaveLeaderboardTimeState.UPCOMING;
    }
    if (votingPeriodMax < Time.currentMillis()) {
      return WaveLeaderboardTimeState.COMPLETED;
    }
    return WaveLeaderboardTimeState.IN_PROGRESS;
  };

  const [droppingTimeState, setDroppingTimeState] =
    useState<WaveLeaderboardTimeState>(getDroppingTimeState());
  const [votingTimeState, setVotingTimeState] =
    useState<WaveLeaderboardTimeState>(getVotingTimeState());

  const [droppingTimeLeft, setDroppingTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [votingTimeLeft, setVotingTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Calculate time left until a given timestamp
  const calculateTimeLeft = (targetTime: number): TimeLeft => {
    const now = Time.currentMillis();
    const difference = targetTime - now;

    if (difference <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / (1000 * 60)) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  };

  useEffect(() => {
    const updateDroppingTime = () => {
      const now = Time.currentMillis();
      const start = participationPeriodMin ?? now;
      const end = participationPeriodMax ?? now;
      const state = getDroppingTimeState();
      setDroppingTimeState(state);

      let targetTime = 0;
      if (state === WaveLeaderboardTimeState.UPCOMING) {
        targetTime = start;
      } else if (state === WaveLeaderboardTimeState.IN_PROGRESS) {
        targetTime = end;
      } else {
        setDroppingTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });
        return;
      }

      const difference = targetTime - now;
      if (difference <= 0) {
        setDroppingTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });
        return;
      }

      setDroppingTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };

    updateDroppingTime();
    const droppingTimer = setInterval(updateDroppingTime, 1000);

    return () => clearInterval(droppingTimer);
  }, [wave]);

  useEffect(() => {
    const updateVotingTime = () => {
      const now = Time.currentMillis();
      const start = votingPeriodMin ?? now;
      const end = votingPeriodMax ?? now;
      const state = getVotingTimeState();
      setVotingTimeState(state);

      let targetTime = 0;
      if (state === WaveLeaderboardTimeState.UPCOMING) {
        targetTime = start;
      } else if (state === WaveLeaderboardTimeState.IN_PROGRESS) {
        targetTime = end;
      } else {
        setVotingTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });
        return;
      }

      const difference = targetTime - now;
      if (difference <= 0) {
        setVotingTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });
        return;
      }

      setVotingTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };

    updateVotingTime();
    const votingTimer = setInterval(updateVotingTime, 1000);

    return () => clearInterval(votingTimer);
  }, [wave]);

  // Update next decision time countdown for multi-decision waves
  useEffect(() => {
    if (isMultiDecisionWave && nextDecisionTime) {
      const updateNextDecisionTime = () => {
        const timeLeft = calculateTimeLeft(nextDecisionTime);
        setNextDecisionTimeLeft(timeLeft);

        // If the next decision time has passed, recalculate upcoming decisions
        if (
          timeLeft.days === 0 &&
          timeLeft.hours === 0 &&
          timeLeft.minutes === 0 &&
          timeLeft.seconds === 0
        ) {
          // We'd typically fetch the updated wave data from the API here
          // For now, we'll just shift our upcoming decisions
          if (upcomingDecisions.length > 1) {
            setNextDecisionTime(upcomingDecisions[1].timestamp);
            setUpcomingDecisions(upcomingDecisions.slice(1));

            if (isRollingWave) {
              // For rolling waves, we need to calculate the next cycle
              const newCycle =
                currentCycle +
                (upcomingDecisions[0].id %
                  wave.wave.decisions_strategy!.subsequent_decisions.length ===
                0
                  ? 1
                  : 0);
              setCurrentCycle(newCycle);
            }
          }
        }
      };

      updateNextDecisionTime();
      const decisionTimer = setInterval(updateNextDecisionTime, 1000);

      return () => clearInterval(decisionTimer);
    }
  }, [
    isMultiDecisionWave,
    nextDecisionTime,
    upcomingDecisions,
    isRollingWave,
    currentCycle,
    wave,
  ]);

  return (
    <div className="tw-@container">
      {/* Compact Dropping/Voting Cards */}
      <div className="tw-grid [@container_(max-width:700px)]:tw-grid-cols-1 tw-grid-cols-2 tw-gap-3 tw-@container">
        {/* Dropping Phase Card - Compact */}
        <div className="tw-rounded-lg tw-bg-gradient-to-br tw-from-[#1E1E2E]/80 tw-via-[#2E2E3E]/60 tw-to-[#3E2E3E]/40 tw-px-4 tw-py-3 tw-backdrop-blur-sm tw-border tw-border-[#3E2E3E]/20">
          <div className="tw-flex tw-items-center tw-gap-x-3 tw-gap-y-2 tw-mb-3.5">
            <div className="tw-flex-shrink-0  tw-size-6 md:tw-size-8 tw-rounded-md tw-bg-gradient-to-br tw-from-emerald-300/10 tw-to-emerald-400/5 tw-flex tw-items-center tw-justify-center tw-ring-1 tw-ring-white/10">
              {droppingTimeState === WaveLeaderboardTimeState.COMPLETED ? (
                <svg
                  className="tw-w-3 tw-h-3 md:tw-w-4 md:tw-h-4 tw-text-emerald-400/80 tw-flex-shrink-0"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  fill="none"
                >
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg
                  className="tw-w-3 tw-h-3 md:tw-w-4 md:tw-h-4 tw-text-emerald-400/80 tw-flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M12 8v4l2.5 2.5M12 2v2m10 8a10 10 0 11-20 0 10 10 0 0120 0z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>

            <div className="tw-flex tw-justify-between tw-items-center tw-w-full">
              <h2 className="tw-text-sm md:tw-text-base tw-font-medium tw-text-white/90 tw-mb-0">
                {droppingTimeState === WaveLeaderboardTimeState.UPCOMING &&
                  "Dropping Starts In"}
                {droppingTimeState === WaveLeaderboardTimeState.IN_PROGRESS &&
                  "Dropping Ends In"}
                {droppingTimeState === WaveLeaderboardTimeState.COMPLETED &&
                  "Dropping Complete"}
              </h2>
              <p className="tw-text-xs tw-text-white/60 tw-mb-0">
                {droppingTimeState === WaveLeaderboardTimeState.UPCOMING &&
                  new Date(participationPeriodMin).toLocaleDateString()}
                {droppingTimeState === WaveLeaderboardTimeState.IN_PROGRESS &&
                  new Date(participationPeriodMax).toLocaleDateString()}
                {droppingTimeState === WaveLeaderboardTimeState.COMPLETED &&
                  new Date(participationPeriodMax).toLocaleDateString()}
              </p>
            </div>
          </div>

          {droppingTimeState !== WaveLeaderboardTimeState.COMPLETED ? (
            <div className="tw-flex tw-items-center tw-gap-1.5">
              <div className="tw-flex-1 tw-@container tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-2 tw-py-1 tw-rounded-md tw-border tw-border-primary-300/10 tw-whitespace-nowrap">
                <div className="tw-flex tw-justify-center tw-items-baseline">
                  <span className="tw-text-base md:tw-text-xl [@container]:tw-text-xl [@container_(max-width:80px)]:tw-text-base tw-font-medium tw-text-white/90 tw-tracking-tight">
                    {droppingTimeLeft.days}
                  </span>
                  <span className="tw-ml-1 tw-text-[10px] md:tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium">
                    {droppingTimeLeft.days === 1 ? "day" : "days"}
                  </span>
                </div>
              </div>
              <div className="tw-flex-1 tw-@container tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-2 tw-py-1 tw-rounded-md tw-border tw-border-primary-300/10 tw-whitespace-nowrap">
                <div className="tw-flex tw-justify-center tw-items-baseline">
                  <span className="tw-text-base md:tw-text-xl [@container]:tw-text-xl [@container_(max-width:80px)]:tw-text-base tw-font-medium tw-text-white/90 tw-tracking-tight">
                    {droppingTimeLeft.hours}
                  </span>
                  <span className="tw-ml-1 tw-text-[10px] md:tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium">
                    {droppingTimeLeft.hours === 1 ? "hr" : "hrs"}
                  </span>
                </div>
              </div>
              <div className="tw-flex-1 tw-@container tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-2 tw-py-1 tw-rounded-md tw-border tw-border-primary-300/10 tw-whitespace-nowrap">
                <div className="tw-flex tw-justify-center tw-items-baseline">
                  <span className="tw-text-base md:tw-text-xl [@container]:tw-text-xl [@container_(max-width:80px)]:tw-text-base tw-font-medium tw-text-white/90 tw-tracking-tight">
                    {droppingTimeLeft.minutes}
                  </span>
                  <span className="tw-ml-1 tw-text-[10px] md:tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium">
                    min
                  </span>
                </div>
              </div>
              <div className="tw-flex-1 tw-@container tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-2 tw-py-1 tw-rounded-md tw-border tw-border-primary-300/10 tw-whitespace-nowrap">
                <div className="tw-flex tw-justify-center tw-items-baseline">
                  <span className="tw-text-base md:tw-text-xl [@container]:tw-text-xl [@container_(max-width:80px)]:tw-text-base tw-font-medium tw-text-white/90 tw-tracking-tight">
                    {droppingTimeLeft.seconds}
                  </span>
                  <span className="tw-ml-1 tw-text-[10px] md:tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium">
                    sec
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="tw-text-xs tw-text-white/60 tw-bg-white/5 tw-rounded-md tw-py-1.5 tw-px-2.5 tw-text-center">
              The dropping phase has ended
            </div>
          )}
        </div>

        {/* Voting Phase Card - Compact */}
        <div className="tw-rounded-lg tw-bg-gradient-to-br tw-from-[#1E1E2E]/80 tw-via-[#2E2E3E]/60 tw-to-[#3E2E3E]/40 tw-px-4 tw-py-3 tw-backdrop-blur-sm tw-border tw-border-[#3E2E3E]/20">
          <div className="tw-flex tw-items-center tw-gap-x-3 tw-gap-y-2 tw-mb-3.5">
            <div className="tw-flex-shrink-0  tw-size-6 md:tw-size-8 tw-rounded-md tw-bg-gradient-to-br tw-from-violet-300/10 tw-to-violet-400/5 tw-flex tw-items-center tw-justify-center tw-ring-1 tw-ring-white/10">
              {votingTimeState === WaveLeaderboardTimeState.COMPLETED ? (
                <svg
                  className="tw-w-3 tw-h-3 md:tw-w-4 md:tw-h-4 tw-text-violet-400/80 tw-flex-shrink-0"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  fill="none"
                >
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg
                  className="tw-w-3 tw-h-3 md:tw-w-4 md:tw-h-4 tw-text-violet-400/80 tw-flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M12 8v4l2.5 2.5M12 2v2m10 8a10 10 0 11-20 0 10 10 0 0120 0z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>

            <div className="tw-flex tw-justify-between tw-items-center tw-w-full">
              <h2 className="tw-text-sm md:tw-text-base tw-font-medium tw-text-white/90 tw-mb-0">
                {votingTimeState === WaveLeaderboardTimeState.UPCOMING &&
                  "Voting Starts In"}
                {votingTimeState === WaveLeaderboardTimeState.IN_PROGRESS &&
                  "Voting Ends In"}
                {votingTimeState === WaveLeaderboardTimeState.COMPLETED &&
                  "Voting Complete"}
              </h2>
              <p className="tw-text-xs tw-text-white/60 tw-mb-0">
                {votingTimeState === WaveLeaderboardTimeState.UPCOMING &&
                  new Date(votingPeriodMin).toLocaleDateString()}
                {votingTimeState === WaveLeaderboardTimeState.IN_PROGRESS &&
                  new Date(votingPeriodMax).toLocaleDateString()}
                {votingTimeState === WaveLeaderboardTimeState.COMPLETED &&
                  new Date(votingPeriodMax).toLocaleDateString()}
              </p>
            </div>
          </div>

          {votingTimeState !== WaveLeaderboardTimeState.COMPLETED ? (
            <div className="tw-flex tw-items-center tw-gap-1.5">
              <div className="tw-flex-1 tw-@container tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-2 tw-py-1 tw-rounded-md tw-border tw-border-primary-300/10 tw-whitespace-nowrap">
                <div className="tw-flex tw-justify-center tw-items-baseline">
                  <span className="tw-text-base md:tw-text-xl [@container]:tw-text-xl [@container_(max-width:80px)]:tw-text-base tw-font-medium tw-text-white/90 tw-tracking-tight">
                    {votingTimeLeft.days}
                  </span>
                  <span className="tw-ml-1 tw-text-[10px] md:tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium">
                    {votingTimeLeft.days === 1 ? "day" : "days"}
                  </span>
                </div>
              </div>
              <div className="tw-flex-1 tw-@container tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-2 tw-py-1 tw-rounded-md tw-border tw-border-primary-300/10 tw-whitespace-nowrap">
                <div className="tw-flex tw-justify-center tw-items-baseline">
                  <span className="tw-text-base md:tw-text-xl [@container]:tw-text-xl [@container_(max-width:80px)]:tw-text-base tw-font-medium tw-text-white/90 tw-tracking-tight">
                    {votingTimeLeft.hours}
                  </span>
                  <span className="tw-ml-1 tw-text-[10px] md:tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium">
                    {votingTimeLeft.hours === 1 ? "hr" : "hrs"}
                  </span>
                </div>
              </div>
              <div className="tw-flex-1 tw-@container tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-2 tw-py-1 tw-rounded-md tw-border tw-border-primary-300/10 tw-whitespace-nowrap">
                <div className="tw-flex tw-justify-center tw-items-baseline">
                  <span className="tw-text-base md:tw-text-xl [@container]:tw-text-xl [@container_(max-width:80px)]:tw-text-base tw-font-medium tw-text-white/90 tw-tracking-tight">
                    {votingTimeLeft.minutes}
                  </span>
                  <span className="tw-ml-1 tw-text-[10px] md:tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium">
                    min
                  </span>
                </div>
              </div>
              <div className="tw-flex-1 tw-@container tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-2 tw-py-1 tw-rounded-md tw-border tw-border-primary-300/10 tw-whitespace-nowrap">
                <div className="tw-flex tw-justify-center tw-items-baseline">
                  <span className="tw-text-base md:tw-text-xl [@container]:tw-text-xl [@container_(max-width:80px)]:tw-text-base tw-font-medium tw-text-white/90 tw-tracking-tight">
                    {votingTimeLeft.seconds}
                  </span>
                  <span className="tw-ml-1 tw-text-[10px] md:tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium">
                    sec
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="tw-text-xs tw-text-white/60 tw-bg-white/5 tw-rounded-md tw-py-1.5 tw-px-2.5 tw-text-center">
              The voting phase has ended
            </div>
          )}
        </div>
      </div>

      {/* Next Voting Row - Only for multi-decision waves */}
      {isMultiDecisionWave && nextDecisionTime && (
        <div className="tw-mt-3">
          {/* Next Voting Card */}
          <div className="tw-rounded-lg tw-bg-gradient-to-br tw-from-[#1E1E2E]/80 tw-via-[#2E2E3E]/60 tw-to-[#3E2E3E]/40 tw-backdrop-blur-sm tw-border tw-border-[#3E2E3E]/20">
            {/* Main Header Row */}
            <div
              className="tw-flex tw-items-center tw-gap-x-3 tw-gap-y-2 tw-cursor-pointer tw-rounded-lg  tw-px-4 tw-py-3 tw-bg-transparent desktop-hover:hover:tw-bg-white/[0.02] tw-transition tw-duration-300 tw-ease-out"
              onClick={() => setIsDecisionDetailsOpen(!isDecisionDetailsOpen)}
            >
              {/* Icon - Calendar for regular multi-decision wave, Recurring for rolling wave */}
              <div className="tw-flex-shrink-0 tw-size-6 md:tw-size-7 tw-rounded-md tw-bg-gradient-to-br tw-from-blue-300/10 tw-to-blue-400/5 tw-flex tw-items-center tw-justify-center tw-ring-1 tw-ring-white/10">
                {isRollingWave ? (
                  <FontAwesomeIcon
                    icon={faRepeat}
                    className="tw-text-blue-400/80 tw-text-sm md:tw-text-base tw-size-4"
                  />
                ) : (
                  <FontAwesomeIcon
                    icon={faCalendarDays}
                    className="tw-text-blue-400/80 tw-text-sm md:tw-text-base tw-size-4"
                  />
                )}
              </div>

              {/* Title and Date */}
              <div className="tw-flex tw-justify-between tw-items-center tw-w-full">
                <div className="tw-flex tw-items-center">
                  <h2 className="tw-text-sm tw-font-medium tw-text-white/90 tw-mb-0">
                    Next winner announcement in
                  </h2>
                  {!isDecisionDetailsOpen && (
                    <span className="tw-ml-2 tw-text-xs tw-font-semibold tw-text-white/80">
                      {nextDecisionTimeLeft.days}
                      <span className="tw-ml-1 tw-text-[10px] md:tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium">
                        DAYS
                      </span>{" "}
                      {nextDecisionTimeLeft.hours}
                      <span className="tw-ml-1 tw-text-[10px] md:tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium">
                        HOURS
                      </span>{" "}
                      {nextDecisionTimeLeft.minutes}
                      <span className="tw-ml-1 tw-text-[10px] md:tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium">
                        MIN
                      </span>
                    </span>
                  )}
                </div>
                <div className="tw-flex tw-items-center tw-gap-2">
                  {/* Date Badge */}
                  <span className="tw-text-xs tw-text-white/60 tw-bg-white/5 tw-rounded-md tw-px-2 tw-py-0.5">
                    {new Date(nextDecisionTime).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>

                  {/* Expand/Collapse indicator */}
                  <svg
                    className={`tw-w-4 tw-h-4 tw-text-white/60 tw-transition-transform tw-duration-300 ${
                      isDecisionDetailsOpen ? "tw-rotate-180" : ""
                    }`}
                    fill="none"
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            
              {/* Time boxes - Shown when section is expanded */}
              {isDecisionDetailsOpen && (
                <div className="tw-flex tw-items-center tw-gap-1.5 tw-px-4 tw-pt-2">
                  <div className="tw-flex-1 tw-@container tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-2 tw-py-1 tw-rounded-md tw-border tw-border-primary-300/10 tw-whitespace-nowrap">
                    <div className="tw-flex tw-justify-center tw-items-baseline">
                      <span className="tw-text-sm md:tw-text-base [@container]:tw-text-base [@container_(max-width:80px)]:tw-text-sm tw-font-medium tw-text-white/90 tw-tracking-tight">
                        {nextDecisionTimeLeft.days}
                      </span>
                      <span className="tw-ml-1 tw-text-[10px] md:tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium">
                        {nextDecisionTimeLeft.days === 1 ? "day" : "days"}
                      </span>
                    </div>
                  </div>
                  <div className="tw-flex-1 tw-@container tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-2 tw-py-1 tw-rounded-md tw-border tw-border-primary-300/10 tw-whitespace-nowrap">
                    <div className="tw-flex tw-justify-center tw-items-baseline">
                      <span className="tw-text-sm md:tw-text-base [@container]:tw-text-base [@container_(max-width:80px)]:tw-text-sm tw-font-medium tw-text-white/90 tw-tracking-tight">
                        {nextDecisionTimeLeft.hours}
                      </span>
                      <span className="tw-ml-1 tw-text-[10px] md:tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium">
                        {nextDecisionTimeLeft.hours === 1 ? "hr" : "hrs"}
                      </span>
                    </div>
                  </div>
                  <div className="tw-flex-1 tw-@container tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-2 tw-py-1 tw-rounded-md tw-border tw-border-primary-300/10 tw-whitespace-nowrap">
                    <div className="tw-flex tw-justify-center tw-items-baseline">
                      <span className="tw-text-sm md:tw-text-base [@container]:tw-text-base [@container_(max-width:80px)]:tw-text-sm tw-font-medium tw-text-white/90 tw-tracking-tight">
                        {nextDecisionTimeLeft.minutes}
                      </span>
                      <span className="tw-ml-1 tw-text-[10px] md:tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium">
                        min
                      </span>
                    </div>
                  </div>
                  <div className="tw-flex-1 tw-@container tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-2 tw-py-1 tw-rounded-md tw-border tw-border-primary-300/10 tw-whitespace-nowrap">
                    <div className="tw-flex tw-justify-center tw-items-baseline">
                      <span className="tw-text-sm md:tw-text-base [@container]:tw-text-base [@container_(max-width:80px)]:tw-text-sm tw-font-medium tw-text-white/90 tw-tracking-tight">
                        {nextDecisionTimeLeft.seconds}
                      </span>
                      <span className="tw-ml-1 tw-text-[10px] md:tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium">
                        sec
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Expanded Section */}
              {isDecisionDetailsOpen && (
                <div className="tw-mt-2 tw-px-4 tw-pb-3">
                  {/* Wave End Date moved to bottom as requested */}

                  {/* Detailed Horizontal Timeline */}
                  <div className="tw-overflow-hidden tw-rounded-lg tw-border tw-border-white/10">
                    {/* Vertical Timeline */}
                    <div className="tw-relative tw-py-2">
                      {/* Timeline Structure */}
                      <div className="tw-ml-2.5 tw-relative">
                        {/* Vertical Connecting Line */}
                        <div className="tw-absolute tw-w-0.5 tw-bg-white/10 tw-top-0 tw-bottom-0 tw-left-0"></div>

                        {/* Timeline Nodes - Vertical */}
                        <div className="tw-flex tw-flex-col tw-gap-4">
                          {upcomingDecisions.map((decision, index) => (
                            <div
                              key={decision.id}
                              className="tw-flex tw-items-start tw-relative tw-pl-5"
                            >
                              {/* Node */}
                              <div
                                className={`tw-absolute tw-left-0 tw-top-1 tw-transform -tw-translate-x-1/2 tw-flex tw-items-center tw-justify-center ${
                                  index === 0
                                    ? "tw-w-4 tw-h-4"
                                    : "tw-w-3 tw-h-3"
                                }`}
                              >
                                {index === 0 && (
                                  <span className="tw-animate-ping tw-absolute tw-inline-flex tw-h-full tw-w-full tw-rounded-full tw-bg-primary-400/40"></span>
                                )}
                                <span
                                  className={`tw-relative tw-inline-flex tw-rounded-full ${
                                    index === 0
                                      ? "tw-w-4 tw-h-4 tw-bg-primary-400"
                                      : "tw-w-3 tw-h-3 tw-border tw-border-white/20 tw-bg-iron-700"
                                  }`}
                                ></span>
                              </div>

                              {/* Content */}
                              <div className="tw-flex tw-justify-between tw-items-center tw-w-full tw-mt-0.5">
                                <div>
                                  <p
                                    className={`tw-text-xs tw-font-medium ${
                                      index === 0
                                        ? "tw-text-white/90"
                                        : "tw-text-white/60"
                                    }`}
                                  >
                                    {new Date(
                                      decision.timestamp
                                    ).toLocaleDateString(undefined, {
                                      weekday: "short",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                    {index === 0 && (
                                      <span className="tw-ml-1.5 tw-inline-flex tw-items-center tw-rounded-full tw-bg-primary-500/20 tw-px-1.5 tw-py-0.5 tw-text-[10px] tw-font-medium tw-text-primary-400">
                                        Next
                                      </span>
                                    )}
                                  </p>
                                </div>

                                <div className="tw-text-right tw-text-xs tw-tabular-nums tw-text-white/50 tw-font-mono">
                                  {new Date(
                                    decision.timestamp
                                  ).toLocaleTimeString(undefined, {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </div>

                              {/* Optional rolling indicator for first item */}
                              {index === 0 && isRollingWave && (
                                <div className="tw-absolute tw-left-0 tw-top-1 tw-transform -tw-translate-x-7">
                                  <FontAwesomeIcon
                                    icon={faRepeat}
                                    className="tw-text-xs tw-text-white/30"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
           
          </div>
        </div>
      )}
    </div>
  );
};
