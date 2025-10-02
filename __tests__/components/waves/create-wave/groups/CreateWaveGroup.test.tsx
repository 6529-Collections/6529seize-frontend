import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWaveGroup from '@/components/waves/create-wave/groups/CreateWaveGroup';
import {
  CreateWaveGroupConfigType,
  WaveGroupsConfig,
} from '@/types/waves.types';
import { ApiWaveType } from '@/generated/models/ApiWaveType';
import { ApiGroupFull } from '@/generated/models/ApiGroupFull';

// Mock dependencies
jest.mock('@/components/utils/radio/CommonBorderedRadioButton', () => {
  return function CommonBorderedRadioButton({ type, selected, disabled, label, onChange }: any) {
    const handleClick = () => {
      if (!disabled && onChange) {
        onChange(type);
      }
    };
    
    return (
      <div data-testid={`radio-${type}`} onClick={handleClick}>
        <input
          type="radio"
          checked={selected === type}
          disabled={disabled}
          aria-label={label}
          readOnly
        />
        <label>{label}</label>
      </div>
    );
  };
});

jest.mock('@/components/waves/create-wave/groups/CreateWaveGroupItem', () => {
  return function CreateWaveGroupItem({ selectedGroup, disabled, switchSelected, onSelectedClick }: any) {
    return (
      <div data-testid="group-item">
        {selectedGroup ? (
          <button onClick={onSelectedClick} disabled={disabled}>
            {selectedGroup.name}
          </button>
        ) : (
          <button onClick={() => switchSelected('GROUP')} disabled={disabled}>
            Select Group
          </button>
        )}
      </div>
    );
  };
});

jest.mock('@/components/utils/select-group/SelectGroupModalWrapper', () => {
  return function SelectGroupModalWrapper({ isOpen, onClose, onGroupSelect }: any) {
    if (!isOpen) return null;
    
    const mockGroup = {
      id: 'test-group-id',
      name: 'Test Group',
      description: 'Test group description',
    };
    
    return (
      <div data-testid="select-group-modal">
        <button onClick={() => onGroupSelect(mockGroup)}>Select Test Group</button>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

jest.mock('@/components/waves/create-wave/utils/CreateWaveToggle', () => {
  return function CreateWaveToggle({ enabled, onChange, label }: any) {
    return (
      <div data-testid="wave-toggle">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked)}
          aria-label={label}
        />
        <label>{label}</label>
      </div>
    );
  };
});

// Mock constants
jest.mock('@/helpers/waves/waves.constants', () => {
  const { CreateWaveGroupConfigType } = jest.requireActual('../../../../../types/waves.types');
  const { ApiWaveType } = jest.requireActual('../../../../../generated/models/ApiWaveType');
  
  return {
    CREATE_WAVE_NONE_GROUP_LABELS: {
      [CreateWaveGroupConfigType.ADMIN]: 'Only me',
      [CreateWaveGroupConfigType.CAN_VIEW]: 'Anyone',
      [CreateWaveGroupConfigType.CAN_DROP]: 'Anyone',
      [CreateWaveGroupConfigType.CAN_VOTE]: 'Anyone',
      [CreateWaveGroupConfigType.CAN_CHAT]: 'Anyone',
    },
    CREATE_WAVE_SELECT_GROUP_LABELS: {
      [ApiWaveType.Approve]: {
        [CreateWaveGroupConfigType.ADMIN]: 'Admin',
        [CreateWaveGroupConfigType.CAN_VIEW]: 'Who can view',
        [CreateWaveGroupConfigType.CAN_DROP]: 'Who can drop',
        [CreateWaveGroupConfigType.CAN_VOTE]: 'Who can vote',
        [CreateWaveGroupConfigType.CAN_CHAT]: 'Who can chat',
      },
      [ApiWaveType.Rank]: {
        [CreateWaveGroupConfigType.ADMIN]: 'Admin',
        [CreateWaveGroupConfigType.CAN_VIEW]: 'Who can view',
        [CreateWaveGroupConfigType.CAN_DROP]: 'Who can drop',
        [CreateWaveGroupConfigType.CAN_VOTE]: 'Who can vote',
        [CreateWaveGroupConfigType.CAN_CHAT]: 'Who can chat',
      },
      [ApiWaveType.Chat]: {
        [CreateWaveGroupConfigType.ADMIN]: 'Admin',
        [CreateWaveGroupConfigType.CAN_VIEW]: 'Who can view',
        [CreateWaveGroupConfigType.CAN_DROP]: 'Who can drop',
        [CreateWaveGroupConfigType.CAN_VOTE]: 'Who can rate',
        [CreateWaveGroupConfigType.CAN_CHAT]: 'Who can chat',
      },
    },
  };
});

describe('CreateWaveGroup', () => {
  const mockOnGroupSelect = jest.fn();
  const mockSetChatEnabled = jest.fn();
  const mockSetDropsAdminCanDelete = jest.fn();

  const mockGroup: ApiGroupFull = {
    id: 'group-1',
    name: 'Test Group',
    description: 'Test group description',
  } as ApiGroupFull;

  const defaultGroups: WaveGroupsConfig = {
    admin: null,
    canView: null,
    canDrop: null,
    canVote: null,
    canChat: null,
  };

  const defaultProps = {
    waveType: ApiWaveType.Approve,
    groupType: CreateWaveGroupConfigType.CAN_DROP,
    chatEnabled: false,
    adminCanDeleteDrops: false,
    setChatEnabled: mockSetChatEnabled,
    onGroupSelect: mockOnGroupSelect,
    groupsCache: {},
    groups: defaultGroups,
    setDropsAdminCanDelete: mockSetDropsAdminCanDelete,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(<CreateWaveGroup {...defaultProps} {...props} />);
  };

  it('renders with correct title for group type', () => {
    renderComponent();
    
    expect(screen.getByText('Who can drop')).toBeInTheDocument();
  });

  it('renders radio button options', () => {
    renderComponent();
    
    expect(screen.getByTestId('radio-NONE')).toBeInTheDocument();
    expect(screen.getByTestId('group-item')).toBeInTheDocument();
  });

  it('shows chat toggle for non-chat waves with CAN_CHAT group type', () => {
    renderComponent({
      groupType: CreateWaveGroupConfigType.CAN_CHAT,
      waveType: ApiWaveType.Approve,
    });
    
    expect(screen.getByTestId('wave-toggle')).toBeInTheDocument();
    expect(screen.getByLabelText('Enable chat')).toBeInTheDocument();
  });

  it('does not show chat toggle for chat waves', () => {
    renderComponent({
      groupType: CreateWaveGroupConfigType.CAN_CHAT,
      waveType: ApiWaveType.Chat,
    });
    
    expect(screen.queryByTestId('wave-toggle')).not.toBeInTheDocument();
  });

  it('shows admin delete toggle for admin group type in non-chat waves', () => {
    renderComponent({
      groupType: CreateWaveGroupConfigType.ADMIN,
      waveType: ApiWaveType.Approve,
    });
    
    expect(screen.getByLabelText('Allow admins to delete drops')).toBeInTheDocument();
  });

  it('shows admin delete description when toggle is enabled', () => {
    renderComponent({
      groupType: CreateWaveGroupConfigType.ADMIN,
      waveType: ApiWaveType.Approve,
      adminCanDeleteDrops: true,
    });
    
    expect(screen.getByText(/Admins will be able to delete drops/)).toBeInTheDocument();
  });

  it('handles chat toggle change', async () => {
    const user = userEvent.setup();
    renderComponent({
      groupType: CreateWaveGroupConfigType.CAN_CHAT,
      waveType: ApiWaveType.Approve,
    });
    
    const chatToggle = screen.getByLabelText('Enable chat');
    await user.click(chatToggle);
    
    expect(mockSetChatEnabled).toHaveBeenCalledWith(true);
  });

  it('handles admin delete toggle change', async () => {
    const user = userEvent.setup();
    renderComponent({
      groupType: CreateWaveGroupConfigType.ADMIN,
      waveType: ApiWaveType.Approve,
    });
    
    const adminToggle = screen.getByLabelText('Allow admins to delete drops');
    await user.click(adminToggle);
    
    expect(mockSetDropsAdminCanDelete).toHaveBeenCalledWith(true);
  });

  it('disables options when chat is disabled for CAN_CHAT group type', () => {
    renderComponent({
      groupType: CreateWaveGroupConfigType.CAN_CHAT,
      waveType: ApiWaveType.Approve,
      chatEnabled: false,
    });
    
    const radioInput = screen.getByLabelText('Anyone');
    expect(radioInput).toBeDisabled();
  });

  it('handles group selection from modal', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    // Click select group button
    await user.click(screen.getByText('Select Group'));
    
    // Modal should appear
    expect(screen.getByTestId('select-group-modal')).toBeInTheDocument();
    
    // Select a group
    await user.click(screen.getByText('Select Test Group'));
    
    expect(mockOnGroupSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'test-group-id',
        name: 'Test Group',
      })
    );
  });

  it('handles modal close', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    // Click select group button
    await user.click(screen.getByText('Select Group'));
    
    // Close modal
    await user.click(screen.getByText('Close'));
    
    // Modal should be gone
    expect(screen.queryByTestId('select-group-modal')).not.toBeInTheDocument();
  });

  it('initializes with selected group from cache', () => {
    const groupsWithSelection = {
      ...defaultGroups,
      canDrop: 'group-1',
    };
    
    const groupsCache = {
      'group-1': mockGroup,
    };
    
    renderComponent({
      groups: groupsWithSelection,
      groupsCache,
    });
    
    expect(screen.getByText('Test Group')).toBeInTheDocument();
  });

  it('handles radio button selection change', async () => {
    renderComponent();
    
    const noneRadioContainer = screen.getByTestId('radio-NONE');
    fireEvent.click(noneRadioContainer);
    
    expect(mockOnGroupSelect).toHaveBeenCalledWith(null);
  });

  it('handles clearing selected group', async () => {
    const user = userEvent.setup();
    const groupsWithSelection = {
      ...defaultGroups,
      canDrop: 'group-1',
    };
    
    const groupsCache = {
      'group-1': mockGroup,
    };
    
    renderComponent({
      groups: groupsWithSelection,
      groupsCache,
    });
    
    // Click on the selected group to clear it
    await user.click(screen.getByText('Test Group'));
    
    // This should trigger onSelectedClick which clears the selection
    expect(screen.getByText('Select Group')).toBeInTheDocument();
  });

  it('renders correct labels for different wave types', () => {
    renderComponent({
      waveType: ApiWaveType.Rank,
      groupType: CreateWaveGroupConfigType.CAN_VOTE,
    });
    
    expect(screen.getByText('Who can vote')).toBeInTheDocument();
  });

  it('shows modal when group is selected but not found in cache', () => {
    renderComponent();
    
    // Initially no modal
    expect(screen.queryByTestId('select-group-modal')).not.toBeInTheDocument();
    
    // This would happen when the group item switches to GROUP status without a selectedGroup
    const groupItem = screen.getByTestId('group-item');
    const button = groupItem.querySelector('button');
    if (button) {
      fireEvent.click(button);
    }
    
    // Now modal should appear
    expect(screen.getByTestId('select-group-modal')).toBeInTheDocument();
  });
});