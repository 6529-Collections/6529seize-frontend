import { getSharedServerSideProps, getMemeTabTitle, MEME_FOCUS } from '../../../components/the-memes/MemeShared';
import { MEMELAB_CONTRACT } from '../../../constants';
import { fetchUrl } from '../../../services/6529api';

jest.mock('../../../services/6529api', () => ({ fetchUrl: jest.fn() }));

const originalEnv = { ...process.env };

describe('getSharedServerSideProps', () => {
  beforeEach(() => {
    Object.assign(process.env, { API_ENDPOINT:'http://api', BASE_ENDPOINT:'http://base' });
  });
  afterAll(() => { process.env = originalEnv; });

  it('builds props from api response with meme lab contract', async () => {
    (fetchUrl as jest.Mock).mockResolvedValue({ data:[{ name:'Meme', thumbnail:'img.png' }] });
    const req = { query:{ id:'1', focus: MEME_FOCUS.THE_ART } } as any;
    const result = await getSharedServerSideProps(req, MEMELAB_CONTRACT);
    expect(fetchUrl).toHaveBeenCalledWith('http://api/api/nfts_memelab?contract='+MEMELAB_CONTRACT+'&id=1');
    expect(result).toEqual({
      props:{
        id:'1',
        name:'Meme | The Art',
        image:'img.png',
        metadata:{ title:'Meme | The Art', description:'Meme Lab #1', ogImage:'img.png', twitterCard:'summary' }
      }
    });
  });

  it('uses defaults when api returns empty', async () => {
    (fetchUrl as jest.Mock).mockResolvedValue({ data:[] });
    const req = { query:{ id:'2' } } as any;
    const result = await getSharedServerSideProps(req, '0xabc');
    expect(fetchUrl).toHaveBeenCalledWith('http://api/api/nfts?contract=0xabc&id=2');
    expect(result.props.name).toBe('The Memes #2');
    expect(result.props.image).toBe('http://base/6529io.png');
  });
});

describe('getMemeTabTitle', () => {
  it('constructs title with id, nft name and focus', () => {
    const nft = { name:'Card' } as any;
    const title = getMemeTabTitle('The Memes', '3', nft, MEME_FOCUS.COLLECTORS);
    expect(title).toBe('Card | The Memes #3 | Collectors');
  });

  it('returns original title when no extras', () => {
    expect(getMemeTabTitle('The Memes')).toBe('The Memes');
  });
});
