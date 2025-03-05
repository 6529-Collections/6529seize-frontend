import React, { useState, useEffect } from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { Time } from "../../../helpers/time";

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
  const isMultiDecisionWave = !!wave.wave.decisions_strategy && 
    wave.wave.decisions_strategy.subsequent_decisions.length > 0;
  
  // Check for rolling wave
  const isRollingWave = isMultiDecisionWave && 
    !!wave.wave.decisions_strategy?.is_rolling;

  // Track expanded/collapsed state for decision details
  const [isDecisionDetailsOpen, setIsDecisionDetailsOpen] = useState<boolean>(false);

  // Track next decision point time for multi-decision waves
  const [nextDecisionTime, setNextDecisionTime] = useState<number | null>(
    wave.wave.next_decision_time || null
  );
  
  // Track upcoming decision points for multi-decision waves
  const [upcomingDecisions, setUpcomingDecisions] = useState<DecisionPoint[]>([]);
  
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
        const cycleLength = subsequentDecisions.reduce((sum, time) => sum + time, 0);
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
      const futureDecisions = decisions.filter(d => d.timestamp > now);
      
      // Calculate current cycle for rolling waves
      if (isRollingWave && decisions.length > 0) {
        const passedDecisions = decisions.filter(d => d.timestamp <= now).length;
        const decisionsPerCycle = subsequentDecisions.length + 1; // First + subsequent
        const currentCycleNumber = Math.floor(passedDecisions / decisionsPerCycle) + 1;
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
        if (timeLeft.days === 0 && timeLeft.hours === 0 && 
            timeLeft.minutes === 0 && timeLeft.seconds === 0) {
          // We'd typically fetch the updated wave data from the API here
          // For now, we'll just shift our upcoming decisions
          if (upcomingDecisions.length > 1) {
            setNextDecisionTime(upcomingDecisions[1].timestamp);
            setUpcomingDecisions(upcomingDecisions.slice(1));
            
            if (isRollingWave) {
              // For rolling waves, we need to calculate the next cycle
              const newCycle = currentCycle + 
                (upcomingDecisions[0].id % wave.wave.decisions_strategy!.subsequent_decisions.length === 0 ? 1 : 0);
              setCurrentCycle(newCycle);
            }
          }
        }
      };
      
      updateNextDecisionTime();
      const decisionTimer = setInterval(updateNextDecisionTime, 1000);
      
      return () => clearInterval(decisionTimer);
    }
  }, [isMultiDecisionWave, nextDecisionTime, upcomingDecisions, isRollingWave, currentCycle, wave]);

  return (
    <div className="tw-@container">
      {/* Standard Dropping/Voting Cards */}
      <div className="tw-grid [@container_(max-width:700px)]:tw-grid-cols-1 tw-grid-cols-2 tw-gap-4 tw-@container">
        {/* Dropping Phase Card */}
        <div className="tw-rounded-xl tw-bg-gradient-to-br tw-from-[#1E1E2E]/80 tw-via-[#2E2E3E]/60 tw-to-[#3E2E3E]/40 tw-p-6 [@container_(max-width:800px)]:tw-p-4 tw-backdrop-blur-sm tw-border tw-border-[#3E2E3E]/20">
          <div className="tw-w-full tw-flex tw-items-center tw-gap-2 md:tw-gap-3 tw-mb-2 md:tw-mb-4">
            <div className="tw-flex-shrink-0 tw-size-6 md:tw-size-8 tw-rounded-lg tw-bg-gradient-to-br tw-from-emerald-300/10 tw-to-emerald-400/5 tw-flex tw-items-center tw-justify-center tw-ring-1 tw-ring-white/10">
              {droppingTimeState === WaveLeaderboardTimeState.COMPLETED ? (
                <svg
                  className="tw-w-4 tw-h-4 tw-text-emerald-400/80 tw-flex-shrink-0"
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
            <div className="tw-w-full">
              {droppingTimeState === WaveLeaderboardTimeState.UPCOMING && (
                <>
                  <h2 className="tw-text-sm md:tw-text-base tw-font-medium tw-mb-0.5 tw-text-white/90">
                    Dropping Starts In
                  </h2>
                  <p className="tw-text-xs tw-text-white/60 tw-mb-0">
                    {new Date(participationPeriodMin).toLocaleDateString()}
                  </p>
                </>
              )}
              {droppingTimeState === WaveLeaderboardTimeState.IN_PROGRESS && (
                <div className="tw-flex tw-justify-between tw-items-center tw-w-full md:tw-flex-col md:tw-items-start">
                  <h2 className="tw-text-sm md:tw-text-base tw-font-medium tw-mb-0.5 tw-text-white/90">
                    Dropping Ends In
                  </h2>
                  <p className="tw-text-xs tw-text-white/60 tw-mb-0">
                    {new Date(participationPeriodMax).toLocaleDateString()}
                  </p>
                </div>
              )}
              {droppingTimeState === WaveLeaderboardTimeState.COMPLETED && (
                <div className="tw-flex tw-justify-between tw-items-center tw-w-full md:tw-flex-col md:tw-items-start">
                  <h2 className="tw-text-sm md:tw-text-base tw-font-medium tw-mb-0.5 tw-text-white/90">
                    Dropping Complete
                  </h2>
                  <p className="tw-text-xs tw-text-white/60 tw-mb-0">
                    Completed on{" "}
                    {new Date(participationPeriodMax).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
          {droppingTimeState !== WaveLeaderboardTimeState.COMPLETED ? (
            <div className="tw-grid tw-grid-cols-4 tw-gap-2">
              <div className="tw-@container tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-3 tw-py-1 md:tw-py-2 tw-rounded-lg tw-border tw-border-primary-300/10 tw-whitespace-nowrap">
                <span className="tw-text-base md:tw-text-xl [@container]:tw-text-xl [@container_(max-width:80px)]:tw-text-base tw-font-medium tw-text-white/90 tw-tracking-tight tw-inline-block tw-text-center">
                  {droppingTimeLeft.days}
                </span>
                <span className="tw-ml-1 tw-text-[10px] md:tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium">
                  {droppingTimeLeft.days === 1 ? "Day" : "Days"}
                </span>
              </div>
              <div className="tw-@container tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-3 tw-py-1 md:tw-py-2 tw-rounded-lg tw-border tw-border-primary-300/10 tw-whitespace-nowrap">
                <span className="tw-text-base md:tw-text-xl [@container]:tw-text-xl [@container_(max-width:80px)]:tw-text-base tw-font-medium tw-text-white/90 tw-tracking-tight tw-inline-block tw-text-center">
                  {droppingTimeLeft.hours}
                </span>
                <span className="tw-ml-1 tw-text-[10px] md:tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium">
                  {droppingTimeLeft.hours === 1 ? "Hr" : "Hrs"}
                </span>
              </div>
              <div className="tw-@container tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-3 tw-py-1 md:tw-py-2 tw-rounded-lg tw-border tw-border-primary-300/10 tw-whitespace-nowrap">
                <span className="tw-text-base md:tw-text-xl [@container]:tw-text-xl [@container_(max-width:80px)]:tw-text-base tw-font-medium tw-text-white/90 tw-tracking-tight tw-inline-block tw-text-center">
                  {droppingTimeLeft.minutes}
                </span>
                <span className="tw-ml-1 tw-text-[10px] md:tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium">
                  Min
                </span>
              </div>
              <div className="tw-@container tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-3 tw-py-1 md:tw-py-2 tw-rounded-lg tw-border tw-border-primary-300/10 tw-whitespace-nowrap">
                <span className="tw-text-base md:tw-text-xl [@container]:tw-text-xl [@container_(max-width:80px)]:tw-text-base tw-font-medium tw-text-white/90 tw-tracking-tight tw-inline-block tw-text-center">
                  {droppingTimeLeft.seconds}
                </span>
                <span className="tw-ml-1 tw-text-[10px] md:tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium">
                  Sec
                </span>
              </div>
            </div>
          ) : (
            <div className="tw-text-xs md:tw-text-sm tw-text-white/60 tw-bg-white/5 tw-rounded-lg tw-p-2 md:tw-p-3 tw-text-center">
              The dropping phase has ended
            </div>
          )}
        </div>

        {/* Voting Phase Card */}
        <div className="tw-rounded-xl tw-bg-gradient-to-br tw-from-[#1E1E2E]/80 tw-via-[#2E2E3E]/60 tw-to-[#3E2E3E]/40 tw-p-6 [@container_(max-width:800px)]:tw-p-4 tw-backdrop-blur-sm tw-border tw-border-[#3E2E3E]/20">
          <div className="tw-w-full tw-flex tw-items-center tw-gap-2 md:tw-gap-3 tw-mb-2 md:tw-mb-4">
            <div className="tw-flex-shrink-0 tw-size-6 md:tw-size-8 tw-rounded-lg tw-bg-gradient-to-br tw-from-violet-300/10 tw-to-violet-400/5 tw-flex tw-items-center tw-justify-center tw-ring-1 tw-ring-white/10">
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
            <div className="tw-w-full">
              {votingTimeState === WaveLeaderboardTimeState.UPCOMING && (
                <div className="tw-flex tw-justify-between tw-items-center tw-w-full md:tw-flex-col md:tw-items-start">
                  <h2 className="tw-text-sm md:tw-text-base tw-font-medium tw-mb-0.5 tw-text-white/90">
                    Voting Starts In
                  </h2>
                  <p className="tw-text-xs tw-text-white/60 tw-mb-0">
                    {new Date(votingPeriodMin).toLocaleDateString()}
                  </p>
                </div>
              )}
              {votingTimeState === WaveLeaderboardTimeState.IN_PROGRESS && (
                <div className="tw-flex tw-justify-between tw-items-center tw-w-full md:tw-flex-col md:tw-items-start">
                  <h2 className="tw-text-sm md:tw-text-base tw-font-medium tw-mb-0.5 tw-text-white/90">
                    Voting Ends In
                  </h2>
                  <p className="tw-text-xs tw-text-white/60 tw-mb-0">
                    {new Date(votingPeriodMax).toLocaleDateString()}
                  </p>
                </div>
              )}
              {votingTimeState === WaveLeaderboardTimeState.COMPLETED && (
                <div className="tw-flex tw-justify-between tw-items-center tw-w-full md:tw-flex-col md:tw-items-start">
                  <h2 className="tw-text-sm md:tw-text-base tw-font-medium tw-mb-0.5 tw-text-white/90">
                    Voting Complete
                  </h2>
                  <p className="tw-text-xs tw-text-white/60 tw-mb-0">
                    Completed on{" "}
                    {new Date(votingPeriodMax).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
          {votingTimeState !== WaveLeaderboardTimeState.COMPLETED ? (
            <div className="tw-grid tw-grid-cols-4 tw-gap-2">
              <div className="tw-@container tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-3 tw-py-1 md:tw-py-2 tw-rounded-lg tw-border tw-border-primary-300/10 tw-whitespace-nowrap">
                <span className="tw-text-base md:tw-text-xl [@container]:tw-text-xl [@container_(max-width:80px)]:tw-text-base tw-font-medium tw-text-white/90 tw-tracking-tight tw-inline-block tw-text-center">
                  {votingTimeLeft.days}
                </span>
                <span className="tw-ml-1 tw-text-[10px] md:tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium">
                  {votingTimeLeft.days === 1 ? "Day" : "Days"}
                </span>
              </div>
              <div className="tw-@container tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-3 tw-py-1 md:tw-py-2 tw-rounded-lg tw-border tw-border-primary-300/10 tw-whitespace-nowrap">
                <span className="tw-text-base md:tw-text-xl [@container]:tw-text-xl [@container_(max-width:80px)]:tw-text-base tw-font-medium tw-text-white/90 tw-tracking-tight tw-inline-block tw-text-center">
                  {votingTimeLeft.hours}
                </span>
                <span className="tw-ml-1 tw-text-[10px] md:tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium">
                  {votingTimeLeft.hours === 1 ? "Hr" : "Hrs"}
                </span>
              </div>
              <div className="tw-@container tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-3 tw-py-1 md:tw-py-2 tw-rounded-lg tw-border tw-border-primary-300/10 tw-whitespace-nowrap">
                <span className="tw-text-base md:tw-text-xl [@container]:tw-text-xl [@container_(max-width:80px)]:tw-text-base tw-font-medium tw-text-white/90 tw-tracking-tight tw-inline-block tw-text-center">
                  {votingTimeLeft.minutes}
                </span>
                <span className="tw-ml-1 tw-text-[10px] md:tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium">
                  Min
                </span>
              </div>
              <div className="tw-@container tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-3 tw-py-1 md:tw-py-2 tw-rounded-lg tw-border tw-border-primary-300/10 tw-whitespace-nowrap">
                <span className="tw-text-base md:tw-text-xl [@container]:tw-text-xl [@container_(max-width:80px)]:tw-text-base tw-font-medium tw-text-white/90 tw-tracking-tight tw-inline-block tw-text-center">
                  {votingTimeLeft.seconds}
                </span>
                <span className="tw-ml-1 tw-text-[10px] md:tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium">
                  Sec
                </span>
              </div>
            </div>
          ) : (
            <div className="tw-text-xs md:tw-text-sm tw-text-white/60 tw-bg-white/5 tw-rounded-lg tw-p-2 md:tw-p-3 tw-text-center">
              The voting phase has ended
            </div>
          )}
        </div>
      </div>

      {/* Multi-Decision Wave Section - Compact & Collapsible (only displayed for multi-decision waves) */}
      {isMultiDecisionWave && nextDecisionTime && (
        <div className="tw-mt-2">
          {/* Compact Decision Indicator */}
          <div className="tw-rounded-xl tw-bg-gradient-to-br tw-from-[#1E1E2E]/80 tw-via-[#2E2E3E]/60 tw-to-[#3E2E3E]/40 tw-px-4 tw-py-3 tw-backdrop-blur-sm tw-border tw-border-[#3E2E3E]/20">
            <div 
              className="tw-group tw-w-full tw-cursor-pointer" 
              onClick={() => setIsDecisionDetailsOpen(!isDecisionDetailsOpen)}
            >
              <div className="tw-flex tw-items-center tw-justify-between">
                <div className="tw-flex tw-items-center tw-gap-2">
                  {/* Icon based on wave type */}
                  <div className={`tw-flex-shrink-0 tw-size-7 tw-rounded-lg tw-bg-gradient-to-br ${
                    isRollingWave 
                      ? "tw-from-blue-300/10 tw-to-blue-400/5" 
                      : "tw-from-violet-300/10 tw-to-violet-400/5"
                  } tw-flex tw-items-center tw-justify-center tw-ring-1 tw-ring-white/10`}>
                    {isRollingWave ? (
                      <svg 
                        className="tw-w-3.5 tw-h-3.5 tw-text-blue-400 tw-flex-shrink-0" 
                        viewBox="0 0 24 24" 
                        fill="none"
                        aria-hidden="true"
                      >
                        <path 
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                          stroke="currentColor" 
                          strokeWidth="1.5" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="tw-w-3.5 tw-h-3.5 tw-text-violet-400/80 tw-flex-shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  
                  {/* Title and compact info */}
                  <div>
                    <p className="tw-text-sm tw-font-medium tw-text-white/90">
                      {isRollingWave 
                        ? `Rolling Wave (Cycle ${currentCycle})` 
                        : "Multi-Decision Wave"}
                    </p>
                    <div className="tw-flex tw-items-center tw-gap-1">
                      <span className="tw-text-xs tw-text-white/60">
                        Next decision in: 
                      </span>
                      <span className="tw-text-xs tw-text-white/90 tw-font-medium">
                        {nextDecisionTimeLeft.days > 0 && `${nextDecisionTimeLeft.days}d `}
                        {nextDecisionTimeLeft.hours}h {nextDecisionTimeLeft.minutes}m
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Expand/Collapse indicator */}
                <div className="tw-flex-shrink-0">
                  <svg 
                    className={`tw-w-4 tw-h-4 tw-text-white/60 tw-transition-transform tw-duration-300 ${isDecisionDetailsOpen ? 'tw-rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              {/* Timeline visualization - visible in both collapsed and expanded states */}
              <div className="tw-mt-3 tw-relative tw-h-1.5 tw-bg-white/10 tw-rounded-full tw-overflow-hidden">
                {upcomingDecisions.length > 0 && upcomingDecisions.map((decision, index) => (
                  <div 
                    key={decision.id}
                    className={`tw-absolute tw-top-0 tw-size-3 tw-rounded-full tw-transform tw--translate-x-1/2 tw--translate-y-1/4 ${
                      index === 0 ? 'tw-bg-primary-400' : 'tw-bg-white/30'
                    }`}
                    style={{ 
                      left: `${Math.min(100 * (index + 1) / (upcomingDecisions.length + 1), 100)}%`,
                      zIndex: upcomingDecisions.length - index 
                    }}
                    title={`${isRollingWave ? `Cycle ${Math.floor(decision.id / wave.wave.decisions_strategy!.subsequent_decisions.length) + 1}, ` : ''}Decision ${decision.id} - ${new Date(decision.timestamp).toLocaleDateString()}`}
                  />
                ))}
              </div>
            </div>
            
            {/* Expanded details */}
            {isDecisionDetailsOpen && (
              <div className="tw-mt-4 tw-pt-4 tw-border-t tw-border-white/10 tw-transition-all tw-duration-300">
                {/* Next Decision Details */}
                <div className="tw-mb-4">
                  <h3 className="tw-text-sm tw-font-medium tw-mb-2 tw-text-white/90">
                    Next Decision
                  </h3>
                  <div className="tw-flex tw-items-center tw-gap-2">
                    <div className="tw-size-6 tw-flex tw-items-center tw-justify-center tw-bg-primary-400/20 tw-rounded-full">
                      <span className="tw-text-xs tw-text-primary-400">1</span>
                    </div>
                    <div>
                      <p className="tw-text-sm tw-text-white/90">
                        {isRollingWave && upcomingDecisions.length > 0
                          ? `Cycle ${Math.floor(upcomingDecisions[0].id / wave.wave.decisions_strategy!.subsequent_decisions.length) + 1}, Decision ${(upcomingDecisions[0].id % wave.wave.decisions_strategy!.subsequent_decisions.length) || wave.wave.decisions_strategy!.subsequent_decisions.length}`
                          : upcomingDecisions.length > 0 ? `Decision ${upcomingDecisions[0].id}` : "Next Decision"}
                      </p>
                      <p className="tw-text-xs tw-text-white/60">
                        {new Date(nextDecisionTime).toLocaleDateString()} at {new Date(nextDecisionTime).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  
                  {/* Countdown */}
                  <div className="tw-grid tw-grid-cols-4 tw-gap-2 tw-mt-3">
                    <div className="tw-@container tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-3 tw-py-2 tw-rounded-lg tw-border tw-border-primary-300/10 tw-whitespace-nowrap">
                      <span className="tw-text-base md:tw-text-lg tw-font-medium tw-text-white/90 tw-tracking-tight tw-inline-block tw-text-center">
                        {nextDecisionTimeLeft.days}
                      </span>
                      <span className="tw-ml-1 tw-text-[10px] md:tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium">
                        {nextDecisionTimeLeft.days === 1 ? "Day" : "Days"}
                      </span>
                    </div>
                    <div className="tw-@container tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-3 tw-py-2 tw-rounded-lg tw-border tw-border-primary-300/10 tw-whitespace-nowrap">
                      <span className="tw-text-base md:tw-text-lg tw-font-medium tw-text-white/90 tw-tracking-tight tw-inline-block tw-text-center">
                        {nextDecisionTimeLeft.hours}
                      </span>
                      <span className="tw-ml-1 tw-text-[10px] md:tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium">
                        {nextDecisionTimeLeft.hours === 1 ? "Hr" : "Hrs"}
                      </span>
                    </div>
                    <div className="tw-@container tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-3 tw-py-2 tw-rounded-lg tw-border tw-border-primary-300/10 tw-whitespace-nowrap">
                      <span className="tw-text-base md:tw-text-lg tw-font-medium tw-text-white/90 tw-tracking-tight tw-inline-block tw-text-center">
                        {nextDecisionTimeLeft.minutes}
                      </span>
                      <span className="tw-ml-1 tw-text-[10px] md:tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium">
                        Min
                      </span>
                    </div>
                    <div className="tw-@container tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-3 tw-py-2 tw-rounded-lg tw-border tw-border-primary-300/10 tw-whitespace-nowrap">
                      <span className="tw-text-base md:tw-text-lg tw-font-medium tw-text-white/90 tw-tracking-tight tw-inline-block tw-text-center">
                        {nextDecisionTimeLeft.seconds}
                      </span>
                      <span className="tw-ml-1 tw-text-[10px] md:tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium">
                        Sec
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Upcoming Decisions */}
                {upcomingDecisions.length > 1 && (
                  <div>
                    <h3 className="tw-text-sm tw-font-medium tw-mb-2 tw-text-white/90">
                      Upcoming Decisions
                    </h3>
                    <div className="tw-space-y-2">
                      {upcomingDecisions.slice(1).map((decision, index) => (
                        <div 
                          key={decision.id} 
                          className="tw-flex tw-justify-between tw-items-center tw-bg-white/5 tw-p-3 tw-rounded-lg"
                        >
                          <div className="tw-flex tw-items-center tw-gap-2">
                            <div className="tw-size-6 tw-flex tw-items-center tw-justify-center tw-bg-white/10 tw-rounded-full">
                              <span className="tw-text-xs">{index + 2}</span>
                            </div>
                            <div>
                              <p className="tw-text-sm tw-text-white/90">
                                {isRollingWave 
                                  ? `Cycle ${Math.floor(decision.id / wave.wave.decisions_strategy!.subsequent_decisions.length) + 1}, Decision ${(decision.id % wave.wave.decisions_strategy!.subsequent_decisions.length) || wave.wave.decisions_strategy!.subsequent_decisions.length}`
                                  : `Decision ${decision.id}`}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="tw-text-xs tw-text-white/60">
                              {new Date(decision.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Explanation for rolling waves */}
                {isRollingWave && (
                  <div className="tw-mt-4 tw-p-3 tw-bg-blue-400/5 tw-rounded-lg tw-border tw-border-blue-400/10">
                    <div className="tw-flex tw-items-start tw-gap-2">
                      <svg 
                        className="tw-w-4 tw-h-4 tw-text-blue-400 tw-flex-shrink-0 tw-mt-0.5" 
                        viewBox="0 0 24 24" 
                        fill="none"
                      >
                        <path 
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                          stroke="currentColor" 
                          strokeWidth="1.5" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                      </svg>
                      <p className="tw-text-xs tw-text-white/70">
                        This is a <span className="tw-text-blue-400 tw-font-medium">rolling wave</span> that repeats in cycles until the end date. 
                        Winners are selected at each decision point, and new submissions can continue through each cycle.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};