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
const terminal = route => '<' + API + route + '?cursor=0:0:0>; rel="next"; results="false"; cursor="0:0:0"';
function fixtures() {
  return new Map([
    [P.identity, { data: { auth: { scopes: ['org:read', 'project:read'] } } }],
    [P.project, { data: { name: PRIVATE } }],
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
        tokenMatches: init?.headers?.Authorization === 'Bearer ' + PRIVATE,
      });
      observations.push(observed);
      check(observed.atFixedApi, 'external_destination');
      check(observed.methodIsGet, 'non_get_method');
      check(observed.redirectsRejected, 'redirect_allowed');
      check(observed.headerShapeValid, 'unexpected_headers');
      check(observed.tokenMatches, 'authorization_mismatch');
      const value = options.resolve?.(route, entries, calls) ?? entries.get(route);
      if (!value) {
        check(false, 'unexpected_request');
        throw new Error('UNEXPECTED_FIXTURE_REQUEST');
      }
      if (value.throw) throw new Error(PRIVATE);
      if (value.response) return value.response;
      const headers = { 'content-type': 'application/json' };
      if (value.link !== null) headers.link = value.link ?? terminal(route.split('?')[0]);
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
