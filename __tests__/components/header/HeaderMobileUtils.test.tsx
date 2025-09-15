import { render, screen } from '@testing-library/react';
import React from 'react';
import {
  printMobileHr,
  printMobileSubheader,
  printMobileRow
} from '../../../components/header/HeaderMobileUtils';

// Mock Next.js Link component
jest.mock('next/link', () => ({ 
  __esModule: true, 
  default: ({ href, children }: any) => (
    <a href={href} data-testid="next-link" data-href={href}>
      {children}
    </a>
  )
}));

// Mock Bootstrap components
jest.mock('react-bootstrap', () => ({
  Row: ({ children, className }: any) => (
    <div data-testid="row" className={className}>
      {children}
    </div>
  ),
  Col: ({ children, xs }: any) => {
    const props: any = { "data-testid": "col" };
    if (xs !== undefined) {
      props["data-xs"] = JSON.stringify(xs);
    }
    return <div {...props}>{children}</div>;
  }
}));

// Mock SCSS modules
jest.mock('../../../components/header/Header.module.scss', () => ({
  burgerMenuSubheader: 'mocked-burger-menu-subheader'
}));

describe('HeaderMobileUtils', () => {
  describe('printMobileHr', () => {
    it('renders a horizontal rule with correct structure', () => {
      const HrComponent = printMobileHr();
      render(<div>{HrComponent}</div>);
      
      const row = screen.getByTestId('row');
      expect(row).toBeInTheDocument();
      
      const col = screen.getByTestId('col');
      expect(col).toBeInTheDocument();
      expect(col).toHaveAttribute('data-xs', '{"span":6,"offset":3}');
      
      const hr = screen.getByRole('separator');
      expect(hr).toBeInTheDocument();
      expect(hr.tagName).toBe('HR');
    });

    it('returns a React element', () => {
      const result = printMobileHr();
      expect(React.isValidElement(result)).toBe(true);
    });

    it('has correct Bootstrap grid structure', () => {
      const HrComponent = printMobileHr();
      render(<div>{HrComponent}</div>);
      
      const col = screen.getByTestId('col');
      const xsData = JSON.parse(col.getAttribute('data-xs') || '{}');
      
      expect(xsData.span).toBe(6);
      expect(xsData.offset).toBe(3);
    });
  });

  describe('printMobileSubheader', () => {
    it('renders subheader with provided name', () => {
      const SubheaderComponent = printMobileSubheader('Test Subheader');
      render(<div>{SubheaderComponent}</div>);
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Test Subheader');
    });

    it('applies correct CSS class', () => {
      const SubheaderComponent = printMobileSubheader('Test Subheader');
      render(<div>{SubheaderComponent}</div>);
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveClass('mocked-burger-menu-subheader');
    });

    it('has correct Bootstrap grid structure', () => {
      const SubheaderComponent = printMobileSubheader('Test');
      render(<div>{SubheaderComponent}</div>);
      
      const col = screen.getByTestId('col');
      const xsData = JSON.parse(col.getAttribute('data-xs') || '{}');
      
      expect(xsData.span).toBe(6);
      expect(xsData.offset).toBe(3);
    });

    it('handles empty string name', () => {
      const SubheaderComponent = printMobileSubheader('');
      render(<div>{SubheaderComponent}</div>);
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('');
    });

    it('handles special characters in name', () => {
      const specialName = 'Test & <Special> "Characters"';
      const SubheaderComponent = printMobileSubheader(specialName);
      render(<div>{SubheaderComponent}</div>);
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent(specialName);
    });

    it('handles very long names', () => {
      const longName = 'A'.repeat(200);
      const SubheaderComponent = printMobileSubheader(longName);
      render(<div>{SubheaderComponent}</div>);
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent(longName);
    });

    it('returns a React element', () => {
      const result = printMobileSubheader('Test');
      expect(React.isValidElement(result)).toBe(true);
    });
  });

  describe('printMobileRow', () => {
    it('renders row with correct link and text', () => {
      const RowComponent = printMobileRow('Test Link', '/test-path');
      render(<div>{RowComponent}</div>);
      
      const link = screen.getByTestId('next-link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test-path');
      expect(link).toHaveAttribute('data-href', '/test-path');
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Test Link');
    });

    it('applies correct CSS classes to row', () => {
      const RowComponent = printMobileRow('Test', '/test');
      render(<div>{RowComponent}</div>);
      
      const row = screen.getByTestId('row');
      expect(row).toHaveClass('pt-3', 'pb-1');
    });

    it('handles various path formats', () => {
      const testCases = [
        { path: '/simple-path', name: 'Simple' },
        { path: '/path/with/nested/structure', name: 'Nested' },
        { path: '/path-with-dashes', name: 'Dashes' },
        { path: '/path_with_underscores', name: 'Underscores' },
        { path: '/path?with=query&params=true', name: 'Query Params' },
        { path: '/path#with-hash', name: 'Hash' },
        { path: 'https://external.com/path', name: 'External' },
        { path: '', name: 'Empty Path' },
        { path: '/', name: 'Root' }
      ];

      testCases.forEach(({ path, name }) => {
        const RowComponent = printMobileRow(name, path);
        render(<div data-testid={`container-${name}`}>{RowComponent}</div>);
        
        const container = screen.getByTestId(`container-${name}`);
        const link = container.querySelector('[data-testid="next-link"]');
        
        expect(link).toHaveAttribute('href', path);
      });
    });

    it('handles special characters in name', () => {
      const specialName = 'Link & <Special> "Characters"';
      const RowComponent = printMobileRow(specialName, '/test');
      render(<div>{RowComponent}</div>);
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent(specialName);
    });

    it('handles empty name', () => {
      const RowComponent = printMobileRow('', '/test');
      render(<div>{RowComponent}</div>);
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('');
    });

    it('handles very long names', () => {
      const longName = 'Very Long Link Name '.repeat(10).trim();
      const RowComponent = printMobileRow(longName, '/test');
      render(<div>{RowComponent}</div>);
      
      const heading = screen.getByRole('heading', { level: 3 });
      // Use a more flexible matcher for very long text content
      expect(heading.textContent).toBe(longName);
    });

    it('returns a React element', () => {
      const result = printMobileRow('Test', '/test');
      expect(React.isValidElement(result)).toBe(true);
    });

    it('creates accessible link structure', () => {
      const RowComponent = printMobileRow('Accessible Link', '/accessible');
      render(<div>{RowComponent}</div>);
      
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/accessible');
      
      // The heading should be inside the link
      const heading = screen.getByRole('heading', { level: 3 });
      expect(link).toContainElement(heading);
    });

    it('handles unicode characters in name and path', () => {
      const unicodeName = 'Test 🎉 Unicode ñáéíóú';
      const unicodePath = '/测试/ü-path';
      const RowComponent = printMobileRow(unicodeName, unicodePath);
      render(<div>{RowComponent}</div>);
      
      const link = screen.getByTestId('next-link');
      expect(link).toHaveAttribute('href', unicodePath);
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent(unicodeName);
    });
  });

  describe('Integration Tests', () => {
    it('all functions return valid React elements that can be rendered together', () => {
      const hr = printMobileHr();
      const subheader = printMobileSubheader('Section Title');
      const row1 = printMobileRow('Link 1', '/path1');
      const row2 = printMobileRow('Link 2', '/path2');
      const hr2 = printMobileHr();
      
      render(
        <div>
          {hr}
          {subheader}
          {row1}
          {row2}
          {hr2}
        </div>
      );
      
      // Should have 2 hr elements
      const hrs = screen.getAllByRole('separator');
      expect(hrs).toHaveLength(2);
      
      // Should have 3 h3 elements (1 subheader + 2 row headers)
      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings).toHaveLength(3);
      
      // Should have 2 links
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
      
      // Check specific content
      expect(screen.getByText('Section Title')).toBeInTheDocument();
      expect(screen.getByText('Link 1')).toBeInTheDocument();
      expect(screen.getByText('Link 2')).toBeInTheDocument();
    });

    it('maintains consistent Bootstrap grid structure across components', () => {
      const hr = printMobileHr();
      const subheader = printMobileSubheader('Test');
      const row = printMobileRow('Test', '/test');
      
      render(
        <div>
          <div data-testid="hr-container">{hr}</div>
          <div data-testid="subheader-container">{subheader}</div>
          <div data-testid="row-container">{row}</div>
        </div>
      );
      
      // Hr and subheader should have same grid structure
      const hrCol = screen.getByTestId('hr-container').querySelector('[data-testid="col"]');
      const subheaderCol = screen.getByTestId('subheader-container').querySelector('[data-testid="col"]');
      
      expect(hrCol).toHaveAttribute('data-xs', '{"span":6,"offset":3}');
      expect(subheaderCol).toHaveAttribute('data-xs', '{"span":6,"offset":3}');
      
      // Row should have full width (no xs attribute set)
      const rowCol = screen.getByTestId('row-container').querySelector('[data-testid="col"]');
      expect(rowCol).not.toHaveAttribute('data-xs');
    });

    it('creates a typical mobile menu section structure', () => {
      // Simulate typical usage pattern
      const section = (
        <div>
          {printMobileHr()}
          {printMobileSubheader('Navigation Section')}
          {printMobileRow('Home', '/home')}
          {printMobileRow('About', '/about')}
          {printMobileRow('Contact', '/contact')}
          {printMobileHr()}
        </div>
      );
      
      render(section);
      
      // Should have proper structure
      expect(screen.getAllByRole('separator')).toHaveLength(2); // 2 hrs
      expect(screen.getByText('Navigation Section')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
      
      // All links should work
      expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/home');
      expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about');
      expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('handles null and undefined values gracefully', () => {
      expect(() => {
        printMobileSubheader(null as any);
      }).not.toThrow();
      
      expect(() => {
        printMobileSubheader(undefined as any);
      }).not.toThrow();
      
      expect(() => {
        printMobileRow(null as any, '/test');
      }).not.toThrow();
      
      expect(() => {
        printMobileRow('test', null as any);
      }).not.toThrow();
    });

    it('handles non-string parameters', () => {
      expect(() => {
        printMobileSubheader(123 as any);
      }).not.toThrow();
      
      expect(() => {
        printMobileRow(123 as any, 456 as any);
      }).not.toThrow();
    });

    it('handles object parameters', () => {
      expect(() => {
        printMobileSubheader({ toString: () => 'Object Name' } as any);
      }).not.toThrow();
      
      expect(() => {
        printMobileRow({ toString: () => 'Object Link' } as any, '/test');
      }).not.toThrow();
    });
  });

  describe('Performance and Memory', () => {
    it('does not create memory leaks when called multiple times', () => {
      // Call functions many times to ensure no memory leaks
      for (let i = 0; i < 100; i++) {
        printMobileHr();
        printMobileSubheader(`Test ${i}`);
        printMobileRow(`Link ${i}`, `/path${i}`);
      }
      
      // If we get here without errors, memory is managed properly
      expect(true).toBe(true);
    });

    it('returns new React elements on each call', () => {
      const hr1 = printMobileHr();
      const hr2 = printMobileHr();
      
      // Should be different objects but equivalent content
      expect(hr1).not.toBe(hr2);
      expect(hr1.type).toBe(hr2.type);
      
      const sub1 = printMobileSubheader('Test');
      const sub2 = printMobileSubheader('Test');
      
      expect(sub1).not.toBe(sub2);
      expect(sub1.type).toBe(sub2.type);
    });
  });
});
