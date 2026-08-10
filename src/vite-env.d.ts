/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STILLPOINT_CONTRACT_ADDRESS?: `0x${string}`
  readonly VITE_BUILDER_CODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
