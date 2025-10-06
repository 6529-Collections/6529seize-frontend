import { render } from '@testing-library/react';
import MappingToolPlaceholder from '@/components/mapping-tools/MappingToolPlaceholder';

jest.mock('react-bootstrap', () => ({ Container: (p:any)=> <div>{p.children}</div> }));

it('renders placeholder div with correct class', () => {
  const { container } = render(<MappingToolPlaceholder />);
  const div = container.querySelector('div');
  expect(div).toHaveClass('placeholder');
});
