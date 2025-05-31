import { getScaledImageUri, ImageScale } from '../../helpers/image.helpers';

describe('getScaledImageUri', () => {
  it('returns original url for non scalable prefix', () => {
    const url = 'https://example.com/image.png';
    expect(getScaledImageUri(url, ImageScale.W_AUTO_H_50)).toBe(url);
  });

  it('scales known prefix images', () => {
    const url = 'https://d3lqz0a4bldqgf.cloudfront.net/pfp/user/avatar.png?x=1';
    expect(getScaledImageUri(url, ImageScale.W_200_H_200)).toBe(
      `https://d3lqz0a4bldqgf.cloudfront.net/pfp/user/${ImageScale.W_200_H_200}/avatar.png?x=1`
    );
  });

  it('returns original url for unsupported extension', () => {
    const url = 'https://d3lqz0a4bldqgf.cloudfront.net/pfp/user/file.svg';
    expect(getScaledImageUri(url, ImageScale.AUTOx450)).toBe(url);
  });
});
