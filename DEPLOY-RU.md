# Как запустить Stillpoint

## 1. Деплой контракта через Remix

1. Открой `contracts/Stillpoint.sol` и целиком вставь его в новый файл Remix.
2. В `Solidity Compiler` выбери версию `0.8.24`.
3. Optimizer можно включить с `200 runs`. `viaIR` не требуется.
4. В MetaMask выбери `Base Mainnet`, chain ID `8453`.
5. В `Deploy & Run Transactions` выбери `Injected Provider - MetaMask`.
6. Нажми `Deploy`. Конструктор не принимает никаких параметров.
7. Скопируй адрес развернутого контракта.

## 2. Адрес контракта

Открой `src/config/contract.ts` и замени только эту строку:

```ts
const deployedAddress = '0x0000000000000000000000000000000000000000'
```

на адрес из Remix.

## 3. Base App ID

После создания приложения на base.dev открой `index.html` и замени:

```html
<meta name="base:app_id" content="REPLACE_WITH_BASE_APP_ID" />
```

## 4. Builder Code

Открой `src/config/wagmi.ts` и вставь код сюда:

```ts
const deployedBuilderCode = 'bc_твой_код'
```

Builder Code подключен через официальный ERC-8021 `dataSuffix` на уровне Wagmi. Он применяется к транзакциям из Base Account, MetaMask и Rabby.

## 5. Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- Node version: `20`

Настройки уже находятся в `netlify.toml`, поэтому обычно Netlify определит их автоматически.
