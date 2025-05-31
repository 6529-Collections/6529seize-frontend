import React from 'react';
import { render } from '@testing-library/react';
import WaveGroupTitle from '../../../../../../components/waves/specs/groups/group/WaveGroupTitle';
import { WaveGroupType } from '../../../../../../components/waves/specs/groups/group/WaveGroup';

describe('WaveGroupTitle', () => {
  it('renders label for each type', () => {
    Object.values(WaveGroupType).forEach((type) => {
      const { container } = render(<WaveGroupTitle type={type as WaveGroupType} />);
      expect(container.textContent).toBe(type.charAt(0) + type.slice(1).toLowerCase());
    });
  });
});
