import { renderHook } from '@testing-library/react';
import { useDropPrivileges, SubmissionRestriction, ChatRestriction } from '../..//hooks/useDropPriviledges';

describe('useDropPrivileges', () => {
  it('returns not logged in restrictions', () => {
    const { result } = renderHook(() =>
      useDropPrivileges({
        isLoggedIn: false,
        isProxy: false,
        canChat: true,
        canDrop: true,
        chatDisabled: false,
        submissionStarts: null,
        submissionEnds: null,
        maxDropsCount: null,
        identityDropsCount: null,
      })
    );
    expect(result.current.submissionRestriction).toBe(SubmissionRestriction.NOT_LOGGED_IN);
    expect(result.current.chatRestriction).toBe(ChatRestriction.NOT_LOGGED_IN);
  });

  it('handles submission ended and chat disabled', () => {
    const now = Date.now();
    const { result } = renderHook(() =>
      useDropPrivileges({
        isLoggedIn: true,
        isProxy: false,
        canChat: true,
        canDrop: true,
        chatDisabled: true,
        submissionStarts: now - 1000,
        submissionEnds: now - 500,
        maxDropsCount: null,
        identityDropsCount: null,
      })
    );
    expect(result.current.submissionRestriction).toBe(SubmissionRestriction.ENDED);
    expect(result.current.chatRestriction).toBe(ChatRestriction.DISABLED);
  });
});
