import { assertUnreachable } from "../../../../helpers/AllowlistToolHelpers";
import { STATEMENT_TYPE } from "../../../../helpers/Types";
import DiscordIcon from "./DiscordIcon";
import EmailIcon from "./EmailIcon";
import PhoneIcon from "./PhoneIcon";
import TelegramIcon from "./TelegramIcon";
import WeChatIcon from "./WeChatIcon";
import WebsiteIcon from "./WebsiteIcon";

export default function SocialStatementIcon({
  statementType,
}: {
  statementType: STATEMENT_TYPE;
}) {
  switch (statementType) {
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
    default:
      assertUnreachable(statementType);
  }
}
