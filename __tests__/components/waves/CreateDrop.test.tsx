import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { DropMutationBody } from '@/components/waves/CreateDrop';
import CreateDrop from '@/components/waves/CreateDrop';
import { AuthContext } from '@/components/auth/Auth';
import { ReactQueryWrapperContext } from '@/components/react-query-wrapper/ReactQueryWrapper';

jest.mock('@tanstack/react-query', () => ({ useMutation: (fn: any)=>({ mutateAsync: jest.fn(fn.mutationFn) }) }));
jest.mock('@/hooks/useProgressiveDebounce', () => ({ useProgressiveDebounce: (cb: any)=> { setTimeout(cb, 0); } }));
jest.mock('@/contexts/wave/MyStreamContext', () => ({ useMyStream: ()=>({ processDropRemoved: jest.fn() }) }));
jest.mock('@/components/waves/CreateDropStormParts', () => () => <div data-testid="storm" />);
jest.mock('@/components/waves/CreateDropContent', () => (props: any) => (
  <button onClick={() => props.submitDrop({ drop:{ wave_id:'1'}, dropId:null } as DropMutationBody)}>
    submit
  </button>
));

const wave = { chat:{ authenticated_user_eligible:true }, participation:{ authenticated_user_eligible:true } } as any;

it('processes queued drop and calls mutation', async () => {
  const onDropAdded = jest.fn();
  const waitAndInvalidateDrops = jest.fn();
  render(
    <AuthContext.Provider value={{ setToast: jest.fn() } as any}>
      <ReactQueryWrapperContext.Provider value={{ waitAndInvalidateDrops }}>
        <CreateDrop
          activeDrop={null}
          onCancelReplyQuote={() => {}}
          onDropAddedToQueue={onDropAdded}
          wave={wave}
          dropId={null}
          fixedDropMode={0 as any}
          privileges={{} as any}
        />
      </ReactQueryWrapperContext.Provider>
    </AuthContext.Provider>
  );

  await userEvent.click(screen.getByText('submit'));

  await waitFor(() => expect(onDropAdded).toHaveBeenCalled());
  
  // Wait for debounced callback to execute
  await new Promise(resolve => setTimeout(resolve, 10));
  await waitFor(() => expect(waitAndInvalidateDrops).toHaveBeenCalled());
});
