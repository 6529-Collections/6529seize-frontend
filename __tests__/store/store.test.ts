import { wrapper } from '@/store/store';

describe('Redux store', () => {
  it('has wrapper defined', () => {
    expect(wrapper).toBeDefined();
  });

  it('has store creation capability', () => {
    expect(wrapper.useWrappedStore).toBeDefined();
  });

  it('wrapper has expected methods', () => {
    expect(wrapper.getServerSideProps).toBeDefined();
    expect(wrapper.getStaticProps).toBeDefined();
    expect(wrapper.useWrappedStore).toBeDefined();
  });
});