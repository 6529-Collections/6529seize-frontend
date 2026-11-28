/** Shared callers can request motion without loading the native animation engine. */
export interface PhoneBackGesture {
  readonly origin: number;
  readonly width: number;
  move(distance: number): void;
  end(committed: boolean, velocity: number, navigate: () => void): void;
}

export interface PhoneNavigationMotion {
  transition(direction: "forward" | "back", navigate: () => void): boolean;
  canCatch(): boolean;
  begin(): PhoneBackGesture | null;
  commit(entering: boolean): void;
  dispose(): void;
}

let activeMotion: PhoneNavigationMotion | null = null;

export function registerPhoneNavigationMotion(motion: PhoneNavigationMotion) {
  activeMotion = motion;
  return () => {
    if (activeMotion === motion) activeMotion = null;
    motion.dispose();
  };
}

export function runPhoneNavigationMotion(
  direction: "forward" | "back",
  navigate: () => void
) {
  return activeMotion?.transition(direction, navigate) ?? false;
}

export function beginPhoneBackGesture() {
  return activeMotion?.begin() ?? null;
}

export function canCatchPhoneBackGesture() {
  return activeMotion?.canCatch() ?? false;
}
