import { ApiWaveType } from '@/generated/models/ApiWaveType';
import { formatAddress, isValidEthAddress } from '@/helpers/Helpers';

interface FormatWaveNameArgs {
  readonly name: string;
  readonly type: ApiWaveType;
}

const ADDRESS_LENGTH = 42;
const CHAT_ADDRESS_MARKER = 'id-';
const ADDRESS_PREFIX = `${CHAT_ADDRESS_MARKER}0x`;

export const formatWaveName = ({ name, type }: FormatWaveNameArgs): string => {
  if (type !== ApiWaveType.Chat) {
    return name;
  }

  const markerIndex = name.indexOf(ADDRESS_PREFIX);
  if (markerIndex === -1) {
    return name;
  }

  const prefix = name.slice(0, markerIndex + CHAT_ADDRESS_MARKER.length);
  const addressStart = markerIndex + CHAT_ADDRESS_MARKER.length;
  const candidateAddress = name.slice(addressStart, addressStart + ADDRESS_LENGTH);

  if (!isValidEthAddress(candidateAddress)) {
    return name;
  }

  const suffix = name.slice(addressStart + candidateAddress.length);
  return `${prefix}${formatAddress(candidateAddress)}${suffix}`;
};
