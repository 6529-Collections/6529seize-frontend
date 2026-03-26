#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import readline from 'node:readline';

const [, , repo, ...filterArgs] = process.argv;
const refreshIntervalMs = 5000;
const fetchTimeoutMs = 15000;
const jsonFields = [
  'conclusion',
  'createdAt',
  'databaseId',
  'displayTitle',
  'event',
  'headBranch',
  'status',
  'updatedAt',
  'workflowName',
];

if (!repo) {
  process.stderr.write('ghruns-dashboard: missing repository argument\n');
  process.exit(1);
}

if (!process.stdin.isTTY || !process.stderr.isTTY) {
  process.stderr.write('ghruns-dashboard: requires an interactive terminal\n');
  process.exit(1);
}

let runs = [];
let cursor = 0;
let windowStart = 0;
let refreshTimer = null;
let refreshInProgress = false;
let dashboardVisible = false;
let cleanedUp = false;
let currentError = '';
let statusMessage = 'Loading workflow runs...';
let lastRefreshAt = null;

function stripAnsi(value) {
  return value.replace(/\x1b\[[0-9;]*m/g, '');
}

function pad(value, width) {
  const plain = stripAnsi(value);

  if (plain.length >= width) {
    return value;
  }

  return `${value}${' '.repeat(width - plain.length)}`;
}

function truncate(value, width) {
  if (width <= 0) {
    return '';
  }

  if (value.length <= width) {
    return value.padEnd(width, ' ');
  }

  if (width === 1) {
    return value[0];
  }

  return `${value.slice(0, width - 1)}…`;
}

function formatClock(timestamp) {
  if (!timestamp) {
    return 'never';
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(timestamp);
}

function formatRelativeTime(timestamp) {
  if (!timestamp) {
    return '-';
  }

  const diffMs = Math.max(Date.now() - timestamp.getTime(), 0);
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) {
    return `${diffSeconds}s`;
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

function displayState(run) {
  if (run.status === 'completed') {
    return run.conclusion || 'completed';
  }

  return run.status || '-';
}

function computeWidths() {
  const columns = process.stderr.columns ?? 120;
  const minimumTitleWidth = 20;
  const widths = {
    id: 9,
    state: 12,
    workflow: 24,
    branch: 18,
    updated: 8,
  };

  let reserved =
    widths.id +
    widths.state +
    widths.workflow +
    widths.branch +
    widths.updated +
    5;
  let title = Math.max(columns - reserved, minimumTitleWidth);

  if (reserved + title <= columns) {
    return { ...widths, title };
  }

  const shrinkOrder = [
    { key: 'workflow', min: 16 },
    { key: 'branch', min: 12 },
    { key: 'state', min: 10 },
    { key: 'id', min: 7 },
    { key: 'updated', min: 6 },
  ];

  for (const { key, min } of shrinkOrder) {
    while (reserved + minimumTitleWidth > columns && widths[key] > min) {
      widths[key] -= 1;
      reserved -= 1;
    }
  }

  title = Math.max(columns - reserved, 8);

  return { ...widths, title };
}

function selectedRun() {
  return runs[cursor] ?? null;
}

function ensureCursorVisible() {
  const rows = visibleRows();

  if (cursor < windowStart) {
    windowStart = cursor;
  }

  if (cursor >= windowStart + rows) {
    windowStart = cursor - rows + 1;
  }
}

function visibleRows() {
  return Math.max((process.stderr.rows ?? 24) - 10, 5);
}

function renderHeader() {
  const filterText = filterArgs.length > 0 ? filterArgs.join(' ') : 'none';

  process.stderr.write('\x1b[2J\x1b[H');
  process.stderr.write(`Live workflow runs for ${repo}\n`);
  process.stderr.write(
    'Controls: Up/Down move, Enter watches, r refreshes, q quits\n'
  );
  process.stderr.write(`Filters: ${filterText}\n`);
  process.stderr.write(
    `Refresh: ${Math.floor(refreshIntervalMs / 1000)}s | Last refresh: ${formatClock(
      lastRefreshAt
    )}\n`
  );

  if (currentError) {
    process.stderr.write(`Error: ${currentError}\n`);
  } else {
    process.stderr.write(`${statusMessage}\n`);
  }
}

function renderTable() {
  const widths = computeWidths();
  const header = [
    truncate('RUN ID', widths.id),
    truncate('STATE', widths.state),
    truncate('WORKFLOW', widths.workflow),
    truncate('BRANCH', widths.branch),
    truncate('UPDATED', widths.updated),
    truncate('TITLE', widths.title),
  ].join(' ');

  process.stderr.write(`${header}\n`);
  process.stderr.write(`${'-'.repeat(stripAnsi(header).length)}\n`);

  if (runs.length === 0) {
    process.stderr.write('No workflow runs matched the current filters.\n');
    return;
  }

  ensureCursorVisible();

  const rows = visibleRows();
  const end = Math.min(windowStart + rows, runs.length);

  for (let index = windowStart; index < end; index += 1) {
    const run = runs[index];
    const line = [
      truncate(`#${run.databaseId}`, widths.id),
      truncate(displayState(run), widths.state),
      truncate(run.workflowName || 'Unknown', widths.workflow),
      truncate(run.headBranch || '-', widths.branch),
      truncate(formatRelativeTime(new Date(run.updatedAt || run.createdAt)), widths.updated),
      truncate(run.displayTitle || '-', widths.title),
    ].join(' ');

    if (index === cursor) {
      process.stderr.write(`\x1b[7m${pad(line, stripAnsi(header).length)}\x1b[0m\n`);
    } else {
      process.stderr.write(`${line}\n`);
    }
  }

  if (runs.length > rows) {
    process.stderr.write(
      `\nShowing ${windowStart + 1}-${end} of ${runs.length} runs\n`
    );
  }
}

function render() {
  if (!dashboardVisible) {
    return;
  }

  renderHeader();
  renderTable();
}

function enableInteractiveMode() {
  if (dashboardVisible) {
    return;
  }

  dashboardVisible = true;
  process.stderr.write('\x1b[?1049h\x1b[H\x1b[?25l');
  process.stdin.setRawMode(true);
  process.stdin.resume();
  render();
}

function disableInteractiveMode() {
  if (!dashboardVisible) {
    return;
  }

  dashboardVisible = false;
  process.stderr.write('\x1b[?25h\x1b[?1049l');

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
}

function cleanup() {
  if (cleanedUp) {
    return;
  }

  cleanedUp = true;

  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }

  disableInteractiveMode();
}

function exitCleanly(code = 0) {
  cleanup();
  process.exit(code);
}

function refreshStatusMessage() {
  if (refreshInProgress) {
    statusMessage = 'Refreshing workflow runs...';
  } else if (runs.length > 0) {
    statusMessage = `Showing ${runs.length} workflow runs`;
  } else {
    statusMessage = 'No workflow runs found yet';
  }
}

function fetchRuns() {
  const command = spawnSync(
    'gh',
    [
      'run',
      'list',
      '-R',
      repo,
      '--json',
      jsonFields.join(','),
      ...filterArgs,
    ],
    {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
      timeout: fetchTimeoutMs,
    }
  );

  if (command.error) {
    throw command.error;
  }

  if (command.status !== 0) {
    const message = command.stderr.trim() || command.stdout.trim();
    throw new Error(message || `gh run list exited with code ${command.status}`);
  }

  return JSON.parse(command.stdout);
}

function syncCursor(previousSelectionId) {
  if (runs.length === 0) {
    cursor = 0;
    windowStart = 0;
    return;
  }

  if (previousSelectionId) {
    const nextIndex = runs.findIndex(
      (run) => String(run.databaseId) === String(previousSelectionId)
    );

    if (nextIndex >= 0) {
      cursor = nextIndex;
    } else if (cursor >= runs.length) {
      cursor = runs.length - 1;
    }
  } else if (cursor >= runs.length) {
    cursor = runs.length - 1;
  }

  ensureCursorVisible();
}

async function refreshRuns() {
  if (refreshInProgress) {
    return;
  }

  refreshInProgress = true;
  refreshStatusMessage();
  render();

  const previousSelectionId = selectedRun()?.databaseId;

  try {
    runs = fetchRuns();
    lastRefreshAt = new Date();
    currentError = '';
    syncCursor(previousSelectionId);
  } catch (error) {
    currentError =
      error instanceof Error ? error.message : 'Unable to refresh workflow runs';
  } finally {
    refreshInProgress = false;
    refreshStatusMessage();
    render();
  }
}

function watchSelectedRun() {
  const run = selectedRun();

  if (!run) {
    return;
  }

  disableInteractiveMode();

  const command = spawnSync(
    'gh',
    ['run', 'watch', String(run.databaseId), '-R', repo],
    {
      stdio: 'inherit',
    }
  );

  enableInteractiveMode();

  if (command.error) {
    currentError =
      command.error instanceof Error
        ? command.error.message
        : 'Unable to watch the selected run';
  } else if (command.status !== 0) {
    currentError = `gh run watch exited with code ${command.status}`;
  } else {
    currentError = '';
  }

  refreshStatusMessage();
  void refreshRuns();
}

function handleKeypress(_, key) {
  if (!key) {
    return;
  }

  if (key.ctrl && key.name === 'c') {
    exitCleanly(130);
    return;
  }

  switch (key.name) {
    case 'up':
      if (cursor > 0) {
        cursor -= 1;
        render();
      }
      return;
    case 'down':
      if (cursor + 1 < runs.length) {
        cursor += 1;
        render();
      }
      return;
    case 'return':
    case 'enter':
      watchSelectedRun();
      return;
    default:
      break;
  }

  if (key.name === 'q' || key.sequence === 'q' || key.sequence === 'Q') {
    exitCleanly(0);
    return;
  }

  if (key.name === 'r' || key.sequence === 'r' || key.sequence === 'R') {
    void refreshRuns();
    return;
  }

  if (key.name === 'j' || key.sequence === 'j' || key.sequence === 'J') {
    if (cursor + 1 < runs.length) {
      cursor += 1;
      render();
    }
    return;
  }

  if (key.name === 'k' || key.sequence === 'k' || key.sequence === 'K') {
    if (cursor > 0) {
      cursor -= 1;
      render();
    }
  }
}

process.on('exit', cleanup);
process.on('SIGINT', () => exitCleanly(130));
process.on('SIGTERM', () => exitCleanly(143));

if (process.stderr.isTTY) {
  process.stderr.on('resize', render);
}

readline.emitKeypressEvents(process.stdin);
process.stdin.on('keypress', handleKeypress);

enableInteractiveMode();
refreshTimer = setInterval(() => {
  void refreshRuns();
}, refreshIntervalMs);
void refreshRuns();
