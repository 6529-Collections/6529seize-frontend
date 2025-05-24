import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span data-testid="icon" />,
}));

import DateAccordion from '../../../components/common/DateAccordion';

describe('DateAccordion', () => {
  it('shows collapsed content when not expanded and triggers toggle', () => {
    const toggle = jest.fn();
    render(
      <DateAccordion title="Title" isExpanded={false} onToggle={toggle} collapsedContent={<span>info</span>}>
        <div data-testid="child" />
      </DateAccordion>
    );
    expect(screen.getByText('info')).toBeInTheDocument();
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Title'));
    expect(toggle).toHaveBeenCalled();
  });

  it('renders children when expanded', () => {
    render(
      <DateAccordion title="Title" isExpanded={true} onToggle={() => {}} collapsedContent={<span>info</span>}>
        <div data-testid="child" />
      </DateAccordion>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.queryByText('info')).not.toBeInTheDocument();
  });
});
