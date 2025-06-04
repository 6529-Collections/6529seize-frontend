import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import ClientOnly from '../../../components/client-only/ClientOnly';

describe('ClientOnly', () => {
  it('renders children only after mount', async () => {
    render(
      <ClientOnly>
        <div data-testid="child">hello</div>
      </ClientOnly>
    );
    await waitFor(() => expect(screen.getByTestId('child')).toBeInTheDocument());
  });
});
