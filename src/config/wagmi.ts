import { Attribution } from 'ox/erc8021'
import { createConfig, http } from 'wagmi'
import { base } from 'wagmi/chains'
import { baseAccount, injected } from 'wagmi/connectors'

const deployedBuilderCode = 'bc_3jesd3jg'

export const BUILDER_CODE =
  import.meta.env.VITE_BUILDER_CODE || deployedBuilderCode

export const DATA_SUFFIX = Attribution.toDataSuffix({
  codes: [BUILDER_CODE],
})

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    injected({
      shimDisconnect: true,
    }),
    baseAccount({
      appName: 'Stillpoint',
    }),
  ],
  transports: {
    [base.id]: http('https://mainnet.base.org'),
  },
  dataSuffix: DATA_SUFFIX,
})

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}
