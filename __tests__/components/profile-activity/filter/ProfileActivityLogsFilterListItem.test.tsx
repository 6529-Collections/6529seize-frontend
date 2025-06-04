import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfileActivityLogsFilterListItem from '../../../../components/profile-activity/filter/ProfileActivityLogsFilterListItem';
import { ProfileActivityLogType } from '../../../../entities/IProfile';

describe('ProfileActivityLogsFilterListItem', () => {
  const props = {
    itemType: ProfileActivityLogType.PFP_EDIT,
    selectedItems: [],
    setSelected: jest.fn(),
    user: 'alice'
  };

  it('calls setSelected on click', () => {
    render(<ProfileActivityLogsFilterListItem {...props} />);
    fireEvent.click(screen.getByRole('button'));
    expect(props.setSelected).toHaveBeenCalledWith(ProfileActivityLogType.PFP_EDIT);
  });

  it('updates checkmark based on selectedItems', () => {
    const { rerender, container } = render(<ProfileActivityLogsFilterListItem {...props} />);
    expect(container.querySelectorAll('svg').length).toBe(1);
    rerender(
      <ProfileActivityLogsFilterListItem
        {...props}
        selectedItems={[ProfileActivityLogType.PFP_EDIT]}
      />
    );
    expect(container.querySelectorAll('svg').length).toBe(2);
  });
});
