import { render, screen } from '@testing-library/react';
import React from 'react';
import DropPlaceholder from '../../../components/waves/DropPlaceholder';
import { ChatRestriction, SubmissionRestriction } from '../../../hooks/useDropPriviledges';

describe('DropPlaceholder', () => {
  describe('chat restrictions', () => {
    it('renders not logged in message for chat', () => {
      render(
        <DropPlaceholder 
          type="chat" 
          chatRestriction={ChatRestriction.NOT_LOGGED_IN} 
        />
      );
      
      expect(screen.getByText('Please log in to participate in chat')).toBeInTheDocument();
    });

    it('renders proxy user message for chat', () => {
      render(
        <DropPlaceholder 
          type="chat" 
          chatRestriction={ChatRestriction.PROXY_USER} 
        />
      );
      
      expect(screen.getByText('Proxy users cannot participate in chat')).toBeInTheDocument();
    });

    it('renders no permission message for chat', () => {
      render(
        <DropPlaceholder 
          type="chat" 
          chatRestriction={ChatRestriction.NO_PERMISSION} 
        />
      );
      
      expect(screen.getByText("You don't have permission to chat in this wave")).toBeInTheDocument();
    });

    it('renders disabled message for chat', () => {
      render(
        <DropPlaceholder 
          type="chat" 
          chatRestriction={ChatRestriction.DISABLED} 
        />
      );
      
      expect(screen.getByText('Chat is currently disabled for this wave')).toBeInTheDocument();
    });

    it('applies primary color for not logged in chat restriction', () => {
      render(
        <DropPlaceholder 
          type="chat" 
          chatRestriction={ChatRestriction.NOT_LOGGED_IN} 
        />
      );
      
      const message = screen.getByText('Please log in to participate in chat');
      expect(message).toHaveClass('tw-text-primary-400');
    });
  });

  describe('submission restrictions', () => {
    it('renders not logged in message for submission', () => {
      render(
        <DropPlaceholder 
          type="submission" 
          submissionRestriction={SubmissionRestriction.NOT_LOGGED_IN} 
        />
      );
      
      expect(screen.getByText('Please log in to make submissions')).toBeInTheDocument();
    });

    it('renders proxy user message for submission', () => {
      render(
        <DropPlaceholder 
          type="submission" 
          submissionRestriction={SubmissionRestriction.PROXY_USER} 
        />
      );
      
      expect(screen.getByText('Proxy users cannot make submissions')).toBeInTheDocument();
    });

    it('renders no permission message for submission', () => {
      render(
        <DropPlaceholder 
          type="submission" 
          submissionRestriction={SubmissionRestriction.NO_PERMISSION} 
        />
      );
      
      expect(screen.getByText("You don't have permission to submit in this wave")).toBeInTheDocument();
    });

    it('renders not started message for submission', () => {
      render(
        <DropPlaceholder 
          type="submission" 
          submissionRestriction={SubmissionRestriction.NOT_STARTED} 
        />
      );
      
      expect(screen.getByText("Submissions haven't started yet")).toBeInTheDocument();
    });

    it('renders ended message for submission', () => {
      render(
        <DropPlaceholder 
          type="submission" 
          submissionRestriction={SubmissionRestriction.ENDED} 
        />
      );
      
      expect(screen.getByText('Submission period has ended')).toBeInTheDocument();
    });

    it('renders max drops reached message for submission', () => {
      render(
        <DropPlaceholder 
          type="submission" 
          submissionRestriction={SubmissionRestriction.MAX_DROPS_REACHED} 
        />
      );
      
      expect(screen.getByText('You have reached the maximum number of drops allowed')).toBeInTheDocument();
    });

    it('applies correct colors for submission restrictions', () => {
      const { rerender } = render(
        <DropPlaceholder 
          type="submission" 
          submissionRestriction={SubmissionRestriction.NOT_LOGGED_IN} 
        />
      );
      
      expect(screen.getByText('Please log in to make submissions')).toHaveClass('tw-text-primary-400');

      rerender(
        <DropPlaceholder 
          type="submission" 
          submissionRestriction={SubmissionRestriction.NOT_STARTED} 
        />
      );
      
      expect(screen.getByText("Submissions haven't started yet")).toHaveClass('tw-text-[#FEDF89]');

      rerender(
        <DropPlaceholder 
          type="submission" 
          submissionRestriction={SubmissionRestriction.ENDED} 
        />
      );
      
      expect(screen.getByText('Submission period has ended')).toHaveClass('tw-text-red');

      rerender(
        <DropPlaceholder 
          type="submission" 
          submissionRestriction={SubmissionRestriction.MAX_DROPS_REACHED} 
        />
      );
      
      expect(screen.getByText('You have reached the maximum number of drops allowed')).toHaveClass('tw-text-red');
    });
  });

  describe('both type', () => {
    it('renders generic message for both type', () => {
      render(<DropPlaceholder type="both" />);
      
      expect(screen.getByText('You cannot participate in this wave at the moment')).toBeInTheDocument();
    });
  });

  describe('default cases', () => {
    it('renders default message when no restrictions provided', () => {
      render(<DropPlaceholder type="chat" />);
      
      expect(screen.getByText('Action not available')).toBeInTheDocument();
    });

    it('applies default neutral color', () => {
      render(<DropPlaceholder type="chat" />);
      
      const message = screen.getByText('Action not available');
      expect(message).toHaveClass('tw-text-neutral-400');
    });
  });

  describe('component structure', () => {
    it('renders with correct container classes', () => {
      const { container } = render(<DropPlaceholder type="chat" />);
      
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass(
        'tw-min-h-[48px]',
        'tw-flex',
        'tw-items-center',
        'tw-justify-center',
        'tw-px-4',
        'tw-py-3',
        'tw-bg-neutral-900/50',
        'tw-backdrop-blur',
        'tw-rounded-xl',
        'tw-border',
        'tw-border-neutral-800/50'
      );
    });

    it('renders message with correct text styling', () => {
      render(<DropPlaceholder type="chat" />);
      
      const message = screen.getByText('Action not available');
      expect(message).toHaveClass(
        'tw-text-sm',
        'tw-font-medium',
        'tw-mb-0'
      );
    });
  });

  describe('error handling', () => {
    it('throws error for unhandled chat restriction', () => {
      expect(() => {
        render(
          <DropPlaceholder 
            type="chat" 
            chatRestriction={'INVALID_RESTRICTION' as any} 
          />
        );
      }).toThrow('Unhandled chat restriction: INVALID_RESTRICTION');
    });

    it('throws error for unhandled submission restriction', () => {
      expect(() => {
        render(
          <DropPlaceholder 
            type="submission" 
            submissionRestriction={'INVALID_RESTRICTION' as any} 
          />
        );
      }).toThrow('Unhandled submission restriction: INVALID_RESTRICTION');
    });
  });
});