// Events that show the visitor is actually using the page. keydown covers a
// lone Ctrl/Meta press, so a Ctrl+K shortcut usually finds its chunk cached.
const FIRST_INTERACTION_EVENTS = [
  "pointerdown",
  "keydown",
  "touchstart",
  "focusin",
  "scroll",
] as const;

// Passive, so it never delays scrolling or touch. Capture, so it also sees
// events that do not bubble (scroll) and runs before page handlers that stop
// propagation.
const LISTENER_OPTIONS = { capture: true, passive: true } as const;

const waitingTasks = new Set<() => void>();
let isListening = false;
let hasInteracted = false;

function stopListening(): void {
  for (const type of FIRST_INTERACTION_EVENTS) {
    globalThis.removeEventListener(type, handleFirstInteraction, {
      capture: true,
    });
  }
  isListening = false;
}

function handleFirstInteraction(): void {
  hasInteracted = true;
  stopListening();
  const tasks = [...waitingTasks];
  waitingTasks.clear();
  for (const task of tasks) task();
}

// Runs a task once, the first time the visitor interacts with the page. Used to
// start downloading chunks a visitor is likely to need (search, the drop
// editor) without adding them to first-load JS and without waiting for the
// browser to be idle, which a busy main thread can delay for seconds.
//
// Call it from an effect so it only registers after hydration. The listeners
// are shared: however many tasks and callers register, there is one set of
// listeners, a task registered twice runs once, and all listeners are removed
// as soon as the first interaction fires. A visitor who has already
// interacted gets the task run straight away.
export function preloadOnFirstInteraction(task: () => void): void {
  if (typeof globalThis.addEventListener !== "function") return;

  if (hasInteracted) {
    task();
    return;
  }

  waitingTasks.add(task);
  if (isListening) return;
  isListening = true;
  for (const type of FIRST_INTERACTION_EVENTS) {
    globalThis.addEventListener(type, handleFirstInteraction, LISTENER_OPTIONS);
  }
}
