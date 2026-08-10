# Stillpoint

A minimal daily state journal on Base Mainnet. Users can record up to five states per UTC day and make one separate daily check-in. The contract charges no app fee and accepts no payment; users only pay Base network gas.

## Deploy

1. Deploy `contracts/Stillpoint.sol` in Remix using Solidity `0.8.24` and Base Mainnet.
2. Put the deployed address in `src/config/contract.ts` or set `VITE_STILLPOINT_CONTRACT_ADDRESS` in Netlify.
3. Register the app at Base.dev and replace the `base:app_id` value in `index.html`.
4. Put the Builder Code in `src/config/wagmi.ts` or set `VITE_BUILDER_CODE` in Netlify.
5. Deploy to Netlify with build command `npm run build` and publish directory `dist`.

## Local development

```bash
npm install
npm run dev
```
