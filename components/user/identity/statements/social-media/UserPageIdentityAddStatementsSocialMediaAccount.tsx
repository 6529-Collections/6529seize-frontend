import FacebookIcon from "../../../utils/icons/FacebookIcon";
import GithubIcon from "../../../utils/icons/GithubIcon";
import InstagramIcon from "../../../utils/icons/InstagramIcon";
import LinkedInIcon from "../../../utils/icons/LinkedInIcon";
import MediumIcon from "../../../utils/icons/MediumIcon";
import MirrorIcon from "../../../utils/icons/MirrorIcon";
import RedditIcon from "../../../utils/icons/RedditIcon";
import SubstackIcon from "../../../utils/icons/SubstackIcon";
import TikTokIcon from "../../../utils/icons/TikTokIcon";
import WeiboIcon from "../../../utils/icons/WeiboIcon";
import XIcon from "../../../utils/icons/XIcon";
import YoutubeIcon from "../../../utils/icons/YoutubeIcon";
import UserPageIdentityAddStatementsSocialMediaAccountHeader from "./UserPageIdentityAddStatementsSocialMediaAccountHeader";

export default function UserPageIdentityAddStatementsSocialMediaAccount({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <>
      <UserPageIdentityAddStatementsSocialMediaAccountHeader
        onClose={onClose}
      />

      {/*  Button group */}
      <div className="tw-mt-8">
        <span className="tw-isolate tw-inline-flex tw-rounded-md tw-shadow-sm tw-w-full">
          <button
            type="button"
            className="tw-bg-neutral-800 tw-relative -tw-ml-px tw-flex tw-items-center tw-justify-center tw-rounded-l-md tw-flex-1 tw-py-3 tw-text-sm tw-font-semibold tw-text-neutral-50 tw-border-none tw-ring-1 tw-ring-inset tw-ring-neutral-700 hover:tw-bg-neutral-800 tw-transition tw-duration-300 tw-ease-out tw-focus:tw-z-10"
          >
            <div className="tw-flex-shrink-0 tw-w-5 tw-h-5">
              <XIcon aria-hidden="true" />
            </div>
            <span className="tw-sr-only">X (Twitter)</span>
          </button>
          <button
            type="button"
            className="tw-relative -tw-ml-px tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-flex-1 tw-py-3 tw-text-sm tw-font-semibold tw-text-neutral-50 tw-border-none tw-ring-1 tw-ring-inset tw-ring-neutral-700 hover:tw-bg-neutral-800 tw-transition tw-duration-300 tw-ease-out tw-focus:tw-z-10"
          >
            <div className="tw-flex-shrink-0 tw-w-5 tw-h-5">
              <FacebookIcon aria-hidden="true" />
            </div>
            <span className="tw-sr-only">Facebook</span>
          </button>
          <button
            type="button"
            className="tw-relative -tw-ml-px tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-flex-1 tw-py-3 tw-text-sm tw-font-semibold tw-text-neutral-50 tw-border-none tw-ring-1 tw-ring-inset tw-ring-neutral-700 hover:tw-bg-neutral-800 tw-transition tw-duration-300 tw-ease-out tw-focus:tw-z-10"
          >
            <div className="tw-flex-shrink-0 tw-w-5 tw-h-5">
              <LinkedInIcon aria-hidden="true" />
            </div>
            <span className="tw-sr-only">LinkedIn</span>
          </button>
          <button
            type="button"
            className="tw-relative -tw-ml-px tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-flex-1 tw-py-3 tw-text-sm tw-font-semibold tw-text-neutral-50 tw-border-none tw-ring-1 tw-ring-inset tw-ring-neutral-700 hover:tw-bg-neutral-800 tw-transition tw-duration-300 tw-ease-out tw-focus:tw-z-10"
          >
            <div className="tw-flex-shrink-0 tw-w-5 tw-h-5">
              <InstagramIcon aria-hidden="true" />
            </div>
            <span className="tw-sr-only">Instagram</span>
          </button>
          <button
            type="button"
            className="tw-relative -tw-ml-px tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-flex-1 tw-py-3 tw-text-sm tw-font-semibold tw-text-neutral-50 tw-border-none tw-ring-1 tw-ring-inset tw-ring-neutral-700 hover:tw-bg-neutral-800 tw-transition tw-duration-300 tw-ease-out tw-focus:tw-z-10"
          >
            <div className="tw-flex-shrink-0 tw-w-5 tw-h-5">
              <TikTokIcon aria-hidden="true" />
            </div>
            <span className="tw-sr-only">Tik Tok</span>
          </button>
          <button
            type="button"
            className="tw-relative -tw-ml-px tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-flex-1 tw-py-3 tw-text-sm tw-font-semibold tw-text-neutral-50 tw-border-none tw-ring-1 tw-ring-inset tw-ring-neutral-700 hover:tw-bg-neutral-800 tw-transition tw-duration-300 tw-ease-out tw-focus:tw-z-10 tw-rounded-r-md"
          >
            <div className="tw-flex-shrink-0 tw-w-5 tw-h-5">
              <GithubIcon aria-hidden="true" />
            </div>
            <span className="tw-sr-only">Github</span>
          </button>
        </span>
        {/*  Button group */}
        <span className="tw-mt-2 tw-isolate tw-inline-flex tw-rounded-md tw-shadow-sm tw-w-full">
          <button
            type="button"
            className="tw-relative -tw-ml-px tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-flex-1 tw-py-3 tw-text-sm tw-font-semibold tw-text-neutral-50 tw-border-none tw-ring-1 tw-ring-inset tw-ring-neutral-700 hover:tw-bg-neutral-800 tw-transition tw-duration-300 tw-ease-out tw-focus:tw-z-10 tw-rounded-l-md"
          >
            <div className="tw-flex-shrink-0 tw-w-5 tw-h-5">
              <RedditIcon aria-hidden="true" />
            </div>
            <span className="tw-sr-only">Reddit</span>
          </button>
          <button
            type="button"
            className="tw-relative -tw-ml-px tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-flex-1 tw-py-3 tw-text-sm tw-font-semibold tw-text-neutral-50 tw-border-none tw-ring-1 tw-ring-inset tw-ring-neutral-700 hover:tw-bg-neutral-800 tw-transition tw-duration-300 tw-ease-out tw-focus:tw-z-10"
          >
            <div className="tw-flex-shrink-0 tw-w-5 tw-h-5">
              <WeiboIcon aria-hidden="true" />
            </div>
            <span className="tw-sr-only">Weibo</span>
          </button>
          <button
            type="button"
            className="tw-relative -tw-ml-px tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-flex-1 tw-py-3 tw-text-sm tw-font-semibold tw-text-neutral-50 tw-border-none tw-ring-1 tw-ring-inset tw-ring-neutral-700 hover:tw-bg-neutral-800 tw-transition tw-duration-300 tw-ease-out tw-focus:tw-z-10"
          >
            <div className="tw-flex-shrink-0 tw-w-5 tw-h-5">
              <SubstackIcon aria-hidden="true" />
            </div>
            <span className="tw-sr-only">Substack</span>
          </button>
          <button
            type="button"
            className="tw-relative -tw-ml-px tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-flex-1 tw-py-3 tw-text-sm tw-font-semibold tw-text-neutral-50 tw-border-none tw-ring-1 tw-ring-inset tw-ring-neutral-700 hover:tw-bg-neutral-800 tw-transition tw-duration-300 tw-ease-out tw-focus:tw-z-10"
          >
            <div className="tw-flex-shrink-0 tw-w-5 tw-h-5">
              <MediumIcon aria-hidden="true" />
            </div>
            <span className="tw-sr-only">Medium</span>
          </button>
          <button
            type="button"
            className="tw-relative -tw-ml-px tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-flex-1 tw-py-3 tw-text-sm tw-font-semibold tw-text-neutral-50 tw-border-none tw-ring-1 tw-ring-inset tw-ring-neutral-700 hover:tw-bg-neutral-800 tw-transition tw-duration-300 tw-ease-out tw-focus:tw-z-10"
          >
            <div className="tw-flex-shrink-0 tw-w-5 tw-h-5">
              <MirrorIcon aria-hidden="true" />
            </div>
            <span className="tw-sr-only">Mirror.xyz</span>
          </button>
          <button
            type="button"
            className="tw-relative -tw-ml-px tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-flex-1 tw-py-3 tw-text-sm tw-font-semibold tw-text-neutral-50 tw-border-none tw-ring-1 tw-ring-inset tw-ring-neutral-700 hover:tw-bg-neutral-800 tw-transition tw-duration-300 tw-ease-out tw-focus:tw-z-10 tw-rounded-r-md"
          >
            <div className="tw-flex-shrink-0 tw-w-5 tw-h-5">
              <YoutubeIcon aria-hidden="true" />
            </div>
            <span className="tw-sr-only">Youtube</span>
          </button>
        </span>
      </div>

      {/*  Input */}
      <div className="tw-mt-4">
        <form>
          <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-[#B0B0B0]">
            Twitter Account
          </label>
          <div className="tw-relative tw-mt-2">
            <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-left-0 tw-flex tw-items-center tw-pl-3">
              <div className="tw-h-5 tw-w-5 tw-flex tw-items-center tw-flex-shrink-0">
                <XIcon aria-hidden="true" />
              </div>
              {/*    <div className="tw-h-5 tw-w-5 tw-flex tw-items-center tw-flex-shrink-0">
                     <FacebookIcon aria-hidden="true" />
                    </div>
                    <div className="tw-h-5 tw-w-5 tw-flex tw-items-center tw-flex-shrink-0">
                    <LinkedInIcon aria-hidden="true" />
                    </div>
                    <div className="tw-h-5 tw-w-5 tw-flex tw-items-center tw-flex-shrink-0">
                    <InstagramIcon aria-hidden="true" />
                    </div>
                    <div className="tw-h-5 tw-w-5 tw-flex tw-items-center tw-flex-shrink-0">
                    <TikTokIcon aria-hidden="true" />
                    </div>
                    <div className="tw-h-5 tw-w-5 tw-flex tw-items-center tw-flex-shrink-0">
                    <GithubIcon aria-hidden="true" />
                    </div>
                    <div className="tw-h-5 tw-w-5 tw-flex tw-items-center tw-flex-shrink-0">
                    <RedditIcon aria-hidden="true" />
                    </div>
                    <div className="tw-h-5 tw-w-5 tw-flex tw-items-center tw-flex-shrink-0">
                    <WeiboIcon aria-hidden="true" />
                    </div>
                    <div className="tw-h-5 tw-w-5 tw-flex tw-items-center tw-flex-shrink-0">
                    <SubstackIcon aria-hidden="true" />
                    </div>
                    <div className="tw-h-5 tw-w-5 tw-flex tw-items-center tw-flex-shrink-0">
                    <MediumIcon aria-hidden="true" />
                    </div>
                    <div className="tw-h-5 tw-w-5 tw-flex tw-items-center tw-flex-shrink-0">
                    <MirrorIcon aria-hidden="true" />
                    </div>
                    <div className="tw-h-5 tw-w-5 tw-flex tw-items-center tw-flex-shrink-0">
                    <YoutubeIcon aria-hidden="true" />
                    </div> */}
            </div>
            <input
              type="text"
              required
              autoComplete="off"
              className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-pl-10 tw-pr-3 tw-bg-neutral-700/40 tw-text-white tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-white/5 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset hover:tw-ring-neutral-700 focus:tw-ring-primary-300 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
            />
          </div>
        </form>
      </div>

      <div className="tw-mt-8">
        <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-3">
          <button
            type="submit"
            className="tw-cursor-pointer tw-bg-neutral-900 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-neutral-600 tw-rounded-lg hover:tw-bg-neutral-800 hover:tw-border-neutral-700 tw-transition tw-duration-300 tw-ease-out"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
          >
            Save
          </button>
        </div>
      </div>
    </>
  );
}
