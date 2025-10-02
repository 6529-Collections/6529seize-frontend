import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import { STATEMENT_TYPE } from "@/helpers/Types";
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
import BioIcon from "./BioIcon";
import SuperRareIcon from "./SuperRareIcon";
import FoundationIcon from "./FoundationIcon";
import MakersPlaceIcon from "./MakersPlaceIcon";
import KnownOriginIcon from "./KnownOriginIcon";
import PepeWTFIcon from "./PepeWTFIcon";
import OpenseaIcon from "./OpenseaIcon";
import ArtBlocksIcon from "./ArtBlocksIcon";
import DecaArtIcon from "./DecaArtIcon";
import OnCyberIcon from "./OnCyberIcon";
import TheLineIcon from "./TheLineIcon";

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
    case STATEMENT_TYPE.BIO:
      return <BioIcon aria-hidden="true" />;
    case STATEMENT_TYPE.SUPER_RARE:
      return <SuperRareIcon aria-hidden="true" />;
    case STATEMENT_TYPE.FOUNDATION:
      return <FoundationIcon aria-hidden="true" />;
    case STATEMENT_TYPE.MAKERS_PLACE:
      return <MakersPlaceIcon aria-hidden="true" />;
    case STATEMENT_TYPE.KNOWN_ORIGIN:
      return <KnownOriginIcon aria-hidden="true" />;
    case STATEMENT_TYPE.PEPE_WTF:
      return <PepeWTFIcon aria-hidden="true" />;
    case STATEMENT_TYPE.OPENSEA:
      return <OpenseaIcon aria-hidden="true" />;
    case STATEMENT_TYPE.ART_BLOCKS:
      return <ArtBlocksIcon aria-hidden="true" />;
    case STATEMENT_TYPE.DECA_ART:
      return <DecaArtIcon aria-hidden="true" />;
    case STATEMENT_TYPE.ON_CYBER:
      return <OnCyberIcon aria-hidden="true" />;
    case STATEMENT_TYPE.THE_LINE:
      return <TheLineIcon aria-hidden="true" />;
    default:
      assertUnreachable(statementType);
  }
}
