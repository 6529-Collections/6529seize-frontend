// The standalone mint page renders no Quick Direct Messages (it runs with
// `enableMyStream={false}`), and the real gate lazily imports the whole wave
// chat UI, which has reached a Server Action before. Next rejects Server
// Actions in a static export, so tsconfig.json maps the gate import to this
// empty component for the standalone build only.
export default function NoQuickDirectMessagesGate() {
  return null;
}
