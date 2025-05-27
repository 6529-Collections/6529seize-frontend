import { render } from '@testing-library/react';
import UserPageCollectedFiltersCollection from '../../../../../components/user/collected/filters/UserPageCollectedFiltersCollection';
import { CollectedCollectionType } from '../../../../../entities/IProfile';

let capturedProps: any = null;
jest.mock('../../../../../components/utils/select/CommonSelect', () => (props: any) => {
  capturedProps = props;
  return <div data-testid="select" />;
});

describe('UserPageCollectedFiltersCollection', () => {
  beforeEach(() => { capturedProps = null; });

  it('passes all collection options including "All"', () => {
    render(<UserPageCollectedFiltersCollection selected={null} setSelected={jest.fn()} />);
    const values = capturedProps.items.map((i: any) => i.value);
    expect(values).toEqual([null, ...Object.values(CollectedCollectionType)]);
    expect(capturedProps.activeItem).toBeNull();
  });

  it('sets activeItem from props', () => {
    render(<UserPageCollectedFiltersCollection selected={CollectedCollectionType.MEMES} setSelected={jest.fn()} />);
    expect(capturedProps.activeItem).toBe(CollectedCollectionType.MEMES);
  });
});
