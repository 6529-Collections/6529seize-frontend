import { faExternalLink } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export function MetadataLink(props: { readonly url: string }) {
  if (!props.url.trim()) {
    return null;
  }

  return (
    <tr>
      <td>Metadata</td>
      <td>
        <a
          href={props.url}
          target="_blank"
          rel="noopener noreferrer"
          className="d-inline-flex align-items-center gap-1"
        >
          <span>View</span>
          <FontAwesomeIcon
            icon={faExternalLink}
            style={{ fontSize: "0.8em" }}
          />
        </a>
      </td>
    </tr>
  );
}
