import IpfsService from '../../../components/ipfs/IPFSService';
jest.mock("form-data", () => { return class { append = jest.fn(); }; });
import axios from 'axios';

jest.mock('axios');
const axiosPostMock = axios.post as jest.Mock;

describe('IpfsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('adds file to ipfs and returns cid', async () => {
    const service = new IpfsService({ apiEndpoint: 'http://api' });
    const file = new File(['a'], 'a.txt', { type: 'text/plain' });
    axiosPostMock.mockResolvedValueOnce({ data: { Hash: 'cid123' } });
    const cid = await service.addFile(file);
    expect(cid).toBe('cid123');
    expect(axiosPostMock).toHaveBeenCalledWith('http://api/api/v0/add?pin=true', expect.any(Object));
  });

  it('creates mfs directory on init', async () => {
    const service = new IpfsService({ apiEndpoint: 'http://api', mfsPath: 'files' });
    axiosPostMock.mockResolvedValueOnce(null);
    await service.init();
    expect(axiosPostMock).toHaveBeenCalledWith('http://api/api/v0/files/mkdir?arg=/files&parents=true');
  });

  it('copies file to mfs when not existing', async () => {
    const service = new IpfsService({ apiEndpoint: 'http://api', mfsPath: 'files' });
    const file = new File(['data'], 'img.png', { type: 'image/png' });
    axiosPostMock
      .mockResolvedValueOnce({ data: { Hash: 'cid456' } }) // add
      .mockRejectedValueOnce(new Error('missing')) // stat
      .mockResolvedValueOnce(null); // cp
    const cid = await service.addFile(file);
    expect(cid).toBe('cid456');
    expect(axiosPostMock).toHaveBeenNthCalledWith(1, 'http://api/api/v0/add?pin=true', expect.any(Object));
    expect(axiosPostMock).toHaveBeenNthCalledWith(2, 'http://api/api/v0/files/stat?arg=/files/cid456.png');
    expect(axiosPostMock).toHaveBeenNthCalledWith(3, 'http://api/api/v0/files/cp?arg=/ipfs/cid456&arg=/files/cid456.png');
  });
});
