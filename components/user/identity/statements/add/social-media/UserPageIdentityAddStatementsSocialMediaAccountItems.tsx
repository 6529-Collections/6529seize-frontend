import {
  SOCIAL_MEDIA_ACCOUNT_STATEMENT_TYPE,
  SOCIAL_MEDIA_ACCOUNT_STATEMENT_TYPES,
} from "../../../../../../helpers/Types";
import FacebookIcon from "../../../../utils/icons/FacebookIcon";
import GithubIcon from "../../../../utils/icons/GithubIcon";
import InstagramIcon from "../../../../utils/icons/InstagramIcon";
import LinkedInIcon from "../../../../utils/icons/LinkedInIcon";
import MediumIcon from "../../../../utils/icons/MediumIcon";
import MirrorIcon from "../../../../utils/icons/MirrorIcon";
import RedditIcon from "../../../../utils/icons/RedditIcon";
import SubstackIcon from "../../../../utils/icons/SubstackIcon";
import TikTokIcon from "../../../../utils/icons/TikTokIcon";
import WeiboIcon from "../../../../utils/icons/WeiboIcon";
import XIcon from "../../../../utils/icons/XIcon";
import YoutubeIcon from "../../../../utils/icons/YoutubeIcon";
import UserPageIdentityAddStatementsTypeButton from "../../utils/UserPageIdentityAddStatementsTypeButton";

export default function UserPageIdentityAddStatementsSocialMediaAccountItems({
  activeType,
  setSocialType,
}: {
  activeType: SOCIAL_MEDIA_ACCOUNT_STATEMENT_TYPE;
  setSocialType: (type: SOCIAL_MEDIA_ACCOUNT_STATEMENT_TYPE) => void;
}) {
  const firstRow = SOCIAL_MEDIA_ACCOUNT_STATEMENT_TYPES.slice(
    0,
    +(SOCIAL_MEDIA_ACCOUNT_STATEMENT_TYPES.length / 2).toFixed(0)
  );

  const secondRow = SOCIAL_MEDIA_ACCOUNT_STATEMENT_TYPES.slice(
    +(SOCIAL_MEDIA_ACCOUNT_STATEMENT_TYPES.length / 2).toFixed(0)
  );
  return (
    <div className="tw-mt-8">
      <span className="tw-isolate tw-inline-flex tw-rounded-md tw-shadow-sm tw-w-full">
        {firstRow.map((type, i) => (
          <UserPageIdentityAddStatementsTypeButton
            key={type}
            statementType={type}
            isActive={activeType === type}
            isFirst={i === 0}
            isLast={i === firstRow.length - 1}
            onClick={() => setSocialType(type)}
          />
        ))}
      </span>
      <span className="tw-mt-3 md:tw-mt-2 tw-isolate tw-inline-flex tw-rounded-md tw-shadow-sm tw-w-full">
        {secondRow.map((type, i) => (
          <UserPageIdentityAddStatementsTypeButton
            key={type}
            statementType={type}
            isActive={activeType === type}
            isFirst={i === 0}
            isLast={i === secondRow.length - 1}
            onClick={() => setSocialType(type)}
          />
        ))}
      </span>
    </div>
  );
}
