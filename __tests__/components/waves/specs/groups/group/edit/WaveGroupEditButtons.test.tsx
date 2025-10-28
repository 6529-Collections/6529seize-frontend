import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WaveGroupEditButtons from '@/components/waves/specs/groups/group/edit/WaveGroupEditButtons';
import { WaveGroupType } from '@/components/waves/specs/groups/group/WaveGroup.types';
import { AuthContext } from '@/components/auth/Auth';
import { ReactQueryWrapperContext } from '@/components/react-query-wrapper/ReactQueryWrapper';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useMutation: jest.fn(),
    useQuery: jest.fn(),
    useQueryClient: jest.fn(),
  };
});
jest.mock('@/components/waves/specs/groups/group/edit/WaveGroupEditButton', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: React.forwardRef(({ onWaveUpdate, renderTrigger }: any, ref) => {
      const handleOpen = () => onWaveUpdate({});
      React.useImperativeHandle(ref, () => ({ open: handleOpen }), [handleOpen]);
      if (renderTrigger === null) {
        return null;
      }
      return renderTrigger ? <>{renderTrigger({ open: handleOpen })}</> : <button onClick={handleOpen}>edit</button>;
    }),
  };
});

jest.mock('@/components/waves/specs/groups/group/edit/WaveGroupRemoveButton', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: React.forwardRef(({ onWaveUpdate, renderTrigger }: any, ref) => {
      const handleOpen = () => onWaveUpdate({});
      React.useImperativeHandle(ref, () => ({ open: handleOpen }), [handleOpen]);
      if (renderTrigger === null) {
        return null;
      }
      return renderTrigger ? <>{renderTrigger({ open: handleOpen })}</> : <button onClick={handleOpen}>remove</button>;
    }),
  };
});

jest.mock('@/components/waves/specs/groups/group/edit/WaveGroupManageIdentitiesModal', () => ({
  __esModule: true,
  WaveGroupManageIdentitiesMode: {
    INCLUDE: 'INCLUDE',
    EXCLUDE: 'EXCLUDE',
  },
  default: ({ mode, onClose }: any) => (
    <div data-testid={`${mode.toLowerCase()}-modal`}>
      <button onClick={onClose}>close</button>
    </div>
  ),
}));

jest.mock('@/components/distribution-plan-tool/common/CircleLoader', () => ({
  __esModule: true,
  default: () => <div data-testid="loader" />,
}));

const mutateAsync = jest.fn();
const createQueryClientMock = () => ({
  setQueryData: jest.fn(),
  ensureQueryData: jest.fn().mockImplementation(async ({ queryFn }: any) => {
    return queryFn ? await queryFn({ signal: undefined }) : undefined;
  }),
  fetchQuery: jest.fn().mockImplementation(async ({ queryFn }: any) => {
    return queryFn ? await queryFn({ signal: undefined }) : undefined;
  }),
});

let queryClientMock = createQueryClientMock();

const auth = {
  setToast: jest.fn(),
  requestAuth: jest.fn().mockResolvedValue({ success: true }),
  connectedProfile: { id: "profile-1", handle: "alice" },
} as any;

const wrapper = ({ children }: any) => (
  <AuthContext.Provider value={auth}>
    <ReactQueryWrapperContext.Provider value={{ onWaveCreated: jest.fn() }}>
      {children}
    </ReactQueryWrapperContext.Provider>
  </AuthContext.Provider>
);

const baseGroup = {
  id: "group-1",
  name: "Group 1",
  author: { id: "profile-1", handle: "alice" },
  created_at: Date.now(),
  is_hidden: false,
  is_direct_message: false,
};

const wave: any = {
  id: "w1",
  visibility: { scope: { group: baseGroup } },
  participation: {
    scope: { group: baseGroup },
    authenticated_user_eligible: true,
  },
  voting: {
    scope: { group: baseGroup },
    authenticated_user_eligible: true,
  },
  chat: {
    scope: { group: baseGroup },
    authenticated_user_eligible: true,
  },
  wave: {
    admin_group: { group: baseGroup },
    authenticated_user_eligible_for_admin: true,
  },
};

describe('WaveGroupEditButtons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mutateAsync.mockReset();
    queryClientMock = createQueryClientMock();
    (useMutation as jest.Mock).mockReturnValue({ mutateAsync });
    (useQuery as jest.Mock).mockImplementation(({ enabled, queryFn }) => {
      if (enabled && typeof queryFn === 'function') {
        void queryFn({ signal: undefined });
      }
      return { data: undefined };
    });
    (useQueryClient as jest.Mock).mockReturnValue(queryClientMock);
  });

  it('opens menu and calls mutate on edit', async () => {
    render(<WaveGroupEditButtons haveGroup wave={wave} type={WaveGroupType.VIEW} />, { wrapper });
    fireEvent.click(screen.getByRole('button', { name: /Group options/i }));
    fireEvent.click(screen.getByText('Change group'));
    await waitFor(() => expect(auth.requestAuth).toHaveBeenCalled());
    expect(mutateAsync).toHaveBeenCalled();
  });

  it('shows error toast when auth fails', async () => {
    auth.requestAuth.mockResolvedValueOnce({ success: false });
    render(<WaveGroupEditButtons haveGroup wave={wave} type={WaveGroupType.VIEW} />, { wrapper });
    fireEvent.click(screen.getByRole('button', { name: /Group options/i }));
    fireEvent.click(screen.getByText('Change group'));
    await waitFor(() => expect(auth.setToast).toHaveBeenCalled());
  });

  it('hides remove option for admin type', async () => {
    render(<WaveGroupEditButtons haveGroup wave={wave} type={WaveGroupType.ADMIN} />, { wrapper });
    fireEvent.click(screen.getByRole('button', { name: /Group options/i }));
    expect(screen.getByText('Change group')).toBeInTheDocument();
    expect(screen.queryByText('Remove group')).toBeNull();
  });

  it('shows add label when no group is linked', async () => {
    const waveWithoutGroup = {
      ...wave,
      visibility: {
        ...wave.visibility,
        scope: { group: null },
      },
    };

    render(
      <WaveGroupEditButtons haveGroup={false} wave={waveWithoutGroup} type={WaveGroupType.VIEW} />,
      { wrapper },
    );

    fireEvent.click(screen.getByRole('button', { name: /Group options/i }));

    expect(screen.getByText('Add group')).toBeInTheDocument();
    expect(screen.queryByText('Change group')).toBeNull();
  });
});
jest.mock('@headlessui/react', () => {
  const close = jest.fn();
  return {
    Menu: ({ children, ...props }: any) => (
      <div {...props}>
        {typeof children === 'function'
          ? children({ open: false, close })
          : children}
      </div>
    ),
    MenuButton: React.forwardRef<HTMLButtonElement, any>(({ children, ...props }, ref) => (
      <button ref={ref} {...props}>{children}</button>
    )),
    MenuItems: ({ children, anchor: _anchor, ...props }: any) => <div {...props}>{children}</div>,
    MenuItem: ({ children }: any) => children({ close, active: false }),
    Transition: ({ children }: any) => <>{typeof children === 'function' ? children() : children}</>,
  };
});
