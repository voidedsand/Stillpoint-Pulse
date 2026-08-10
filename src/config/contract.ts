import { zeroAddress, type Address } from 'viem'

// After Remix deployment, paste the Base Mainnet address here.
const deployedAddress = '0x0000000000000000000000000000000000000000'
const configuredAddress = import.meta.env.VITE_STILLPOINT_CONTRACT_ADDRESS
const activeAddress = configuredAddress || deployedAddress

export const isContractConfigured = Boolean(
  /^0x[a-fA-F0-9]{40}$/.test(activeAddress) &&
    activeAddress.toLowerCase() !== zeroAddress,
)

export const STILLPOINT_ADDRESS = (
  isContractConfigured ? activeAddress : zeroAddress
) as Address

export const stillpointAbi = [
  {
    type: 'function',
    name: 'recordState',
    inputs: [{ name: 'state', type: 'uint8' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'dailyCheckIn',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'statsOf',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      {
        name: 'stats',
        type: 'tuple',
        components: [
          { name: 'totalEntries', type: 'uint64' },
          { name: 'totalCheckIns', type: 'uint64' },
          { name: 'streak', type: 'uint32' },
          { name: 'lastCheckInDay', type: 'uint64' },
          { name: 'todayEntries', type: 'uint8' },
          { name: 'lastEntryDay', type: 'uint64' },
          { name: 'lastState', type: 'uint8' },
          { name: 'lastEntryAt', type: 'uint64' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'globalEntries',
    inputs: [],
    outputs: [{ name: '', type: 'uint64' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'globalCheckIns',
    inputs: [],
    outputs: [{ name: '', type: 'uint64' }],
    stateMutability: 'view',
  },
] as const
