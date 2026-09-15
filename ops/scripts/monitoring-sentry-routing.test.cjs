const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const vm = require('node:vm');

const yaml = readFileSync('.github/workflows/monitoring-sentry-routing.yml', 'utf8');
const block = /node --input-type=module <<'NODE'\r?\n([\s\S]*?)^\s{10}NODE\s*$/m.exec(yaml);
assert.ok(block, 'test the actual trusted inline program');
const original = block[1].replace(/^ {10}/gm, '');
const pinsPattern = /const PINS = \{[\s\S]*?^\};/m;
const pinsBlock = pinsPattern.exec(original);
assert.ok(pinsBlock);
const actualPins = vm.runInNewContext(pinsBlock[0].replace('const PINS =', '(').replace(/;$/, ')'));
const hash = value => createHash('sha256').update(value).digest('hex');
const clone = value => JSON.parse(JSON.stringify(value));
function lexical(a, b) {
  if (a < b) return -1;
  return a > b ? 1 : 0;
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort(lexical).map(key => [key, canonical(value[key])]));
  }
  return value;
}
const fingerprint = value => hash(JSON.stringify(canonical(value)));
const configHash = value => fingerprint(Object.fromEntries(Object.entries(value).filter(([key]) =>
  !['id', 'organizationId', 'createdBy', 'dateCreated', 'dateUpdated', 'lastTriggered'].includes(key))));
const API = 'https://sentry.io/api/0/';
const ORG = 'organizations/seize-ff/';
const FRONT_PATH = ORG + 'workflows/4/';
const BACK_PATH = ORG + 'workflows/?id=2';
const BACK_PROJECT = 'seize-backend';
const FRONT_PROJECT = '6529-frontend';
const LIST = ORG + 'workflows/?project=6529-frontend&project=seize-backend&per_page=100';
const CANARY = 'PRIVATE_CANARY_mail@example.test';
const TOKEN = 'SECRET_SYNTHETIC_TOKEN';
const KEY_ORDER = ['backEmail', 'backDiscord', 'frontEmail', 'frontDiscord', 'backApp', 'frontApp'];

function fixtures() {
  const app = { uuid: 'synthetic-app-uuid', slug: 'synthetic-app', webhookUrl: 'https://receiver.example.test/dev-alerts',
    isDisabled: false, isAlertable: true, webhookEvents: ['error.created', 'issue.created'], schema: {},
    clientSecret: CANARY, name: CANARY, status: 'internal', verifyInstall: false, events: ['error', 'issue'] };
  const installed = { uuid: 'synthetic-install-uuid', app: { uuid: app.uuid }, status: 'installed' };
  const workflows = {};
  KEY_ORDER.forEach((key, index) => { workflows[key] = workflowFixture(key, index, app); });
  const detectors = Object.fromEntries([BACK_PROJECT, FRONT_PROJECT].map(project => {
    const back = project === BACK_PROJECT; const id = back ? '100' : '200';
    return [id, { id, projectId: back ? '10' : '20', enabled: true, type: 'error', config: {}, conditionGroup: null,
      dataSources: [], workflowIds: KEY_ORDER.filter(key => key.startsWith(back ? 'back' : 'front')).map(key => workflows[key].id) }];
  }));
  const appConfig = value => ({ isDisabled: value.isDisabled, isAlertable: value.isAlertable,
    webhookUrl: value.webhookUrl, webhookEvents: value.webhookEvents, schema: value.schema });
  const pins = { audit: actualPins.audit, app: hash(app.uuid), appConfig: fingerprint(appConfig(app)), callback: hash(app.webhookUrl),
    appSlug: fingerprint(app.slug), detectorConfig: fingerprint({ config: {}, conditionGroup: null, dataSources: [], enabled: true }),
    workflows: Object.fromEntries(KEY_ORDER.map(key => [key, [hash(workflows[key].id), configHash(workflows[key]), key.startsWith('back') ? BACK_PROJECT : FRONT_PROJECT]])),
    detectors: { [BACK_PROJECT]: hash('100'), [FRONT_PROJECT]: hash('200') } };
  return { workflows, detectors, app, installed, pins };
}

function workflowFixture(key, index, app) {
  const kind = key.replace(/^(back|front)/, '');
  const presets = {
    Email: { type: 'email', frequency: 30, trigger: 'new_high_priority_issue', comparison: true, target: null },
    Discord: { type: 'discord', frequency: 5, trigger: 'event_frequency_count', comparison: { value: 10, interval: '1m' }, target: 'channel-private' },
    App: { type: 'webhook', frequency: 5, trigger: 'event_frequency_count', comparison: { value: 10, interval: '1m' }, target: app.slug },
  };
  const preset = presets[kind];
  if (key === 'backDiscord') Object.assign(preset, { frequency: 10, trigger: 'first_seen_event', comparison: true });
  return {
    id: String(index + 1), organizationId: '500', createdBy: '700', dateCreated: '2026-01-01T00:00:00Z',
    dateUpdated: '2026-09-15T00:00:00Z', lastTriggered: null, name: CANARY + key,
    enabled: true, config: { frequency: preset.frequency },
    environment: key === 'frontApp' ? 'production' : null, owner: { type: 'team', id: '900', name: CANARY },
    detectorIds: [key.startsWith('back') ? '100' : '200'],
    triggers: { id: String(300 + index), organizationId: '500', logicType: key === 'frontDiscord' ? 'all' : 'any-short',
      conditions: [{ id: String(400 + index), type: preset.trigger, comparison: preset.comparison, conditionResult: true }], actions: [] },
    actionFilters: [{ id: String(500 + index), organizationId: '500', logicType: 'all', conditions: [],
      actions: [{ id: String(600 + index), type: preset.type, integrationId: kind === 'Discord' ? '800' : null,
        data: kind === 'Email' ? { fallthroughType: 'ActiveMembers' } : {},
        config: { targetType: kind === 'Email' ? 'issue_owners' : 'specific', targetDisplay: CANARY,
          targetIdentifier: preset.target }, status: 'active' }] }],
  };
}

function frontendWrite(body, state, baseline, options, mode) {
  assert.deepEqual(Object.keys(body).sort(lexical), ['actionFilters', 'enabled', 'name']);
  assert.equal(body.name, baseline.frontDiscord.name); assert.equal(body.enabled, true);
  assert.equal(body.actionFilters.length, 1);
  const filter = body.actionFilters[0];
  assert.equal(filter.id, baseline.frontDiscord.actionFilters[0].id);
  assert.deepEqual(filter.conditions, []);
  assert.equal(filter.actions.length, 1);
  assert.equal(filter.actions[0].id, baseline.frontDiscord.actionFilters[0].actions[0].id);
  const donor = mode === 'restore' ? baseline.frontDiscord : baseline.frontApp;
  assert.equal(filter.actions[0].type, donor.actionFilters[0].actions[0].type);
  assert.equal(filter.actions[0].integrationId, donor.actionFilters[0].actions[0].integrationId);
  assert.deepEqual(filter.actions[0].config, donor.actionFilters[0].actions[0].config);
  if (mode === 'restore') assert.equal(state.workflows.backDiscord.enabled, true);
  if (!options.denyWrite) {
    state.workflows.frontDiscord.actionFilters[0].actions = clone(filter.actions);
    state.workflows.frontDiscord.dateUpdated = '2026-09-15T19:00:00Z';
  }
  return state.workflows.frontDiscord;
}

function backendWrite(body, state, options, mode) {
  assert.deepEqual(body, { enabled: mode === 'restore' });
  assert.equal(state.workflows.frontDiscord.actionFilters[0].actions[0].type, 'webhook');
  if (!options.denyBackend) state.workflows.backDiscord.enabled = body.enabled;
  return [state.workflows.backDiscord];
}

function providerWrite(path, init, mock) {
  const { state, baseline, options, mode, writes } = mock;
  const body = JSON.parse(init.body); writes.push({ path, body: clone(body) });
  assert.equal(init.headers['Content-Type'], 'application/json');
  let data;
  if (path === FRONT_PATH) data = frontendWrite(body, state, baseline, options, mode);
  else if (path === BACK_PATH) data = backendWrite(body, state, options, mode);
  else assert.fail('unexpected provider write path');
  let status = 200;
  if (options.denyWrite || (options.denyBackend && path === BACK_PATH)) {
    status = options.denyStatus ?? 403; data = { detail: CANARY };
  }
  const after = options.afterPut?.({ state, path, body, writes });
  if (after?.throw) throw new Error(CANARY);
  if (after?.data !== undefined) data = after.data;
  return { data, status };
}

function providerRead(path, mock) {
  const { state, options } = mock;
  if (path === LIST) {
    mock.snapshots++;
    options.onSnapshot?.({ state, snapshots: mock.snapshots });
    return Object.values(state.workflows);
  }
  if (/^organizations\/seize-ff\/workflows\/[1-6]\/$/.test(path)) {
    return Object.values(state.workflows).find(value => path.endsWith('/' + value.id + '/'));
  }
  const responses = {
    [ORG + 'detectors/100/']: state.detectors['100'], [ORG + 'detectors/200/']: state.detectors['200'],
    ['projects/seize-ff/' + BACK_PROJECT + '/']: { id: '10', slug: BACK_PROJECT, access: ['project:read'] },
    ['projects/seize-ff/' + FRONT_PROJECT + '/']: { id: '20', slug: FRONT_PROJECT, access: ['project:read'] },
    [ORG + 'sentry-apps/']: [state.app], [ORG + 'sentry-app-installations/']: [state.installed],
  };
  if (Object.hasOwn(responses, path)) return responses[path];
  if (options.extraGet) return options.extraGet(path, state);
  assert.fail('unexpected provider GET path');
}

function responseBody(bytes) {
  let sent = false;
  return { getReader: () => ({ read: async () => {
    if (sent) return { done: true };
    sent = true;
    return { done: false, value: bytes };
  }, cancel: async () => {} }) };
}

function providerResponse(reply, override, init, options) {
  const data = override?.data !== undefined ? override.data : reply.data;
  const status = override?.status !== undefined ? override.status : reply.status;
  let raw = JSON.stringify(data);
  if (init.method === 'PUT' && status >= 400 && options.deniedBody !== undefined) raw = options.deniedBody;
  const bytes = Buffer.from(override?.raw ?? raw);
  const headers = { link: override?.link ?? null, 'content-length': override?.declared ?? String(bytes.length) };
  return { status, headers: { get: key => headers[key] ?? null }, body: override?.noBody ? null : responseBody(bytes) };
}

function mockFetch(mock) {
  return async (url, init) => {
    const { state, options, requests, writes } = mock;
    assert.ok(url.startsWith(API)); assert.equal(new URL(url).origin, 'https://sentry.io');
    assert.equal(init.redirect, 'error'); assert.equal(init.headers.Authorization, 'Bearer ' + TOKEN);
    assert.ok(['GET', 'PUT'].includes(init.method));
    const path = url.slice(API.length);
    requests.push({ path, method: init.method });
    assert.ok(requests.length <= 48);
    const override = options.onRequest?.({ state, path, init, requests, writes, snapshots: mock.snapshots });
    if (override?.throw) throw new Error(CANARY);
    let reply;
    if (init.method === 'PUT') reply = providerWrite(path, init, mock);
    else {
      assert.deepEqual(Object.keys(init.headers), ['Authorization']);
      reply = { data: providerRead(path, mock), status: 200 };
    }
    return providerResponse(reply, override, init, options);
  };
}

async function execute(options = {}) {
  const state = fixtures(); const baseline = clone(state.workflows);
  const pins = clone(state.pins);
  if (options.appSlugPin !== undefined) pins.appSlug = options.appSlugPin;
  options.prepare?.(state);
  const source = original.replace(pinsPattern, 'const PINS = ' + JSON.stringify(pins) + ';')
    .replace(/^import \{ appendFileSync \} from 'node:fs';\r?\n/m, '')
    .replace(/^import \{ createHash \} from 'node:crypto';\r?\n/m, '');
  const requests = []; const writes = []; const output = []; const summaries = [];
  const env = { GITHUB_REPOSITORY: '6529-Collections/6529seize-frontend', GITHUB_REF: 'refs/heads/main',
    GITHUB_EVENT_NAME: 'workflow_dispatch', GITHUB_SHA: 'a'.repeat(40), GITHUB_RUN_ATTEMPT: '1',
    ROUTING_MODE: options.mode ?? 'apply', SENTRY_MONITORING_AUTH_TOKEN: TOKEN, GITHUB_STEP_SUMMARY: 'summary-only', ...options.env };
  const process = { env, exitCode: 0 };
  const context = { createHash, process, Buffer, URL, Object, Date: options.Date ?? Date,
    AbortSignal: { timeout: ms => { assert.ok(ms > 0 && ms <= 10000); return null; } },
    appendFileSync: (path, value) => { assert.equal(path, 'summary-only'); summaries.push(value); },
    console: { log: value => output.push(value) },
    fetch: mockFetch({ state, baseline, options, mode: env.ROUTING_MODE, requests, writes, snapshots: 0 }),
  };
  await vm.runInNewContext('(async () => {\n' + source + '\n})()', context, { timeout: 2000 });
  assert.equal(output.length, 1);
  for (const value of [...output, ...summaries]) {
    for (const secret of [CANARY, TOKEN, state.app.webhookUrl, 'channel-private', state.app.uuid]) assert.ok(!value.includes(secret), 'private values never emitted');
  }
  const result = JSON.parse(output[0]);
  assert.equal(result.calls, requests.length); assert.equal(result.puts, writes.length);
  return { result, code: process.exitCode, state, baseline, requests, writes };
}

test('manual trusted workflow uses only the monitoring secret and two fixed choices', () => {
  assert.match(yaml, /workflow_dispatch:/); assert.doesNotMatch(yaml, /pull_request|schedule:|workflow_run:/);
  assert.match(yaml, /permissions: \{\}/); assert.match(yaml, /cancel-in-progress: false/);
  assert.match(yaml, /options: \[plan, apply, restore\]/); assert.match(yaml, /default: plan/);
  assert.match(yaml, /secrets\.SENTRY_MONITORING_AUTH_TOKEN/); assert.doesNotMatch(yaml, /secrets\.SENTRY_AUTH_TOKEN|actions\/checkout|curl|continue-on-error/);
  assert.equal(Object.keys(actualPins.workflows).length, 6);
  for (const pin of [actualPins.audit, actualPins.app, actualPins.appConfig, actualPins.callback, actualPins.appSlug,
    actualPins.detectorConfig, ...Object.values(actualPins.detectors), ...Object.values(actualPins.workflows).flatMap(v => v.slice(0, 2))]) assert.match(pin, /^[a-f0-9]{64}$/);
});
test('plan reads all six workflows, both projects/detectors and installed app without writing', async () => {
  const value = await execute({ mode: 'plan' });
  assert.equal(value.code, 0); assert.equal(value.result.outcome, 'plan_verified'); assert.equal(value.writes.length, 0);
  assert.equal(value.result.plan.rollbackDonorVerified, true); assert.deepEqual(value.state.workflows, value.baseline);
});
test('apply preserves every untargeted field and verifies frontend before disabling backend', async () => {
  const value = await execute();
  assert.equal(value.code, 0); assert.equal(value.result.outcome, 'applied_and_verified'); assert.equal(value.writes.length, 2);
  const expected = clone(value.baseline);
  expected.frontDiscord.actionFilters[0].actions[0] = { ...clone(expected.frontApp.actionFilters[0].actions[0]), id: expected.frontDiscord.actionFilters[0].actions[0].id };
  expected.frontDiscord.dateUpdated = value.state.workflows.frontDiscord.dateUpdated;
  expected.backDiscord.enabled = false;
  assert.deepEqual(value.state.workflows, expected); assert.equal(value.result.allUntargetedConfigurationVerified, true);
  assert.equal(value.result.deliveryVerified, false);
});
for (const [label, env] of [
  ['non-main', { GITHUB_REF: 'refs/heads/branch' }], ['other repository', { GITHUB_REPOSITORY: 'other/repo' }],
  ['nonmanual', { GITHUB_EVENT_NAME: 'push' }], ['rerun', { GITHUB_RUN_ATTEMPT: '2' }],
  ['bad source', { GITHUB_SHA: CANARY }], ['no credential', { SENTRY_MONITORING_AUTH_TOKEN: '' }],
  ['unrecognized mode', { ROUTING_MODE: CANARY }],
]) test('no request on ' + label, async () => {
  const value = await execute({ env }); assert.equal(value.code, 1); assert.equal(value.requests.length, 0);
});
for (const [label, prepare] of [
  ['email priority drift', s => { s.workflows.frontEmail.triggers.conditions[0].comparison = false; }],
  ['email recipient drift', s => { s.workflows.backEmail.actionFilters[0].actions[0].config.targetIdentifier = '999'; }],
  ['frontend environment drift', s => { s.workflows.frontDiscord.environment = 'production'; }],
  ['frontend frequency drift', s => { s.workflows.frontDiscord.config.frequency = 10; }],
  ['frontend owner drift', s => { s.workflows.frontDiscord.owner = null; }],
  ['extra condition', s => { s.workflows.frontDiscord.actionFilters[0].conditions.push({ id: '900', type: 'level' }); }],
  ['extra action', s => { s.workflows.frontDiscord.actionFilters[0].actions.push(clone(s.workflows.frontApp.actionFilters[0].actions[0])); }],
  ['unknown action field', s => { s.workflows.frontDiscord.actionFilters[0].actions[0].newField = CANARY; }],
  ['missing own action id', s => { delete s.workflows.frontDiscord.actionFilters[0].actions[0].id; }],
  ['different old Discord payload', s => { s.workflows.frontDiscord.actionFilters[0].actions[0].data.changed = true; }],
  ['app callback drift', s => { s.app.webhookUrl = 'https://other.example.test/'; }],
  ['app subscription drift', s => { s.app.webhookEvents.push('issue.resolved'); }],
  ['app resource subscription drift', s => { s.app.events = ['error']; }],
  ['app disabled', s => { s.app.isDisabled = true; }],
  ['installation pending', s => { s.installed.status = 'pending'; }],
  ['detector configuration drift', s => { s.detectors['100'].config.changed = true; }],
  ['wrong project binding', s => { s.detectors['100'].projectId = '20'; }],
  ['extra reverse connection', s => { s.detectors['100'].workflowIds.push('999'); }],
  ['empty detector connection', s => { s.workflows.frontDiscord.detectorIds = []; }],
  ['backend prematurely disabled', s => { s.workflows.backDiscord.enabled = false; }],
]) test('preflight refuses ' + label, async () => {
  const value = await execute({ prepare }); assert.equal(value.code, 1); assert.equal(value.writes.length, 0); assert.equal(value.result.allUntargetedConfigurationVerified, false);
});
test('already-applied frontend continues with only the backend write', async () => {
  const value = await execute({ prepare: s => { s.workflows.frontDiscord.actionFilters[0].actions[0] = {
    ...clone(s.workflows.frontApp.actionFilters[0].actions[0]), id: s.workflows.frontDiscord.actionFilters[0].actions[0].id }; } });
  assert.equal(value.code, 0); assert.equal(value.writes.length, 1); assert.equal(value.writes[0].path, BACK_PATH);
});
test('already matched configuration issues no no-op writes', async () => {
  const value = await execute({ prepare: s => { s.workflows.frontDiscord.actionFilters[0].actions[0] = {
    ...clone(s.workflows.frontApp.actionFilters[0].actions[0]), id: s.workflows.frontDiscord.actionFilters[0].actions[0].id }; s.workflows.backDiscord.enabled = false; } });
  assert.equal(value.code, 0); assert.equal(value.result.outcome, 'already_matched'); assert.equal(value.writes.length, 0);
});
test('403 on intended frontend change is recorded without alternate credential or backend write', async () => {
  const value = await execute({ denyWrite: true });
  assert.equal(value.code, 1); assert.equal(value.writes.length, 1); assert.equal(value.result.results[0].httpStatus, 403);
  assert.equal(value.result.results[0].status, 'not_observed_applied'); assert.equal(value.result.failure, 'MUTATION_STOPPED');
});
test('uncertain frontend response permits readback but never retry or next mutation', async () => {
  const value = await execute({ afterPut: () => ({ throw: true }) });
  assert.equal(value.code, 1); assert.equal(value.writes.length, 1);
  assert.equal(value.result.results[0].status, 'observed_desired_after_uncertainty');
  assert.equal(value.state.workflows.backDiscord.enabled, true);
});
test('false success body cannot authorize backend mutation', async () => {
  const value = await execute({ afterPut: () => ({ data: { message: CANARY } }) });
  assert.equal(value.code, 1); assert.equal(value.writes.length, 1); assert.equal(value.result.results[0].status, 'observed_desired_after_uncertainty');
});
test('unexpected provider field mutation is a conflict, not success', async () => {
  const value = await execute({ afterPut: ({ state }) => { state.workflows.frontDiscord.environment = 'production'; } });
  assert.equal(value.code, 1); assert.equal(value.writes.length, 1); assert.equal(value.result.results[0].status, 'conflict');
});
test('midpoint email drift stops the second operation', async () => {
  const value = await execute({ onSnapshot: ({ state, snapshots }) => { if (snapshots === 2) state.workflows.backEmail.enabled = false; } });
  assert.equal(value.code, 1); assert.equal(value.writes.length, 1); assert.equal(value.state.workflows.backDiscord.enabled, true);
});
test('backend rejection retains verified frontend progress and does not repeat either write', async () => {
  const value = await execute({ denyBackend: true });
  assert.equal(value.code, 1); assert.equal(value.writes.length, 2); assert.equal(value.result.results[0].status, 'verified');
  assert.equal(value.result.results[1].httpStatus, 403); assert.equal(value.result.results[1].status, 'not_observed_applied');
});
for (const [label, override] of [
  ['declared oversized body', { declared: '1048577' }], ['actual oversized body', { raw: 'x'.repeat(1048577), declared: '0' }],
  ['malformed body', { raw: '{' }], ['non-array inventory', { data: {} }], ['empty inventory', { data: [] }],
  ['missing credential access', { status: 403, data: { detail: CANARY } }],
  ['foreign pagination', { link: '<https://other.example.test/api>; rel="next"; results="true"; cursor="next"' }],
  ['terminal changed project', { link: '<' + API + LIST.replace(BACK_PROJECT, 'other') + '&cursor=end>; rel="next"; results="false"; cursor="end"' }],
]) test('read-only stop on ' + label, async () => {
  const value = await execute({ onRequest: ({ path }) => path === LIST ? override : undefined });
  assert.equal(value.code, 1); assert.equal(value.writes.length, 0);
});
test('list/detail configuration disagreement stops before mutation', async () => {
  const value = await execute({ onRequest: ({ path, state }) => path === FRONT_PATH ? {
    data: { ...clone(state.workflows.frontDiscord), name: 'changed' } } : undefined });
  assert.equal(value.code, 1); assert.equal(value.writes.length, 0);
});
test('unknown future top-level fields require review', async () => {
  const value = await execute({ prepare: s => { s.workflows.frontDiscord.future = true; } });
  assert.equal(value.code, 1); assert.equal(value.writes.length, 0);
});
test('identity creation drift across reads stops after frontend verification', async () => {
  const value = await execute({ onSnapshot: ({ state, snapshots }) => { if (snapshots === 2) state.workflows.frontDiscord.createdBy = '999'; } });
  assert.equal(value.code, 1); assert.equal(value.writes.length, 1);
});

function consolidatedState(state) {
  state.workflows.frontDiscord.actionFilters[0].actions[0] = {
    ...clone(state.workflows.frontApp.actionFilters[0].actions[0]), id: state.workflows.frontDiscord.actionFilters[0].actions[0].id };
  state.workflows.backDiscord.enabled = false;
}
test('manual restore re-enables and verifies backend before restoring the original frontend action', async () => {
  const value = await execute({ mode: 'restore', prepare: consolidatedState });
  assert.equal(value.code, 0); assert.equal(value.result.outcome, 'restored_and_verified');
  assert.deepEqual(value.writes.map(write => write.path), [BACK_PATH, FRONT_PATH]);
  const expected = clone(value.baseline); expected.frontDiscord.dateUpdated = value.state.workflows.frontDiscord.dateUpdated;
  assert.deepEqual(value.state.workflows, expected); assert.equal(value.result.allUntargetedConfigurationVerified, true);
});
test('restore of original configuration performs no no-op writes', async () => {
  const value = await execute({ mode: 'restore' });
  assert.equal(value.code, 0); assert.equal(value.result.outcome, 'already_original'); assert.equal(value.writes.length, 0);
  assert.deepEqual(value.state.workflows, value.baseline);
});
test('manual restore continues a valid partial restoration with only the frontend write', async () => {
  const value = await execute({ mode: 'restore', prepare: state => { consolidatedState(state); state.workflows.backDiscord.enabled = true; } });
  assert.equal(value.code, 0); assert.equal(value.writes.length, 1); assert.equal(value.writes[0].path, FRONT_PATH);
  assert.equal(value.result.outcome, 'restored_and_verified');
});
test('restore refuses drift in the retained rollback donor before any write', async () => {
  const value = await execute({ mode: 'restore', prepare: state => { consolidatedState(state); state.workflows.backDiscord.actionFilters[0].actions[0].data.changed = true; } });
  assert.equal(value.code, 1); assert.equal(value.writes.length, 0);
});
test('restore does not change frontend if backend restore is denied', async () => {
  const value = await execute({ mode: 'restore', prepare: consolidatedState, denyBackend: true });
  assert.equal(value.code, 1); assert.equal(value.writes.length, 1); assert.equal(value.result.results[0].httpStatus, 403);
  assert.equal(value.state.workflows.frontDiscord.actionFilters[0].actions[0].type, 'webhook');
});
test('uncertain backend restore reads back but never automatically restores frontend', async () => {
  const value = await execute({ mode: 'restore', prepare: consolidatedState, afterPut: () => ({ throw: true }) });
  assert.equal(value.code, 1); assert.equal(value.writes.length, 1);
  assert.equal(value.result.results[0].status, 'observed_desired_after_uncertainty');
  assert.equal(value.state.workflows.frontDiscord.actionFilters[0].actions[0].type, 'webhook');
});
test('mid-restore email drift stops before frontend restoration', async () => {
  const value = await execute({ mode: 'restore', prepare: consolidatedState,
    onSnapshot: ({ state, snapshots }) => { if (snapshots === 2) state.workflows.frontEmail.config.frequency = 60; } });
  assert.equal(value.code, 1); assert.equal(value.writes.length, 1);
});
for (const [label, deniedBody, denyStatus] of [['non-JSON 403', '<html>' + CANARY + '</html>', 403], ['empty 401', '', 401]]) {
  test('retains actual status for ' + label + ' without a retry', async () => {
    const value = await execute({ denyWrite: true, deniedBody, denyStatus });
    assert.equal(value.code, 1); assert.equal(value.writes.length, 1);
    assert.equal(value.result.results[0].httpStatus, denyStatus);
    assert.equal(value.result.results[0].status, 'not_observed_applied');
  });
}
test('retains denied PUT status even when response body is unavailable', async () => {
  const value = await execute({ denyWrite: true, onRequest: ({ init }) => init.method === 'PUT' ? { status: 403, noBody: true } : undefined });
  assert.equal(value.code, 1); assert.equal(value.writes.length, 1); assert.equal(value.result.results[0].httpStatus, 403);
});
test('failed initial verification permits one reconciliation GET but no subsequent PUT', async () => {
  let injected = false;
  const value = await execute({ onRequest: ({ path, init, writes }) => {
    if (!injected && init.method === 'GET' && writes.length === 1 && path === FRONT_PATH) {
      injected = true; return { status: 503, data: { detail: CANARY } };
    }
    return undefined;
  } });
  assert.equal(value.code, 1); assert.equal(value.writes.length, 1);
  assert.equal(value.result.results[0].httpStatus, 200);
  assert.equal(value.result.results[0].status, 'observed_desired_after_uncertainty');
  assert.equal(value.requests.filter(call => call.method === 'GET' && call.path === FRONT_PATH).length, 3);
});

test('routing plan consumes the actual audit action target string fingerprint', async () => {
  const auditYaml = readFileSync('.github/workflows/monitoring-provider-audit.yml', 'utf8');
  const auditBlock = /node --input-type=module <<'NODE'\r?\n([\s\S]*?)^\s{10}NODE\s*$/m.exec(auditYaml);
  assert.ok(auditBlock, 'extract the actual audit producer');
  const auditSource = auditBlock[1].replace(/^ {10}/gm, '')
    .replace(/^import \{ appendFileSync \} from 'node:fs';\r?\n/m, '')
    .replace(/^import \{ createHash \} from 'node:crypto';\r?\n/m, '');
  const mainCall = auditSource.lastIndexOf('main().catch(');
  assert.ok(mainCall > 0, 'exclude audit execution while retaining its actual projections');
  const state = fixtures();
  const action = state.workflows.frontApp.actionFilters[0].actions[0];
  const auditedPin = vm.runInNewContext(auditSource.slice(0, mainCall) +
    '\nworkflowAction(syntheticAction, { complete: false }, { complete: false }).targetIdentifierHash',
  { createHash, syntheticAction: action }, { timeout: 2000 });
  assert.equal(auditedPin, hash(JSON.stringify(state.app.slug)));
  assert.notEqual(auditedPin, hash(state.app.slug), 'audit hashes canonical JSON strings, not raw identifiers');
  const value = await execute({ mode: 'plan', appSlugPin: auditedPin });
  assert.equal(value.code, 0); assert.equal(value.result.outcome, 'plan_verified'); assert.equal(value.writes.length, 0);
});

test('routing rejects a raw identifier hash in place of the audited string fingerprint', async () => {
  const value = await execute({ mode: 'plan', appSlugPin: hash(fixtures().app.slug) });
  assert.equal(value.code, 1); assert.equal(value.result.failure, 'APP_DRIFT'); assert.equal(value.writes.length, 0);
});
