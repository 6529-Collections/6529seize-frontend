import React from 'react';
import { render } from '@testing-library/react';
import ProfileActivityLogHandle from '../../../../../components/profile-activity/list/items/ProfileActivityLogHandle';

const baseLog = {
  contents: { new_value: 'new', old_value: 'old' }
} as any;

describe('ProfileActivityLogHandle', () => {
  it('shows old and new handle when changed', () => {
    const { container } = render(<ProfileActivityLogHandle log={baseLog} />);
    expect(container.textContent).toContain('handle');
    expect(container.textContent).toContain('old');
    expect(container.textContent).toContain('new');
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('shows created text when no old value', () => {
    const log = { contents: { new_value: 'alice', old_value: '' } } as any;
    const { container } = render(<ProfileActivityLogHandle log={log} />);
    expect(container.textContent).toContain('alice');
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });
});
