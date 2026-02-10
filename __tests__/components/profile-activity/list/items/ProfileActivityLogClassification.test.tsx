import React from 'react';
import { render } from '@testing-library/react';
import ProfileActivityLogClassification from '@/components/profile-activity/list/items/ProfileActivityLogClassification';
import { CLASSIFICATIONS } from '@/entities/IProfile';
import { ApiProfileClassification } from '@/generated/models/ApiProfileClassification';

jest.mock('@/components/profile-activity/list/items/utils/ProfileActivityLogItemAction', () => (p: any) => <span>{p.action}</span>);

describe('ProfileActivityLogClassification', () => {
  it('shows change when old value present', () => {
    const log = {
      contents: {
        new_value: ApiProfileClassification.Bot,
        old_value: ApiProfileClassification.Ai,
      },
    } as any;
    const { container } = render(<ProfileActivityLogClassification log={log} />);
    expect(container.textContent).toContain('changed');
    expect(container.textContent).toContain(CLASSIFICATIONS[ApiProfileClassification.Ai].title);
    expect(container.textContent).toContain(CLASSIFICATIONS[ApiProfileClassification.Bot].title);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('shows added when no old value', () => {
    const log = {
      contents: { new_value: ApiProfileClassification.Ai, old_value: null },
    } as any;
    const { container } = render(<ProfileActivityLogClassification log={log} />);
    expect(container.textContent).toContain('added');
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });
});
