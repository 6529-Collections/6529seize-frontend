import React from 'react';
import { render, screen } from '@testing-library/react';
import ProfileActivityLogBanner from '../../../../../components/profile-activity/list/items/ProfileActivityLogBanner';
import { ProfileActivityLogType } from '../../../../../entities/IProfile';

describe('ProfileActivityLogBanner', () => {
  it('renders added banner when no old value', () => {
    const log: any = {
      type: ProfileActivityLogType.BANNER_1_EDIT,
      contents: { new_value: '#000' }
    };
    const { container } = render(<ProfileActivityLogBanner log={log} />);
    expect(screen.getByText('added')).toBeInTheDocument();
    expect(screen.getByText('Banner 1')).toBeInTheDocument();
    const spans = container.querySelectorAll('span[style]');
    expect(spans).toHaveLength(1);
    expect(spans[0].style.backgroundColor).toBe('rgb(0, 0, 0)');
  });

  it('renders changed banner when old value exists', () => {
    const log: any = {
      type: ProfileActivityLogType.BANNER_2_EDIT,
      contents: { new_value: '#111', old_value: '#222' }
    };
    const { container } = render(<ProfileActivityLogBanner log={log} />);
    expect(screen.getByText('changed')).toBeInTheDocument();
    expect(screen.getByText('Banner 2')).toBeInTheDocument();
    const spans = container.querySelectorAll('span[style]');
    expect(spans).toHaveLength(2);
    expect(spans[0].style.backgroundColor).toBe('rgb(34, 34, 34)');
    expect(spans[1].style.backgroundColor).toBe('rgb(17, 17, 17)');
  });
});
