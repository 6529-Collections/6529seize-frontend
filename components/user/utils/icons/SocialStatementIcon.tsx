import { assertUnreachable } from "../../../../helpers/AllowlistToolHelpers";
import { STATEMENT_TYPE } from "../../../../helpers/Types";
import DiscordIcon from "./DiscordIcon";
import EmailIcon from "./EmailIcon";
import FacebookIcon from "./FacebookIcon";
import LinkedInIcon from "./LinkedInIcon";
import PhoneIcon from "./PhoneIcon";
import TelegramIcon from "./TelegramIcon";
import WeChatIcon from "./WeChatIcon";
import WebsiteIcon from "./WebsiteIcon";
import XIcon from "./XIcon";
import TikTokIcon from "./TikTokIcon";
import GithubIcon from "./GithubIcon";
import RedditIcon from "./RedditIcon";
import InstagramIcon from "./InstagramIcon";
import WeiboIcon from "./WeiboIcon";
import SubstackIcon from "./SubstackIcon";
import MediumIcon from "./MediumIcon";
import MirrorIcon from "./MirrorIcon";
import YoutubeIcon from "./YoutubeIcon";
import LinkIcon from "./LinkIcon";

export default function SocialStatementIcon({
  statementType,
}: {
  readonly statementType: STATEMENT_TYPE;
}) {
  switch (statementType) {
    case STATEMENT_TYPE.X:
      return <XIcon aria-hidden="true" />;
    case STATEMENT_TYPE.FACEBOOK:
      return <FacebookIcon aria-hidden="true" />;
    case STATEMENT_TYPE.LINKED_IN:
      return <LinkedInIcon aria-hidden="true" />;
    case STATEMENT_TYPE.INSTAGRAM:
      return <InstagramIcon aria-hidden="true" />;
    case STATEMENT_TYPE.TIK_TOK:
      return <TikTokIcon aria-hidden="true" />;
    case STATEMENT_TYPE.GITHUB:
      return <GithubIcon aria-hidden="true" />;
    case STATEMENT_TYPE.REDDIT:
      return <RedditIcon aria-hidden="true" />;
    case STATEMENT_TYPE.WEIBO:
      return <WeiboIcon aria-hidden="true" />;
    case STATEMENT_TYPE.SUBSTACK:
      return <SubstackIcon aria-hidden="true" />;
    case STATEMENT_TYPE.MEDIUM:
      return <MediumIcon aria-hidden="true" />;
    case STATEMENT_TYPE.MIRROR_XYZ:
      return <MirrorIcon aria-hidden="true" />;
    case STATEMENT_TYPE.YOUTUBE:
      return <YoutubeIcon aria-hidden="true" />;
    case STATEMENT_TYPE.DISCORD:
      return <DiscordIcon aria-hidden="true" />;
    case STATEMENT_TYPE.TELEGRAM:
      return <TelegramIcon aria-hidden="true" />;
    case STATEMENT_TYPE.WECHAT:
      return <WeChatIcon aria-hidden="true" />;
    case STATEMENT_TYPE.PHONE:
      return <PhoneIcon aria-hidden="true" />;
    case STATEMENT_TYPE.EMAIL:
      return <EmailIcon aria-hidden="true" />;
    case STATEMENT_TYPE.WEBSITE:
      return <WebsiteIcon aria-hidden="true" />;
    case STATEMENT_TYPE.LINK:
      return <LinkIcon aria-hidden="true" />;
    default:
      assertUnreachable(statementType);
  }
}
