# 6529 website agent adapter

This local MCP adapter lets your chosen agent read one saved website draft,
validate a complete proposed revision, submit it for your review and read its
status. It cannot save website revisions, add media, upload to permanent storage,
sign, publish, unpublish or change a profile. Your agent service provides the
inference; this adapter makes no model calls.

## File exchange

In the website editor, download the agent kit for the document you want to edit.
Give that JSON file and your request to an agent that can work with files. The
kit contains the complete website, schemas and editing instructions. It contains
no access credential. The agent returns a `6529.cms.agent_file_proposal.v1` JSON
file containing `base_package_hash`, the complete `candidate_package` and a short
`summary`. Import it in the editor, review every change and preview the pages,
then apply. Save and publish remain your actions.

## Connect a local MCP client

Extract the complete adapter ZIP into one folder. Use Node.js 22 or newer. The
files run directly: no package installation, build command or local web server
is needed. This release supports MCP **2025-11-25**; use a client that supports
that revision. It does not claim support for newer protocol revisions.

Create agent access for a selected saved draft in the website editor. Set the
following in your MCP client's private environment configuration:

| Variable                    | Value                                                               |
| --------------------------- | ------------------------------------------------------------------- |
| `CMS_AGENT_TOKEN`           | The newly issued draft access token; never your website login token |
| `CMS_AGENT_ENV`             | `production` (default), or `staging`                                |
| `CMS_AGENT_STAGING_API_KEY` | Only for authorized staging users; the separate staging gateway key |

The adapter sends credentials only to the corresponding fixed first-party API.
It rejects redirects. Never put tokens in prompts, website files, source
control, command arguments or shared client configuration examples. Grant
revocation or expiry stops future reads and submissions.

### Codex

Add a local MCP entry to your Codex configuration, replacing the script path
with the absolute path to the extracted `main.mjs`:

```toml
[mcp_servers.website_6529]
command = "node"
args = ["/absolute/path/to/6529-cms-agent/main.mjs"]
env_vars = ["CMS_AGENT_TOKEN"]
tool_timeout_sec = 40
```

`env_vars` forwards the named variable from the environment that launches Codex.
For staging, also forward `CMS_AGENT_ENV` and `CMS_AGENT_STAGING_API_KEY`. Use
your client or operating system's private environment settings. See the
[official Codex MCP configuration documentation](https://learn.chatgpt.com/docs/extend/mcp?surface=cli).

### Claude Desktop and compatible clients

In Claude Desktop's Developer settings, use Edit Config and add this entry
alongside existing servers. Replace the path and configure the token in the
client's private `env` settings. The placeholder below is not a credential:

```json
{
  "mcpServers": {
    "website_6529": {
      "command": "node",
      "args": ["/absolute/path/to/6529-cms-agent/main.mjs"],
      "env": { "CMS_AGENT_TOKEN": "SET_PRIVATELY_IN_CLIENT_SETTINGS" }
    }
  }
}
```

Restart the client after configuration. Follow its
[local server setup instructions](https://modelcontextprotocol.io/docs/develop/connect-local-servers).
Local stdio connections are separate from hosted web connectors. A client that
cannot launch a local process can use file exchange instead.

## Tools and retry behavior

1. `cms_read_draft`: read the exact saved base and current server constraints.
2. `cms_read_schema`: read the bundled full package schema and file contract.
3. `cms_validate_candidate`: validate a complete candidate using the exact
   draft ID, base version and base hash returned by the first tool.
4. `cms_submit_proposal`: submit that candidate with a summary and one UUID
   `idempotency_key`. Retain the exact request and key on every retry, including
   after a timeout or client restart. A timeout does not prove submission failed.
5. `cms_get_proposal`: read a proposal from this grant. Use the API's disposition;
   submission does not mean acceptance, and applied does not mean published.

There is no background polling or automatic retry. Requests have a 30-second
deadline, a 1 MiB body limit, depth 32 and 50,000 JSON nodes. Responses are
limited to 2 MiB. Keep the ordered asset catalog and identity fields unchanged;
add new media in the visual editor and create a fresh base for the agent.

The adapter writes only JSON-RPC to stdout. Startup failures use a short generic
stderr message, without credentials or website content. No telemetry is sent.

## Maintainers

From the repository root, run `seize exec node
standalone/profile-cms-agent/build.mjs` to regenerate the deterministic public
download. Append `--check` to verify it without writing. Run the adjacent Node
tests through `seize exec node --test standalone/profile-cms-agent/*.test.mjs`.
The package schema is copied from the CMS V1 protocol source; never edit a
generated public copy by hand.
