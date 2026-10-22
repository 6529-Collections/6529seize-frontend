"use client";

import { Component } from "react";
import type { ReactNode, RefObject } from "react";

// Allow virtual rows to mount and measure, without repeatedly correcting a
// layout that cannot settle. Any new user gesture cancels these retries sooner.
const MAX_RESTORE_FRAMES = 10;

interface AnchorCandidate {
  readonly dropId: string;
  readonly offset: number;
}

interface ScrollSnapshot {
  readonly candidates: readonly AnchorCandidate[];
}

interface Props {
  readonly children: ReactNode;
  readonly rootRef: RefObject<HTMLDivElement | null>;
  readonly scrollContainerRef: RefObject<HTMLDivElement | null>;
  readonly itemIds: readonly string[];
  readonly windowKey: string;
  readonly columns: number;
  readonly leadingItemCount: number;
  readonly masonry: boolean;
  readonly revealIndex: (index: number) => void;
  readonly retainOnContentResize?: boolean | undefined;
}

/** React's snapshot lifecycle reads the old DOM before a ranking update commits. */
export class WaveLeaderboardScrollAnchor extends Component<
  Props,
  Record<string, never>,
  ScrollSnapshot | null
> {
  private frame: number | undefined;
  private resizeObserver: ResizeObserver | undefined;
  private pending: ScrollSnapshot | null = null;
  private readonly cancelForInteraction = () => this.cancel();

  override componentDidMount() {
    const root = this.props.rootRef.current;
    if (root && this.props.retainOnContentResize) {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.pending && this.props.retainOnContentResize) {
          if (this.frame !== undefined) cancelAnimationFrame(this.frame);
          this.restore(0);
        }
      });
      this.resizeObserver.observe(root);
    }
    for (const type of ["touchstart", "pointerdown", "wheel", "keydown"]) {
      root?.addEventListener(type, this.cancelForInteraction, {
        passive: true,
      });
    }
  }

  override getSnapshotBeforeUpdate(previous: Props): ScrollSnapshot | null {
    const { rootRef, scrollContainerRef, windowKey, itemIds, columns } =
      this.props;
    const container = scrollContainerRef.current;
    if (
      previous.windowKey !== windowKey ||
      !container ||
      container.scrollTop <= 0 ||
      (previous.columns === columns &&
        previous.masonry === this.props.masonry &&
        previous.leadingItemCount === this.props.leadingItemCount &&
        previous.itemIds.length === itemIds.length &&
        previous.itemIds.every((id, index) => id === itemIds[index]))
    )
      return null;
    const viewport = container.getBoundingClientRect();
    const cards = rootRef.current?.querySelectorAll<HTMLElement>(
      "[data-leaderboard-drop-id]"
    );
    const candidates = Array.from(cards ?? []).flatMap((card) => {
      const bounds = card.getBoundingClientRect();
      const dropId = card.dataset["leaderboardDropId"];
      return dropId &&
        bounds.bottom > viewport.top &&
        bounds.top < viewport.bottom
        ? [{ dropId, offset: bounds.top - viewport.top }]
        : [];
    });
    return candidates.length ? { candidates } : null;
  }

  override componentDidUpdate(
    previous: Props,
    _state: Readonly<Record<string, never>>,
    snapshot: ScrollSnapshot | null
  ) {
    if (previous.windowKey !== this.props.windowKey) this.cancel();
    if (!snapshot) return;
    this.cancel();
    this.pending = snapshot;
    this.restore(0);
  }

  override componentWillUnmount() {
    this.cancel();
    this.resizeObserver?.disconnect();
    const root = this.props.rootRef.current;
    for (const type of ["touchstart", "pointerdown", "wheel", "keydown"]) {
      root?.removeEventListener(type, this.cancelForInteraction);
    }
  }

  private cancel() {
    if (this.frame !== undefined) cancelAnimationFrame(this.frame);
    this.frame = undefined;
    this.pending = null;
  }

  private restore(attempt: number) {
    const {
      rootRef,
      scrollContainerRef,
      itemIds,
      leadingItemCount,
      columns,
      masonry,
    } = this.props;
    const container = scrollContainerRef.current;
    const candidate = this.pending?.candidates.find(({ dropId }) =>
      itemIds.includes(dropId)
    );
    if (attempt >= MAX_RESTORE_FRAMES && this.props.retainOnContentResize) {
      this.frame = undefined;
      return;
    }
    if (!container || !candidate || attempt >= MAX_RESTORE_FRAMES) {
      this.cancel();
      return;
    }
    const card = Array.from(
      rootRef.current?.querySelectorAll<HTMLElement>(
        "[data-leaderboard-drop-id]"
      ) ?? []
    ).find(
      (element) => element.dataset["leaderboardDropId"] === candidate.dropId
    );
    if (card) {
      const delta =
        card.getBoundingClientRect().top -
        container.getBoundingClientRect().top -
        candidate.offset;
      if (Math.abs(delta) > 0.5)
        container.scrollTo({
          top: container.scrollTop + delta,
          behavior: "instant",
        });
      else {
        if (this.props.retainOnContentResize) this.frame = undefined;
        else this.cancel();
        return;
      }
    } else {
      const logicalIndex = leadingItemCount + itemIds.indexOf(candidate.dropId);
      this.props.revealIndex(
        masonry ? logicalIndex : Math.floor(logicalIndex / columns)
      );
    }
    this.frame = requestAnimationFrame(() => this.restore(attempt + 1));
  }

  override render() {
    return (
      <div
        ref={this.props.rootRef}
        className="tw-w-full tw-min-w-0 tw-@container"
        style={{ overflowAnchor: "none" }}
      >
        {this.props.children}
      </div>
    );
  }
}
