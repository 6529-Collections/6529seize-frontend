import React from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { getScaledImageUri, ImageScale } from "../../../../helpers/image.helpers";

interface WaveWinnerProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const WaveWinner: React.FC<WaveWinnerProps> = ({ wave, onDropClick }) => {
  return (
    <div className="tw-space-y-4">
      {/* Winner Card */}
      <div className="tw-bg-iron-800/50 tw-rounded-xl tw-overflow-hidden">
        <div className="tw-bg-primary-500/10 tw-px-6 tw-py-4 tw-border-b tw-border-primary-500/20">
          <h2 className="tw-text-xl tw-font-semibold tw-text-primary-400">
            Wave Winner
          </h2>
        </div>

        <div className="tw-p-6">
          <div className="tw-flex tw-items-start tw-gap-6">
            <div className="tw-flex-shrink-0">
              <img
                src={getScaledImageUri(wave.author.pfp, ImageScale.W_200_H_200)}
                alt={`${wave.author.handle}'s avatar`}
                className="tw-w-20 tw-h-20 tw-rounded-lg tw-border-2 tw-border-primary-500 tw-object-cover"
              />
            </div>

            <div className="tw-flex-1">
              <div className="tw-flex tw-items-center tw-gap-3 tw-mb-3">
                <h3 className="tw-text-2xl tw-font-bold tw-text-primary-400">
                  {wave.author.handle}
                </h3>
                <div className="tw-px-3 tw-py-1 tw-bg-primary-500/20 tw-rounded-full">
                  <span className="tw-text-primary-400 tw-text-sm tw-font-medium">
                    1234 votes
                  </span>
                </div>
              </div>

              <div className="tw-bg-iron-900/50 tw-rounded-lg tw-p-4">
                <p className="tw-text-iron-300 tw-text-sm tw-leading-relaxed">
                  This is a hardcoded winner submission content. We'll replace this with real data later.
                </p>
                <div className="tw-mt-3 tw-flex tw-items-center tw-gap-4">
                  <button 
                    className="tw-text-primary-400 tw-text-sm hover:tw-text-primary-300 tw-transition-colors"
                  >
                    View Full Submission
                  </button>
                  <span className="tw-text-iron-600">•</span>
                  <span className="tw-text-iron-500 tw-text-sm">
                    Posted 2 days ago
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="tw-bg-iron-800/50 tw-rounded-xl tw-overflow-hidden">
        <div className="tw-px-6 tw-py-4 tw-border-b tw-border-iron-700">
          <h3 className="tw-text-lg tw-font-semibold tw-text-iron-300">
            Wave Summary
          </h3>
        </div>

        <div className="tw-p-6">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div className="tw-text-iron-300">
              <span className="tw-text-primary-400 tw-font-medium">
                {wave.metrics.drops_count}
              </span> participants contributed to "{wave.wave.name}"
            </div>
            <div className="tw-flex tw-items-center tw-gap-3">
              <button className="tw-px-4 tw-py-2 tw-bg-primary-500/20 tw-rounded-lg tw-text-primary-400 hover:tw-bg-primary-500/30 tw-transition-colors tw-flex tw-items-center tw-gap-2">
                <svg className="tw-w-4 tw-h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                </svg>
                Share Results
              </button>
              <button 
                className="tw-px-4 tw-py-2 tw-bg-iron-700/50 tw-rounded-lg tw-text-iron-300 hover:tw-bg-iron-700/70 tw-transition-colors"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 