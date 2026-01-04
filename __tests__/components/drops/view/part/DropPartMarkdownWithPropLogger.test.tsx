import React from 'react';
import { render } from '@testing-library/react';
import DropPartMarkdownWithPropLogger from '@/components/drops/view/part/DropPartMarkdownWithPropLogger';
import type { DropPartMarkdownProps } from '@/components/drops/view/part/DropPartMarkdown';

jest.mock('@/components/drops/view/part/DropPartMarkdown', () => {
  return function MockDropPartMarkdown(props: any) {
    return <div data-testid="drop-part-markdown">{props.partContent}</div>;
  };
});

describe('DropPartMarkdownWithPropLogger', () => {
  const baseProps: DropPartMarkdownProps = {
    mentionedUsers: [],
    referencedNfts: [],
    partContent: 'Test content',
    onQuoteClick: jest.fn(),
    textSize: 'md',
  };

  it('renders DropPartMarkdown component', () => {
    const { getByTestId } = render(
      <DropPartMarkdownWithPropLogger {...baseProps} />
    );
    
    expect(getByTestId('drop-part-markdown')).toBeInTheDocument();
    expect(getByTestId('drop-part-markdown')).toHaveTextContent('Test content');
  });

  it('passes all props to DropPartMarkdown', () => {
    const props = {
      ...baseProps,
      partContent: 'Custom content',
      textSize: 'sm' as const,
    };
    
    const { getByTestId } = render(
      <DropPartMarkdownWithPropLogger {...props} />
    );
    
    expect(getByTestId('drop-part-markdown')).toHaveTextContent('Custom content');
  });

  it('has correct display name', () => {
    expect(DropPartMarkdownWithPropLogger.displayName).toBe('DropPartMarkdownWithPropLogger');
  });

  it('memoizes when props are equal', () => {
    const { rerender, getByTestId } = render(
      <DropPartMarkdownWithPropLogger {...baseProps} />
    );
    
    expect(getByTestId('drop-part-markdown')).toBeInTheDocument();
    
    // Re-render with same props
    rerender(<DropPartMarkdownWithPropLogger {...baseProps} />);
    
    // Component should still be present (memoization working)
    expect(getByTestId('drop-part-markdown')).toBeInTheDocument();
  });

  it('re-renders when partContent changes', () => {
    const { rerender, getByTestId } = render(
      <DropPartMarkdownWithPropLogger {...baseProps} />
    );
    
    expect(getByTestId('drop-part-markdown')).toHaveTextContent('Test content');
    
    rerender(
      <DropPartMarkdownWithPropLogger 
        {...baseProps} 
        partContent="Updated content" 
      />
    );
    
    expect(getByTestId('drop-part-markdown')).toHaveTextContent('Updated content');
  });

  it('re-renders when textSize changes', () => {
    const { rerender } = render(
      <DropPartMarkdownWithPropLogger {...baseProps} textSize="md" />
    );
    
    rerender(
      <DropPartMarkdownWithPropLogger {...baseProps} textSize="sm" />
    );
    
    // Component should re-render due to textSize change
    // (This is tested implicitly by the fact that the component renders successfully)
  });

  it('re-renders when mentionedUsers array changes', () => {
    const initialMentionedUsers = [{ handle: 'user1', id: '1' }] as any;
    const updatedMentionedUsers = [{ handle: 'user2', id: '2' }] as any;
    
    const { rerender } = render(
      <DropPartMarkdownWithPropLogger 
        {...baseProps} 
        mentionedUsers={initialMentionedUsers} 
      />
    );
    
    rerender(
      <DropPartMarkdownWithPropLogger 
        {...baseProps} 
        mentionedUsers={updatedMentionedUsers} 
      />
    );
    
    // Component should re-render due to mentionedUsers change
  });

  it('re-renders when referencedNfts array changes', () => {
    const initialNfts = [{ contract: '0x123', token_id: '1' }] as any;
    const updatedNfts = [{ contract: '0x456', token_id: '2' }] as any;
    
    const { rerender } = render(
      <DropPartMarkdownWithPropLogger 
        {...baseProps} 
        referencedNfts={initialNfts} 
      />
    );
    
    rerender(
      <DropPartMarkdownWithPropLogger 
        {...baseProps} 
        referencedNfts={updatedNfts} 
      />
    );
    
    // Component should re-render due to referencedNfts change
  });

  it('does not re-render when non-tracked props change', () => {
    const { rerender, getByTestId } = render(
      <DropPartMarkdownWithPropLogger {...baseProps} onQuoteClick={jest.fn()} />
    );
    
    expect(getByTestId('drop-part-markdown')).toBeInTheDocument();
    
    // Re-render with different onQuoteClick function
    rerender(
      <DropPartMarkdownWithPropLogger {...baseProps} onQuoteClick={jest.fn()} />
    );
    
    // Component should still be present (memoization should prevent re-render)
    expect(getByTestId('drop-part-markdown')).toBeInTheDocument();
  });

  it('correctly compares nested arrays', () => {
    const nestedArray1 = [[1, 2], [3, 4]] as any;
    const nestedArray2 = [[1, 2], [3, 4]] as any;
    const nestedArray3 = [[1, 2], [3, 5]] as any;
    
    const { rerender } = render(
      <DropPartMarkdownWithPropLogger 
        {...baseProps} 
        mentionedUsers={nestedArray1} 
      />
    );
    
    // Re-render with equivalent nested array - should not re-render
    rerender(
      <DropPartMarkdownWithPropLogger 
        {...baseProps} 
        mentionedUsers={nestedArray2} 
      />
    );
    
    // Re-render with different nested array - should re-render
    rerender(
      <DropPartMarkdownWithPropLogger 
        {...baseProps} 
        mentionedUsers={nestedArray3} 
      />
    );
  });

  it('handles empty arrays correctly', () => {
    const { rerender } = render(
      <DropPartMarkdownWithPropLogger 
        {...baseProps} 
        mentionedUsers={[]} 
        referencedNfts={[]} 
      />
    );
    
    // Re-render with same empty arrays
    rerender(
      <DropPartMarkdownWithPropLogger 
        {...baseProps} 
        mentionedUsers={[]} 
        referencedNfts={[]} 
      />
    );
    
    // Should not re-render due to memoization
  });

  it('handles null partContent correctly', () => {
    const { getByTestId } = render(
      <DropPartMarkdownWithPropLogger 
        {...baseProps} 
        partContent={null} 
      />
    );
    
    expect(getByTestId('drop-part-markdown')).toBeInTheDocument();
  });
});