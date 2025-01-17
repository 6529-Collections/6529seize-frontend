import React, { useState, useEffect } from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { Time } from "../../../../helpers/time";

interface WaveLeaderboardTimeProps {
  readonly wave: ApiWave;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
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
  const participationPeriodMin =
    wave.participation.period?.min ?? Time.currentMillis();
  const participationPeriodMax =
    wave.participation.period?.max ?? Time.currentMillis();
  const votingPeriodMin = wave.voting.period?.min ?? Time.currentMillis();
  const votingPeriodMax = wave.voting.period?.max ?? Time.currentMillis();

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

  return (
    <div className="tw-@container">
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
    </div>
  );
};
