import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  ConsolidatedTDH,
  TDH,
  TDHBoostBreakdown,
} from "../../../entities/ITDH";
import { getRandomObjectId } from "../../../helpers/AllowlistToolHelpers";
import Tippy from "@tippyjs/react";

export default function UserPageStatsBoostBreakdown({
  tdh,
}: {
  readonly tdh: ConsolidatedTDH | TDH | undefined;
}) {
  if (!tdh?.boost_breakdown || !tdh.boost) {
    return <></>;
  }

  function getMemeRow(name: string, breakdown: TDHBoostBreakdown | undefined) {
    return (
      <tr key={getRandomObjectId()}>
        <td className="tw-px-8 sm:tw-px-10 lg:tw-pr-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400">
          {name}
        </td>
        <td className="tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-md tw-font-medium tw-text-white-400 tw-text-center">
          {breakdown?.available ? (
            <span className="d-flex align-items-center justify-content-center gap-2">
              {breakdown.available.toFixed(2)}
              <BoostBreakdownInfo info={breakdown.available_info} />
            </span>
          ) : (
            "-"
          )}
        </td>
        <td className="tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-md tw-font-medium tw-text-white-400 tw-text-center">
          {breakdown?.acquired ? (
            <span className="d-flex align-items-center justify-content-center gap-2">
              {breakdown.acquired.toFixed(2)}
              <BoostBreakdownInfo info={breakdown.acquired_info} />
            </span>
          ) : (
            "-"
          )}
        </td>
      </tr>
    );
  }

  function getMemesRows() {
    let rows = [];
    rows.push(
      <tr key={getRandomObjectId()}>
        <td className="tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-whitespace-nowrap tw-group tw-pt-3 tw-text-sm sm:tw-text-md tw-font-medium tw-text-white-400">
          Memes
        </td>
      </tr>
    );
    if (tdh?.boost_breakdown) {
      rows.push(
        getMemeRow("Full Collection Set", tdh.boost_breakdown?.memes_card_sets)
      );
      if (tdh.boost_breakdown?.memes_card_sets?.acquired === 0) {
        rows.push(getMemeRow("SZN1", tdh.boost_breakdown?.memes_szn1));
        if (!tdh.boost_breakdown?.memes_szn1?.acquired) {
          rows.push(
            getMemeRow("Genesis Set", tdh.boost_breakdown?.memes_genesis)
          );
          rows.push(
            getMemeRow("Nakamoto", tdh.boost_breakdown?.memes_nakamoto)
          );
        }
        rows.push(getMemeRow("SZN2", tdh.boost_breakdown?.memes_szn2));
        rows.push(getMemeRow("SZN3", tdh.boost_breakdown?.memes_szn3));
        rows.push(getMemeRow("SZN4", tdh.boost_breakdown?.memes_szn4));
        rows.push(getMemeRow("SZN5", tdh.boost_breakdown?.memes_szn5));
        rows.push(getMemeRow("SZN6", tdh.boost_breakdown?.memes_szn6));
        rows.push(getMemeRow("SZN7", tdh.boost_breakdown?.memes_szn7));
      }
    }

    return rows;
  }

  function getBaseBoostRow(name: string, breakdown?: TDHBoostBreakdown) {
    if (breakdown) {
      return (
        <tr key={getRandomObjectId()}>
          <td className="tw-border-t tw-border-x-0 tw-border-b-0 tw-border-solid tw-border-iron-800 tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-md tw-font-medium tw-text-white-400">
            {name}
          </td>
          <td className="tw-border-t tw-border-x-0 tw-border-b-0 tw-border-solid tw-border-iron-800 tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-md tw-font-medium tw-text-white-400 tw-text-center">
            {breakdown.available ? (
              <span className="d-flex align-items-center justify-content-center gap-2">
                {breakdown.available.toFixed(2)}
                <BoostBreakdownInfo info={breakdown.available_info} />
              </span>
            ) : (
              "-"
            )}
          </td>
          <td className="tw-border-t tw-border-x-0 tw-border-b-0 tw-border-solid tw-border-iron-800 tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-md tw-font-medium tw-text-white-400 tw-text-center">
            {breakdown.acquired ? (
              <span className="d-flex align-items-center justify-content-center gap-2">
                {breakdown.acquired.toFixed(2)}
                <BoostBreakdownInfo info={breakdown.acquired_info} />
              </span>
            ) : (
              "-"
            )}
          </td>
        </tr>
      );
    }

    return <></>;
  }

  return (
    <div className="tw-mt-6 lg:tw-mt-8">
      <div className="tw-flex tw-items-center tw-justify-between">
        <h3 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50">
          Boost Breakdown
        </h3>
        <span>
          <a
            href="/community-metrics#tdh-1.3"
            className="decoration-hover-underline tw-text-sm">
            TDH Version: 1.3
          </a>
        </span>
      </div>
      <div className="tw-mt-2 lg:tw-mt-4 tw-bg-iron-950 tw-border tw-border-iron-700 tw-border-solid tw-rounded-lg tw-overflow-x-auto">
        <div className="tw-flow-root">
          <div className="tw-inline-block tw-min-w-full tw-align-middle">
            <table className="tw-min-w-full">
              <thead className="tw-bg-iron-900 tw-border-b tw-border-iron-700 tw-border-x-0 tw-border-t-0">
                <tr key={getRandomObjectId()}>
                  <th
                    scope="col"
                    className="tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400">
                    Type
                  </th>
                  <th
                    scope="col"
                    className="tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400  tw-text-center">
                    Potential Boost
                  </th>
                  <th
                    scope="col"
                    className="tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400 tw-text-center">
                    Actual Boost
                  </th>
                </tr>
              </thead>
              <tbody>
                {tdh?.boost_breakdown && (
                  <>
                    {getMemesRows()}
                    {getBaseBoostRow(
                      "Gradients",
                      tdh?.boost_breakdown.gradients
                    )}
                    <tr key={getRandomObjectId()}>
                      <td className="tw-border-t tw-border-x-0 tw-border-b-0 tw-border-solid tw-border-iron-700 tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-md tw-font-semibold tw-text-white-400">
                        TOTAL BOOST
                      </td>
                      <td className="tw-border-t tw-border-x-0 tw-border-b-0 tw-border-solid tw-border-iron-700 tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-md tw-font-medium tw-text-white-400 tw-text-center">
                        {tdh?.boost ? (
                          <span className="d-flex align-items-center justify-content-center gap-2">
                            {(
                              tdh.boost_breakdown.memes_card_sets.available +
                              tdh.boost_breakdown.gradients.available
                            ).toFixed(2)}
                            <BoostBreakdownInfo
                              info={["Total Potential Boost"]}
                            />
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="tw-border-t tw-border-x-0 tw-border-b-0 tw-border-solid tw-border-iron-700 tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-md tw-font-medium tw-text-white-400 tw-text-center">
                        {tdh?.boost ? (
                          <span className="d-flex align-items-center justify-content-center gap-2">
                            {(Math.round((tdh.boost - 1) * 100) / 100).toFixed(
                              2
                            )}
                            <BoostBreakdownInfo info={["Total Actual Boost"]} />
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function BoostBreakdownInfo({ info }: { readonly info: string[] }) {
  if (!info || info.length === 0) {
    return <></>;
  }

  return (
    <Tippy
      content={
        info.length > 1 ? (
          <ul
            className="mb-0"
            style={{ paddingLeft: "1rem", textAlign: "left" }}>
            {info.map((i) => (
              <li key={getRandomObjectId()} className="text-left">
                {i}
              </li>
            ))}
          </ul>
        ) : (
          info[0]
        )
      }
      interactive={true}>
      <FontAwesomeIcon
        icon="info-circle"
        height={16}
        color="lightgrey"
        cursor={"pointer"}></FontAwesomeIcon>
    </Tippy>
  );
}
