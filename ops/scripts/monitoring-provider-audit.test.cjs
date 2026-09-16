const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const vm = require('node:vm');

const workflow = readFileSync('.github/workflows/monitoring-provider-audit.yml', 'utf8');
const block = /node --input-type=module <<'NODE'\r?\n([\s\S]*?)^\s{10}NODE\s*$/m.exec(workflow);
assert.ok(block, 'actual inline workflow program must be present');
const original = block[1].replace(/^ {10}/gm, '');
const prodPin = '6d1f55bab91567b4efe26df867b8e9d72172b02e29b9534175bb5cae8c40b5a8';
const fixtureUrl = 'https://collector.example.test/sentry';
const fixturePin = createHash('sha256').update(fixtureUrl).digest('hex');
assert.equal(original.split(prodPin).length, 2, 'only the trusted pin is substituted by a synthetic test destination');
const program = original.replace(prodPin, fixturePin)
  .replace(/^import \{ appendFileSync \} from 'node:fs';\r?\n/m, '')
  .replace(/^import \{ createHash \} from 'node:crypto';\r?\n/m, '');
const API = 'https://sentry.io/api/0/';
const P = {
  backProject: 'projects/seize-ff/seize-backend/',
  workflows: 'organizations/seize-ff/workflows/?project=6529-frontend&project=seize-backend&per_page=100',
  workflow: 'organizations/seize-ff/workflows/100/', detector: 'organizations/seize-ff/detectors/200/',
  identity: '', project: 'projects/seize-ff/6529-frontend/', projects: 'organizations/seize-ff/projects/',
  uptime: 'organizations/seize-ff/uptime/', crons: 'organizations/seize-ff/monitors/',
  rules: 'projects/seize-ff/6529-frontend/rules/', apps: 'organizations/seize-ff/sentry-apps/',
  installs: 'organizations/seize-ff/sentry-app-installations/', back: 'projects/seize-ff/seize-backend/rules/',
};
const PRIVATE = 'PRIVATE_CANARY_customer@example.test';
const app = () => ({
  uuid: 'app-uuid', slug: 'synthetic-app', isDisabled: false, isAlertable: true, status: 'internal',
  verifyInstall: true, webhookUrl: fixtureUrl, webhookEvents: ['event.alert'],
  name: PRIVATE, clientSecret: PRIVATE, webhookHeaders: [{ name: PRIVATE, value: PRIVATE }],
});
const rule = () => ({
  id: '42', status: 'active', snooze: false, frequency: 30, environment: 'prod', actionMatch: 'all', filterMatch: 'all',
  conditions: [{ id: 'sentry.rules.conditions.first_seen_event.FirstSeenEventCondition', name: PRIVATE }],
  filters: [{ id: 'sentry.rules.filters.level.LevelFilter', level: '40', match: 'gte', name: PRIVATE }],
  actions: [{ id: 'sentry.rules.actions.notify_event_service.NotifyEventServiceAction', service: 'synthetic-app' }],
  name: PRIVATE,
});
const terminal = route => '<' + API + route + (route.includes('?') ? '&' : '?') + 'cursor=0:0:0>; rel="next"; results="false"; cursor="0:0:0"';
const currentWorkflow = () => ({
  id: '100', name: PRIVATE, enabled: true, environment: null, config: { frequency: 30 },
  dateUpdated: '2026-09-15T00:00:00Z', detectorIds: ['200'],
  triggers: { logicType: 'any-short', conditions: [
    { id: '11', type: 'new_high_priority_issue', comparison: true, conditionResult: true },
    { id: '12', type: 'existing_high_priority_issue', comparison: true, conditionResult: true },
  ], actions: [] },
  actionFilters: [{ logicType: 'all', conditions: [], actions: [{ id: '13', type: 'email', integrationId: null,
    config: { targetType: 'issue_owners', targetIdentifier: null, targetDisplay: PRIVATE },
    data: { fallthroughType: 'ActiveMembers' }, status: 'active' }] }],
});
function setWorkflow(rows, change) {
  const item = currentWorkflow(); change(item);
  rows.set(P.workflows, { data: [item] }); rows.set(P.workflow, { data: item });
}
function fixtures() {
  return new Map([
    [P.workflows, { data: [currentWorkflow()] }], [P.workflow, { data: currentWorkflow() }],
    [P.detector, { data: { id: '200', projectId: '1', workflowIds: ['100'], enabled: true, type: 'error',
      conditionGroup: null, config: {}, dataSources: [], latestGroup: { title: PRIVATE } } }],
    [P.identity, { data: { auth: { scopes: ['org:read', 'project:read'] } } }],
    [P.project, { data: { id: '1', name: PRIVATE, access: ['project:read'] } }],
    [P.backProject, { data: { id: '2', name: PRIVATE, access: ['project:read'] } }],
    [P.projects, { data: [{ id: '1', slug: '6529-frontend' }, { id: '2', slug: 'seize-backend' }, { slug: PRIVATE }] }],
    [P.uptime, { data: [] }], [P.crons, { data: [] }],
    [P.rules, { data: [rule()] }], [P.back, { data: [rule()] }],
    [P.apps, { data: [app()] }],
    [P.installs, { data: [{ uuid: 'install-uuid', app: { uuid: 'app-uuid' }, status: 'installed' }] }],
  ]);
}
async function execute(options = {}) {
  const entries = fixtures();
  options.configure?.(entries);
  const calls = [];
  const output = [];
  const errors = [];
  const summaries = [];
  const violations = [];
  const observations = [];
  const check = (condition, label) => { if (!condition) violations.push(label); };
  const env = { SENTRY_AUTH_TOKEN: PRIVATE, GITHUB_STEP_SUMMARY: 'synthetic-summary' };
  if (options.buildToken) env.SENTRY_BUILD_AUTH_TOKEN = options.buildToken;
  if (options.noToken) delete env.SENTRY_AUTH_TOKEN;
  const process = { env, exitCode: 0 };
  const context = {
    appendFileSync: (destination, value) => {
      check(destination === 'synthetic-summary', 'summary_path_mismatch');
      summaries.push(value);
    },
    createHash, process, Buffer, URL, Date: options.Date ?? Date,
    AbortSignal: { timeout: ms => {
      check(Number.isInteger(ms) && ms > 0 && ms <= 15000, 'unbounded_timeout');
      return undefined;
    } },
    console: { log: value => output.push(value), error: value => errors.push(value) },
    fetch: async (url, init) => {
      const atFixedApi = typeof url === 'string' && url.startsWith(API);
      const route = atFixedApi ? url.slice(API.length) : '<external-destination>';
      calls.push(route);
      const headerNames = Object.keys(init?.headers ?? {});
      const observed = Object.freeze({
        atFixedApi, methodIsGet: init?.method === 'GET', redirectsRejected: init?.redirect === 'error',
        headerShapeValid: headerNames.length === 1 && headerNames[0] === 'Authorization',
        tokenMatches: init?.headers?.Authorization === 'Bearer ' + PRIVATE ||
          (options.buildToken && init?.headers?.Authorization === 'Bearer ' + options.buildToken),
      });
      observations.push(observed);
      check(observed.atFixedApi, 'external_destination');
      check(observed.methodIsGet, 'non_get_method');
      check(observed.redirectsRejected, 'redirect_allowed');
      check(observed.headerShapeValid, 'unexpected_headers');
      check(observed.tokenMatches, 'authorization_mismatch');
      const value = options.resolve?.(route, entries, calls, init) ?? entries.get(route);
      if (!value) {
        check(false, 'unexpected_request');
        throw new Error('UNEXPECTED_FIXTURE_REQUEST');
      }
      if (value.throw) throw new Error(PRIVATE);
      if (value.response) return value.response;
      const headers = { 'content-type': 'application/json' };
      if (value.link !== null) headers.link = value.link ?? terminal(route);
      return new Response(value.raw ?? JSON.stringify(value.data), { status: value.status ?? 200, headers });
    },
  };
  const subject = options.mutateProgram ? options.mutateProgram(program) : program;
  const task = vm.runInNewContext(subject, context, { timeout: 2000 });
  await task;
  // These assertions must run outside every catch in the evaluated program.
  assert.deepEqual(violations, [], 'sandbox policy violations: ' + violations.join(','));
  const text = [...output, ...errors, ...summaries].join('\n');
  assert.ok(!text.includes(PRIVATE), 'private provider fields/token must never reach output');
  assert.ok(!text.includes(fixtureUrl), 'collector URL must never reach output');
  return { code: process.exitCode, result: output.length ? JSON.parse(output[0]) : null,
    calls: Object.freeze([...calls]), observations: Object.freeze([...observations]), errors, summaries, text };
}
const policyMutants = [
  ['external_destination', "await fetch('https://outside.example.test/', { method: 'GET', redirect: 'error', headers: { Authorization: 'Bearer ' + token } });"],
  ['non_get_method', "await fetch(API, { method: 'POST', redirect: 'error', headers: { Authorization: 'Bearer ' + token } });"],
  ['redirect_allowed', "await fetch(API, { method: 'GET', redirect: 'follow', headers: { Authorization: 'Bearer ' + token } });"],
  ['authorization_mismatch', "await fetch(API, { method: 'GET', redirect: 'error', headers: { Authorization: 'wrong' } });"],
  ['unexpected_headers', "await fetch(API, { method: 'GET', redirect: 'error', headers: { Authorization: 'Bearer ' + token, Extra: 'synthetic' } });"],
  ['unexpected_request', "await fetch(API + 'unsupported-fixture/', { method: 'GET', redirect: 'error', headers: { Authorization: 'Bearer ' + token } });"],
  ['summary_path_mismatch', "appendFileSync('unexpected-summary', 'synthetic');"],
  ['unbounded_timeout', 'AbortSignal.timeout(15001);'],
];
for (const [violation, statement] of policyMutants) {
  test('harness rejects caught policy mutant: ' + violation, async () => {
    await assert.rejects(execute({
      // This case already expects the audit to fail. The extra policy violation
      // must fail the harness even when the evaluated program catches it.
      configure: rows => rows.set(P.rules, { status: 403, data: PRIVATE }),
      mutateProgram: code => {
        const marker = 'const read = reader(token);';
        assert.equal(code.split(marker).length, 2);
        return code.replace(marker, 'try { ' + statement + ' } catch {}\n' + marker);
      },
    }), error => {
      assert.match(error.message, /sandbox policy violations/);
      assert.ok(error.message.includes(violation));
      return true;
    });
  });
}
test('all required inventories succeed; safe rule/action and destination evidence only', async () => {
  const value = await execute();
  assert.equal(value.code, 0);
  assert.equal(value.observations.length, value.calls.length);
  assert.ok(Object.isFrozen(value.observations[0]));
  assert.equal(value.result.readAccessVerified, true);
  const config = value.result.configuration;
  assert.equal(config.readComplete, true);
  assert.equal(config.eventForwardingVerified, false);
  assert.deepEqual(config.collectorPinsConfigured, ['prod']);
  assert.equal(config.projects[0].rules[0].actions[0].destinationMatch, 'prod');
  assert.equal(config.projects[0].rules[0].actions[0].targetJoin, 'unique_created_app');
  assert.deepEqual(config.projects[0].rules[0].actions[0].targetInstallationStates, ['installed']);
  assert.equal(config.projects[0].rules[0].conditions[0].parametersVerified, true);
  assert.equal(config.projects[0].rules[0].filters[0].parametersVerified, true);
  assert.equal(config.projects[0].rules[0].notificationFrequencyMinutes, 30);
  assert.equal(config.projects[1].project, 'seize-backend');
  assert.equal(config.customIntegrations.items[0].signingConfiguration, 'not_verified');
  assert.ok(value.text.includes('fullWorkflowCoverageVerified'));
});
for (const [field, route] of Object.entries({ authentication: P.identity, project: P.project,
  projectInventory: P.projects, alertRules: P.rules, customIntegrations: P.apps })) {
  test('required 403 fails capability: ' + field, async () => {
    const value = await execute({ configure: rows => rows.set(route, { status: 403, data: PRIVATE }) });
    assert.equal(value.code, 1);
    assert.deepEqual(value.result.unavailableRequiredReads, [field]);
    assert.equal(value.result.configuration, null);
  });
}
test('optional uptime and cron denial do not fail complete required configuration', async () => {
  const value = await execute({ configure: rows => {
    rows.set(P.uptime, { status: 403, data: PRIVATE }); rows.set(P.crons, { status: 404, data: PRIVATE });
  } });
  assert.equal(value.code, 0);
  assert.equal(value.result.uptimeStatus, 403);
});
test('transport exception is bounded and redacted', async () => {
  const value = await execute({ configure: rows => rows.set(P.rules, { throw: true }) });
  assert.equal(value.code, 1);
  assert.equal(value.result.rulesStatus, 'unavailable');
});
test('missing token exits before any request', async () => {
  const value = await execute({ noToken: true });
  assert.equal(value.code, 1);
  assert.equal(value.calls.length, 0);
});
test('a disabled/snoozed rule remains visible without claiming notification health', async () => {
  const value = await execute({ configure: rows => {
    rows.get(P.rules).data[0] = { ...rule(), status: 'disabled', snooze: true, snoozeForEveryone: true, environment: null };
    rows.get(P.apps).data[0].isDisabled = true;
  } });
  const projected = value.result.configuration.projects[0].rules[0];
  assert.equal(projected.status, 'disabled');
  assert.equal(projected.snoozedForAuditIdentity, true);
  assert.equal(projected.snoozedForEveryone, true);
  assert.equal(projected.environment, 'all');
  assert.equal(projected.actions[0].targetDisabled, true);
  assert.equal(value.result.configuration.eventForwardingVerified, false);
});
test('custom component action cannot inherit a verified app webhook destination', async () => {
  const value = await execute({ configure: rows => {
    rows.get(P.rules).data[0].actions = [{
      id: 'sentry.rules.actions.notify_event_sentry_app.NotifyEventSentryAppAction',
      sentryAppInstallationUuid: 'install-uuid', settings: [{ url: fixtureUrl, value: PRIVATE }],
    }];
  } });
  const projected = value.result.configuration.projects[0].rules[0].actions[0];
  assert.equal(projected.type, 'custom_component');
  assert.equal(projected.destinationMatch, 'unknown');
  assert.equal(projected.componentConfigurationVerified, false);
  assert.match(projected.targetIdHash, /^[0-9a-f]{64}$/);
});
for (const target of [
  'https://other.example.test/sentry', fixtureUrl + '?signature=secret', fixtureUrl + '#fragment',
  'https://user:pass@collector.example.test/sentry', 'http://collector.example.test/sentry',
  'https://collector.example.test:8443/sentry', 'invalid',
]) {
  test('destination match fails for changed or unsupported URL form: ' + target, async () => {
    const value = await execute({ configure: rows => { rows.get(P.apps).data[0].webhookUrl = target; } });
    assert.notEqual(value.result.configuration.customIntegrations.items[0].destinationMatch, 'prod');
    assert.ok(!value.text.includes(target));
  });
}
test('duplicate app slugs make action target ambiguous', async () => {
  const value = await execute({ configure: rows => { rows.get(P.apps).data.push({ ...app(), uuid: 'second-uuid' }); } });
  assert.equal(value.result.configuration.projects[0].rules[0].actions[0].targetJoin, 'unknown');
  assert.equal(value.result.configuration.projects[0].rules[0].actions[0].destinationMatch, 'unknown');
});
test('unknown condition/action IDs and extra parameters never become known through prototypes', async () => {
  const value = await execute({ configure: rows => {
    const item = rows.get(P.rules).data[0];
    item.actions = [{ id: 'constructor', secret: PRIVATE }, { id: '__proto__', service: PRIVATE }];
    item.conditions = [{ id: 'constructor', value: PRIVATE }];
    item.filters[0].arbitrary = PRIVATE;
  } });
  const projected = value.result.configuration.projects[0].rules[0];
  assert.deepEqual(projected.actions.map(item => item.type), ['unknown', 'unknown']);
  assert.equal(projected.conditions[0].parametersVerified, false);
  assert.equal(projected.filters[0].parametersVerified, false);
});
test('missing fields do not become false enabled or all-environment evidence', async () => {
  const value = await execute({ configure: rows => { rows.get(P.rules).data = [{ id: '7' }]; } });
  const projected = value.result.configuration.projects[0].rules[0];
  assert.equal(projected.status, 'unknown');
  assert.equal(projected.environment, 'unknown');
  assert.equal(projected.snoozedForAuditIdentity, 'unknown');
  assert.equal(projected.snoozedForEveryone, 'unknown');
  assert.equal(projected.notificationFrequencyMinutes, 'unknown');
  assert.equal(value.code, 1);
});
test('unexpected throttle values and arbitrary level objects remain unknown', async () => {
  const value = await execute({ configure: rows => {
    const item = rows.get(P.rules).data[0];
    item.frequency = PRIVATE;
    item.filters[0].level = { toString: PRIVATE };
  } });
  const projected = value.result.configuration.projects[0].rules[0];
  assert.equal(projected.notificationFrequencyMinutes, 'unknown');
  assert.equal(projected.filters[0].level, 'unknown');
  assert.equal(projected.filters[0].parametersVerified, false);
});
test('sample-level zero is a known provider level and not a missing value', async () => {
  const value = await execute({ configure: rows => { rows.get(P.rules).data[0].filters[0].level = 0; } });
  const projected = value.result.configuration.projects[0].rules[0].filters[0];
  assert.equal(projected.level, '0');
  assert.equal(projected.parametersVerified, true);
});
test('expired global deadline makes no provider requests', async () => {
  let count = 0;
  const value = await execute({ Date: { now: () => count++ === 0 ? 0 : 150001 } });
  assert.equal(value.code, 1);
  assert.equal(value.calls.length, 0);
  assert.equal(value.result.authenticationStatus, 'unavailable');
});
test('pagination walks only the original route and includes later app/rule data', async () => {
  const value = await execute({ configure: rows => {
    rows.set(P.apps, { data: [], link: '<' + API + P.apps + '?&cursor=0:100:0>; rel="next"; results="true"; cursor="0:100:0"' });
    rows.set(P.apps + '?cursor=0%3A100%3A0', { data: [app()] });
  } });
  assert.equal(value.code, 0);
  assert.equal(value.result.configuration.customIntegrations.inventory.pages, 2);
  assert.equal(value.result.configuration.projects[0].rules[0].actions[0].destinationMatch, 'prod');
});
test('missing pagination evidence is explicit incomplete even on a small first page', async () => {
  const value = await execute({ configure: rows => { rows.get(P.apps).link = null; } });
  assert.equal(value.code, 1);
  assert.equal(value.result.readAccessVerified, true);
  assert.equal(value.result.configuration.customIntegrations.inventory.limitation, 'pagination_not_exposed');
});
for (const target of [
  'https://evil.example.test/api/0/apps/?cursor=x', API + P.installs + '?cursor=x',
  'https://user:secret@sentry.io/api/0/' + P.apps + '?cursor=x',
  API + P.apps + '?cursor=x&arbitrary=1',
]) {
  test('pagination rejects untrusted target or query without fetching it: ' + target, async () => {
    const value = await execute({ configure: rows => {
      rows.get(P.apps).link = '<' + target + '>; rel="next"; results="true"';
    } });
    assert.equal(value.code, 1);
    assert.equal(value.calls.length, 9);
  });
}
test('repeated opaque cursor stops the inventory', async () => {
  const link = '<' + API + P.apps + '?cursor=x>; rel="next"; results="true"';
  const value = await execute({ configure: rows => {
    rows.get(P.apps).link = link;
    rows.set(P.apps + '?cursor=x', { data: [], link });
  } });
  assert.equal(value.code, 1);
  assert.equal(value.result.configuration.customIntegrations.inventory.limitation, 'cursor_repeated');
});
test('later page 403 cannot leave a verified destination join', async () => {
  const value = await execute({ configure: rows => {
    rows.get(P.apps).link = '<' + API + P.apps + '?cursor=x>; rel="next"; results="true"';
    rows.set(P.apps + '?cursor=x', { status: 403, data: PRIVATE });
  } });
  assert.equal(value.code, 1);
  assert.equal(value.result.configuration.projects[0].rules[0].actions[0].destinationMatch, 'unknown');
});
test('backend and installation denied reads fail configuration without rewriting original access proof', async () => {
  const value = await execute({ configure: rows => {
    rows.set(P.back, { status: 403, data: PRIVATE });
    rows.set(P.installs, { status: 403, data: PRIVATE });
  } });
  assert.equal(value.result.readAccessVerified, true);
  assert.equal(value.result.configuration.readComplete, false);
  assert.equal(value.result.configuration.installations.status, 403);
  assert.equal(value.code, 1);
});
test('page ceiling prevents unbounded reads', async () => {
  let counter = 0;
  const value = await execute({ resolve: route => {
    if (!route.startsWith(P.apps)) return undefined;
    return { data: [], link: '<' + API + P.apps + '?cursor=' + ++counter + '>; rel="next"; results="true"' };
  } });
  assert.equal(value.code, 1);
  assert.equal(value.result.configuration.customIntegrations.inventory.pages, 8);
  assert.equal(value.calls.filter(route => route.startsWith(P.apps)).length, 8);
});
test('item and nested projection ceilings are explicit incomplete', async () => {
  const value = await execute({ configure: rows => {
    rows.get(P.apps).data = Array.from({ length: 401 }, app);
    rows.get(P.rules).data[0].actions = Array.from({ length: 51 }, () => ({ id: 'unknown' }));
  } });
  assert.equal(value.code, 1);
  assert.equal(value.result.configuration.customIntegrations.inventory.limitation, 'item_limit');
  assert.equal(value.result.configuration.projects[0].rules[0].nestedProjectionComplete, false);
  assert.equal(value.result.configuration.projects[0].rules[0].actions.length, 50);
});
test('malformed or oversized bodies are unavailable without copying content', async () => {
  for (const raw of [PRIVATE, JSON.stringify({ secret: PRIVATE.repeat(30000) })]) {
    const value = await execute({ configure: rows => { rows.set(P.rules, { raw }); } });
    assert.equal(value.code, 1);
    assert.equal(value.result.rulesStatus, 'unavailable');
  }
});
test('large response stream is cancelled when bounded read fails', async () => {
  let cancelled = false;
  const body = new ReadableStream({
    start(controller) { controller.enqueue(new Uint8Array(1048577)); },
    cancel() { cancelled = true; },
  });
  const value = await execute({ configure: rows => { rows.set(P.rules, { response: new Response(body) }); } });
  assert.equal(value.code, 1);
  assert.equal(cancelled, true);
});
test('malformed arrays and null records do not count as complete inventories', async () => {
  const value = await execute({ configure: rows => { rows.get(P.installs).data = [null]; } });
  assert.equal(value.code, 1);
  assert.equal(value.result.configuration.installations.complete, false);
});
test('workflow remains manually triggered, main-only, zero repository permissions and no checkout', () => {
  assert.match(workflow, /permissions: \{\}/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /refs\/heads\/main/);
  assert.doesNotMatch(workflow, /actions\/checkout|contents:\s*read|npm|pnpm|NODE_OPTIONS/);
  assert.equal((original.match(/fetch\(/g) ?? []).length, 1);
  assert.match(original, /method: 'GET'/);
});

const current = result => result.configuration.currentWorkflows;
test('canonical high-priority workflow retains enabled state and preferred-channel recipient policy', async () => {
  const value = await execute();
  const item = current(value.result).workflows[0];
  assert.equal(current(value.result).readComplete, true);
  assert.equal(item.enabled, true);
  assert.equal(item.listDetailConfigurationMatch, true);
  assert.equal(item.legacyRuleJoin, 'unknown');
  assert.equal(item.frequencyMinutes, 30);
  assert.equal(item.triggers.conditions[0].type, 'new_high_priority_issue');
  assert.equal(item.triggers.conditions[0].parametersVerified, true);
  assert.equal(item.actionFilters[0].actions[0].targetType, 'issue_owners');
  assert.equal(item.actionFilters[0].actions[0].fallthrough, 'ActiveMembers');
  assert.equal(item.actionFilters[0].actions[0].semanticsVerified, true);
  assert.equal(item.actionFilters[0].actions[0].destinationVerified, false);
  assert.equal(current(value.result).detectors[0].project, '6529-frontend');
  assert.equal(current(value.result).detectors[0].fullDetectorSemanticsVerified, false);
});
test('enabled-only fingerprints isolate the intended reversible configuration delta', async () => {
  const originalValue = current((await execute()).result).workflows[0];
  const changed = current((await execute({ configure: rows => setWorkflow(rows, item => { item.enabled = false; }) })).result).workflows[0];
  assert.notEqual(changed.configurationFingerprint, originalValue.configurationFingerprint);
  assert.equal(changed.configurationWithoutEnabledFingerprint, originalValue.configurationWithoutEnabledFingerprint);
  const changedRecipient = current((await execute({ configure: rows => setWorkflow(rows, item => {
    item.actionFilters[0].actions[0].data.fallthroughType = 'NoOne';
  }) })).result).workflows[0];
  assert.notEqual(changedRecipient.configurationWithoutEnabledFingerprint, originalValue.configurationWithoutEnabledFingerprint);
});
test('configuration fingerprints ignore only volatile timestamps and canonicalize object order', async () => {
  const initial = current((await execute()).result).workflows[0].configurationFingerprint;
  const value = await execute({ configure: rows => setWorkflow(rows, item => {
    item.dateUpdated = '2026-09-15T01:00:00Z';
    item.config = Object.fromEntries(Object.entries(item.config).reverse());
  }) });
  assert.equal(current(value.result).workflows[0].configurationFingerprint, initial);
});
test('hashing distinguishes object structure from array-of-pairs structure', async () => {
  const values = [];
  for (const extra of [{ a: 1 }, [['a', 1]]]) {
    values.push(current((await execute({ configure: rows => setWorkflow(rows, item => { item.extra = extra; }) })).result)
      .workflows[0].configurationFingerprint);
  }
  assert.notEqual(values[0], values[1]);
});
test('frequency and level conditions retain bounded parameters; unknown extras prevent verification', async () => {
  const value = await execute({ configure: rows => setWorkflow(rows, item => {
    item.triggers.conditions = [
      { type: 'event_frequency_count', comparison: { value: 100, interval: '1h' }, conditionResult: true },
      { type: 'level', comparison: { level: 40, match: 'gte' }, conditionResult: true },
      { type: 'issue_priority_greater_or_equal', comparison: 75, conditionResult: true, secret: PRIVATE },
      { type: PRIVATE, comparison: PRIVATE, conditionResult: true },
    ];
  }) });
  const conditions = current(value.result).workflows[0].triggers.conditions;
  assert.deepEqual(conditions[0].comparison, { value: 100, interval: '1h' });
  assert.equal(conditions[0].parametersVerified, true);
  assert.equal(conditions[1].parametersVerified, true);
  assert.equal(conditions[2].parametersVerified, false);
  assert.equal(conditions[3].type, 'unknown');
});
test('unknown action strings and missing state remain unknown, never enabled or known recipients', async () => {
  const value = await execute({ configure: rows => setWorkflow(rows, item => {
    delete item.enabled;
    item.actionFilters[0].actions = [{ type: PRIVATE, config: { targetType: PRIVATE, targetIdentifier: PRIVATE }, data: {} }];
  }) });
  const item = current(value.result).workflows[0];
  assert.equal(item.enabled, 'unknown');
  assert.equal(item.actionFilters[0].actions[0].type, 'unknown');
  assert.equal(item.actionFilters[0].actions[0].status, 'unknown');
  assert.equal(item.actionFilters[0].actions[0].semanticsVerified, false);
});
for (const route of [P.workflows, P.workflow, P.detector]) {
  test('canonical denied read is an incomplete audit, not a provider outage: ' + route, async () => {
    const value = await execute({ configure: rows => rows.set(route, { status: 403, data: PRIVATE }) });
    assert.equal(value.code, 1);
    assert.equal(value.result.readAccessVerified, true);
    assert.equal(current(value.result).readComplete, false);
    assert.equal(value.result.configuration.providerSettingsChanged, false);
  });
}
test('provider ID mismatch or duplicate list IDs stop before unrelated detail requests', async () => {
  for (const setup of [
    rows => { rows.get(P.workflow).data.id = '999'; },
    rows => { rows.get(P.workflows).data.push(currentWorkflow()); },
    rows => { rows.get(P.workflows).data[0].id = '../other'; },
    rows => { rows.get(P.detector).data.id = '999'; },
  ]) {
    const value = await execute({ configure: setup });
    assert.equal(value.code, 1);
    assert.equal(current(value.result).readComplete, false);
    assert.ok(!value.calls.some(route => route.includes('999') || route.includes('../')));
  }
});
test('list/detail configuration drift is visible and blocks complete read evidence', async () => {
  const value = await execute({ configure: rows => { rows.get(P.workflow).data.enabled = false; } });
  assert.equal(value.code, 1);
  assert.equal(current(value.result).limitation, 'workflow_projection_or_drift');
  assert.equal(current(value.result).workflows[0].listDetailConfigurationMatch, false);
});
test('workflow count and nested detector limits stop rather than silently truncate', async () => {
  const value = await execute({ configure: rows => {
    rows.get(P.workflows).data = Array.from({ length: 13 }, (_, i) => ({ ...currentWorkflow(), id: String(100 + i) }));
  } });
  assert.equal(value.code, 1);
  assert.equal(current(value.result).limitation, 'workflow_id_or_detail_limit');
  assert.ok(!value.calls.includes(P.workflow));
  const nested = await execute({ configure: rows => setWorkflow(rows, item => { item.detectorIds = Array(51).fill('200'); }) });
  assert.equal(nested.code, 1);
});
test('fixed project filters survive cursor pagination and cannot be broadened', async () => {
  const value = await execute({ configure: rows => {
    rows.get(P.workflows).data = [];
    rows.get(P.workflows).link = '<' + API + P.workflows + '&cursor=next>; rel="next"; results="true"';
    rows.set(P.workflows + '&cursor=next', { data: [currentWorkflow()] });
  } });
  assert.equal(value.code, 0);
  assert.equal(current(value.result).inventory.pages, 2);
  for (const changed of [P.workflows.replace('seize-backend', 'other'), P.workflows + '&project=other',
    P.workflows.replace('per_page=100', 'per_page=1000')]) {
    const rejected = await execute({ configure: rows => {
      rows.get(P.workflows).link = '<' + API + changed + '&cursor=next>; rel="next"; results="true"';
    } });
    assert.equal(rejected.code, 1);
    assert.ok(!rejected.calls.includes(changed + '&cursor=next'));
  }
});
test('relevant scope flags remain unknown without auth scope metadata', async () => {
  const value = await execute({ configure: rows => { rows.get(P.identity).data = { auth: {} }; } });
  assert.ok(Object.values(value.result.scopeFlags).every(flag => flag === 'unknown'));
  assert.equal(value.result.providerWriteCapabilityVerified, false);
});
for (const [url, kind] of [
  [fixtureUrl, 'production_collector'],
  ['https://discord.com/api/webhooks/123456/SECRET_token?wait=true', 'discord_webhook'],
  ['https://discord.com.evil.example/api/webhooks/123456/SECRET_token', 'other'],
  ['https://discord.com/other/123456/SECRET_token', 'other'],
  ['https://abcdef.execute-api.eu-west-1.amazonaws.com/sentry', 'other_aws_gateway'],
  ['https://api.6529.io/sentry', '6529_api'],
  ['https://user:pass@discord.com/api/webhooks/123456/SECRET_token', 'unknown'],
]) {
  test('destination category is bounded and never discloses URL: ' + kind + ':' + url, async () => {
    const value = await execute({ configure: rows => { rows.get(P.apps).data[0].webhookUrl = url; } });
    assert.equal(value.result.configuration.customIntegrations.items[0].destination.kind, kind);
    assert.ok(!value.text.includes(url));
    assert.ok(!value.text.includes('SECRET_token'));
  });
}
test('app schema and documented event subscriptions are projected without arbitrary contents', async () => {
  const value = await execute({ configure: rows => {
    const item = rows.get(P.apps).data[0];
    item.schema = { elements: [{ type: 'alert-rule-action', url: PRIVATE }] };
    item.webhookEvents = ['error.created', 'issue.created', PRIVATE]; item.events = ['error', 'issue'];
  } });
  const item = value.result.configuration.customIntegrations.items[0];
  assert.equal(item.schemaPresent, true);
  assert.match(item.schemaFingerprint, /^[a-f0-9]{64}$/);
  assert.deepEqual(item.eventSubscriptions.knownValues, ['error', 'issue']);
  assert.equal(item.webhookEvents.unknownCount, 1);
});

test('connected project access is explicit metadata and not an effective write claim', async () => {
  const value = await execute();
  assert.equal(current(value.result).connectedProjectCoverageComplete, true);
  assert.equal(current(value.result).reverseConnectionsVerified, true);
  assert.equal(current(value.result).projectAccess[0].accessFlags['project:read'], true);
  assert.equal(current(value.result).projectAccess[0].accessFlags['project:write'], false);
  assert.equal(current(value.result).projectAccess[0].effectiveWorkflowWriteVerified, false);
});
test('missing access, outside project and reverse-link mismatch remain unverified', async () => {
  const value = await execute({ configure: rows => {
    delete rows.get(P.project).data.access;
    rows.get(P.detector).data.projectId = '999';
    rows.get(P.detector).data.workflowIds = ['999'];
  } });
  assert.equal(current(value.result).connectedProjectCoverageComplete, false);
  assert.equal(current(value.result).reverseConnectionsVerified, false);
  assert.equal(current(value.result).projectAccess[0].accessFlags['project:write'], 'unknown');
  assert.ok(!value.calls.some(route => route.includes('999')));
});

test('official direct user/team email shape permits empty data without issue-owner fallthrough', async () => {
  for (const targetType of ['user', 'team']) {
    const value = await execute({ configure: rows => setWorkflow(rows, item => {
      const action = item.actionFilters[0].actions[0];
      action.config.targetType = targetType; action.config.targetIdentifier = '123'; action.data = {};
    }) });
    const action = current(value.result).workflows[0].actionFilters[0].actions[0];
    assert.equal(action.semanticsVerified, true);
    assert.equal(action.fallthrough, 'unknown');
  }
});
test('separate build credential performs only the three capability GETs with no token crossover', async () => {
  const buildToken = PRIVATE + '_build';
  const buildCalls = [];
  const value = await execute({ buildToken, resolve: (route, rows, calls, init) => {
    if (init.headers.Authorization !== 'Bearer ' + buildToken) return undefined;
    buildCalls.push(route);
    assert.ok([P.identity, P.project, P.backProject].includes(route));
    if (route === P.identity) return { data: { auth: { scopes: ['org:admin'] } } };
    return { data: { id: route === P.project ? '1' : '2', access: ['project:write', 'project:admin'] } };
  } });
  assert.deepEqual(buildCalls.sort(), [P.identity, P.project, P.backProject].sort());
  assert.equal(value.result.buildCredentialCapabilities.scopeFlags['org:admin'], true);
  assert.equal(value.result.scopeFlags['org:admin'], false);
  assert.equal(value.result.buildCredentialCapabilities.projectAccess[0].accessFlags['project:write'], true);
  assert.equal(current(value.result).projectAccess[0].accessFlags['project:write'], false);
  assert.equal(value.result.buildCredentialCapabilities.providerWriteCapabilityVerified, false);
});
test('identical credential is not read twice and optional build denial does not rewrite primary access', async () => {
  const baseline = await execute();
  const same = await execute({ buildToken: PRIVATE });
  assert.equal(same.calls.length, baseline.calls.length);
  assert.equal(same.result.buildCredentialCapabilities.source, 'same_as_selected');
  const denied = await execute({ buildToken: PRIVATE + '_build', resolve: (route, rows, calls, init) =>
    init.headers.Authorization.endsWith('_build') ? { status: 403, data: PRIVATE } : undefined });
  assert.equal(denied.code, 0);
  assert.equal(denied.result.buildCredentialCapabilities.readComplete, false);
  assert.equal(denied.result.readAccessVerified, true);
});

test('webhook targets join by app slug and sentry_app by numeric app ID, never integrationId', async () => {
  for (const [type, targetIdentifier] of [['webhook', 'synthetic-app'], ['sentry_app', '77']]) {
    const value = await execute({ configure: rows => {
      rows.get(P.installs).data[0].app.sentryAppId = 77;
      setWorkflow(rows, item => { item.actionFilters[0].actions = [{ type, integrationId: null,
        config: { targetType: 'specific', targetIdentifier }, data: {}, status: 'active' }]; });
    } });
    const target = current(value.result).workflows[0].actionFilters[0].actions[0].target;
    assert.equal(target.join, 'unique_created_app');
    assert.equal(target.destinationKind, 'production_collector');
    assert.equal(target.appDisabled, false);
  }
  const invalid = await execute({ configure: rows => setWorkflow(rows, item => {
    item.actionFilters[0].actions = [{ type: 'webhook', integrationId: 'app-uuid',
      config: { targetIdentifier: 'synthetic-app' }, data: {}, status: 'active' }];
  }) });
  assert.equal(current(invalid.result).workflows[0].actionFilters[0].actions[0].target.join, 'unknown');
});

test('explicit null triggers mean unconditional, while missing triggers remain incomplete', async () => {
  const value = await execute({ configure: rows => setWorkflow(rows, item => { item.triggers = null; }) });
  assert.equal(value.code, 0);
  assert.equal(current(value.result).workflows[0].triggers.logic, 'unconditional');
  const missing = await execute({ configure: rows => setWorkflow(rows, item => { delete item.triggers; }) });
  assert.equal(missing.code, 1);
});
test('recipient IDs and ambiguous app installation namespaces cannot become verified', async () => {
  for (const targetIdentifier of ['', PRIVATE, '../123']) {
    const value = await execute({ configure: rows => setWorkflow(rows, item => {
      const action = item.actionFilters[0].actions[0]; action.config = { targetType: 'user', targetIdentifier }; action.data = {};
    }) });
    assert.equal(current(value.result).workflows[0].actionFilters[0].actions[0].semanticsVerified, false);
  }
  const value = await execute({ configure: rows => {
    rows.get(P.installs).data[0].app.sentryAppId = 77;
    rows.get(P.installs).data.push({ ...rows.get(P.installs).data[0], uuid: 'second-install' });
    setWorkflow(rows, item => { item.actionFilters[0].actions = [{ type: 'sentry_app', integrationId: null,
      config: { targetType: 'specific', targetIdentifier: '77' }, data: {}, status: 'active' }]; });
  } });
  assert.equal(current(value.result).workflows[0].actionFilters[0].actions[0].target.join, 'unknown');
});

test('terminal pagination cannot claim scoped completeness after changing fixed project filters', async () => {
  const value = await execute({ configure: rows => {
    rows.get(P.workflows).link = '<' + API + P.workflows.replace('seize-backend', 'other') + '&cursor=end>; rel="next"; results="false"';
  } });
  assert.equal(value.code, 1);
  assert.equal(current(value.result).inventory.complete, false);
  assert.equal(current(value.result).inventory.limitation, 'pagination_invalid');
});

test('fractional issue occurrence counts are not verified as integer provider conditions', async () => {
  const value = await execute({ configure: rows => setWorkflow(rows, item => {
    item.triggers.conditions = [{ type: 'issue_occurrences', comparison: { value: 1.5 }, conditionResult: true }];
  }) });
  assert.equal(current(value.result).workflows[0].triggers.conditions[0].parametersVerified, false);
});

test('real minute frequency intervals and integer counts are verified; percent and undocumented intervals stay unknown', async () => {
  for (const [type, interval, count, verified] of [
    ['event_frequency_count', '1m', 10, true], ['event_unique_user_frequency_count', '5m', 10, true],
    ['event_frequency_count', '1hr', 10, false], ['event_frequency_count', '1h', 1.5, false],
    ['event_frequency_percent', '1h', 10, false],
  ]) {
    const value = await execute({ configure: rows => setWorkflow(rows, item => {
      item.triggers.conditions = [{ type, comparison: { value: count, interval }, conditionResult: true }];
    }) });
    assert.equal(current(value.result).workflows[0].triggers.conditions[0].parametersVerified, verified);
  }
});
