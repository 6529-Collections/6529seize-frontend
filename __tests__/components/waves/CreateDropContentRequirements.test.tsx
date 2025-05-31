import { render } from '@testing-library/react';
import React from 'react';
import CreateDropContentRequirements from '../../../components/waves/CreateDropContentRequirements';

let itemProps: any[] = [];
jest.mock('../../../components/waves/CreateDropContentRequirementsItem', () => (props: any) => {
  itemProps.push(props);
  return <div data-testid="item" />;
});

describe('CreateDropContentRequirements', () => {
  beforeEach(() => { itemProps = []; });
  const wave = { participation: { required_media: ['PNG'], required_metadata: ['name'] } } as any;

  it('renders requirement items when allowed', () => {
    render(
      <CreateDropContentRequirements
        canSubmit={true}
        wave={wave}
        missingMedia={['PNG']}
        missingMetadata={["name"]}
        disabled={false}
        onOpenMetadata={jest.fn()}
        setFiles={jest.fn()}
      />
    );
    expect(itemProps.length).toBe(2);
  });

  it('renders nothing when cannot submit', () => {
    const { container } = render(
      <CreateDropContentRequirements
        canSubmit={false}
        wave={wave}
        missingMedia={[]}
        missingMetadata={[]}
        disabled={false}
        onOpenMetadata={jest.fn()}
        setFiles={jest.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
