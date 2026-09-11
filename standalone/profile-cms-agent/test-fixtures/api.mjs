// Test-only preload. It replaces fetch before the real executable starts.
let submissions = 0;
globalThis.fetch = async (url, init) => {
  const expected = "https://api.6529.io/api/profile-cms/agent-session/";
  if (!String(url).startsWith(expected)) throw new Error("Unexpected origin");
  if (process.env.CMS_ADAPTER_TEST_MODE === "pending") {
    return new Promise((_resolve, reject) =>
      init.signal.addEventListener(
        "abort",
        () => reject(new Error("cancelled")),
        { once: true }
      )
    );
  }
  const path = String(url).slice(expected.length);
  const body = init.body ? JSON.parse(init.body) : null;
  if (path === "proposals") submissions++;
  const data =
    path === "draft"
      ? {
          grant: {
            draft_id: "draft-1",
            base_version: 1,
            base_package_hash: `sha256:${"b".repeat(64)}`,
          },
          cms_package: {
            schema: "6529.cms.package.v1",
            site: { title: "Café — Studio" },
          },
          proposal_schema: "6529.cms.agent_candidate.v1",
        }
      : {
          id: "22222222-2222-4222-8222-222222222222",
          status: "pending",
          received: body,
          submissions,
          authorizationPresent:
            init.headers.Authorization ===
            `Bearer ${process.env.CMS_AGENT_TOKEN}`,
          redirect: init.redirect,
        };
  return new Response(JSON.stringify(data), { status: 200 });
};
