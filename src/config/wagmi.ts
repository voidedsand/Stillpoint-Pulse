import { Attribution } from 'ox/erc8021'
import { createConfig, http } from 'wagmi'
import { base } from 'wagmi/chains'
import { baseAccount, injected } from 'wagmi/connectors'

// After registration on base.dev, paste the Builder Code between the quotes.
const deployedBuilderCode = ''
export const BUILDER_CODE = import.meta.env.VITE_BUILDER_CODE || deployedBuilderCode

export const DATA_SUFFIX = BUILDER_CODE
  ? Attribution.toDataSuffix({ codes: [BUILDER_CODE] })
  : undefined

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    injected({ shimDisconnect: true }),
    baseAccount({ appName: 'Stillpoint' }),
  ],
  transports: {
    [base.id]: http('https://mainnet.base.org'),
  },
  ...(DATA_SUFFIX ? { dataSuffix: DATA_SUFFIX } : {}),
})

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}
