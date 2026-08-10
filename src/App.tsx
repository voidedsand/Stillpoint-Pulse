import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleDot,
  Flame,
  LogOut,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react'
import { encodeFunctionData, zeroAddress, type Address } from 'viem'
import { base } from 'wagmi/chains'
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  useReadContract,
  useSendTransaction,
  useSwitchChain,
  useWaitForTransactionReceipt,
} from 'wagmi'
import {
  isContractConfigured,
  STILLPOINT_ADDRESS,
  stillpointAbi,
} from './config/contract'
import { DATA_SUFFIX } from './config/wagmi'

const states = [
  { name: 'Quiet', note: 'Low and inward', color: '#aeb8c2', ring: 18 },
  { name: 'Soft', note: 'Taking it slowly', color: '#a9c9bd', ring: 32 },
  { name: 'Steady', note: 'Present and balanced', color: '#7d9dff', ring: 48 },
  { name: 'Open', note: 'Ready for more', color: '#f4b769', ring: 64 },
  { name: 'Bright', note: 'Full of momentum', color: '#ff755f', ring: 82 },
] as const

type Profile = {
  totalEntries: bigint
  totalCheckIns: bigint
  streak: number
  lastCheckInDay: bigint
  todayEntries: number
  lastEntryDay: bigint
  lastState: number
  lastEntryAt: bigint
}

type PendingAction = 'state' | 'checkin' | null

function shortAddress(address?: Address) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''
}

function todayUtc() {
  return Math.floor(Date.now() / 86_400_000)
}

function App() {
  const [selected, setSelected] = useState(2)
  const [walletOpen, setWalletOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [notice, setNotice] = useState('')

  const { address, isConnected, isReconnecting } = useAccount()
  const chainId = useChainId()
  const { connectors, connect, isPending: isConnecting } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain()

  const {
    data: hash,
    sendTransactionAsync,
    isPending: isSending,
    error: sendError,
    reset: resetTransaction,
  } = useSendTransaction()

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
      chainId: base.id,
    })

  const readEnabled =
    isConnected && isContractConfigured && Boolean(address)

  const {
    data: profileData,
    refetch: refetchProfile,
  } = useReadContract({
    address: STILLPOINT_ADDRESS,
    abi: stillpointAbi,
    functionName: 'statsOf',
    args: [address || zeroAddress],
    chainId: base.id,
    query: {
      enabled: readEnabled,
      refetchInterval: 12_000,
    },
  })

  const {
    data: globalEntries,
    refetch: refetchEntries,
  } = useReadContract({
    address: STILLPOINT_ADDRESS,
    abi: stillpointAbi,
    functionName: 'globalEntries',
    chainId: base.id,
    query: {
      enabled: isContractConfigured,
      refetchInterval: 15_000,
    },
  })

  const {
    data: globalCheckIns,
    refetch: refetchCheckIns,
  } = useReadContract({
    address: STILLPOINT_ADDRESS,
    abi: stillpointAbi,
    functionName: 'globalCheckIns',
    chainId: base.id,
    query: {
      enabled: isContractConfigured,
      refetchInterval: 15_000,
    },
  })

  const profile = profileData as Profile | undefined
  const checkedIn =
    Number(profile?.lastCheckInDay || 0n) === todayUtc()
  const entriesToday = Number(profile?.todayEntries || 0)
  const selectedState = states[selected]
  const busy = isSending || isConfirming || isSwitching

  const statusText = useMemo(() => {
    if (isSwitching) return 'Switching to Base...'
    if (isSending) return 'Confirm in your wallet...'
    if (isConfirming) return 'Settling on Base...'

    if (isConfirmed && pendingAction === 'state') {
      return 'State recorded'
    }

    if (isConfirmed && pendingAction === 'checkin') {
      return 'Checked in for today'
    }

    return ''
  }, [
    isSwitching,
    isSending,
    isConfirming,
    isConfirmed,
    pendingAction,
  ])

  useEffect(() => {
    if (!isConfirmed) return

    void Promise.all([
      refetchProfile(),
      refetchEntries(),
      refetchCheckIns(),
    ])
  }, [
    isConfirmed,
    refetchProfile,
    refetchEntries,
    refetchCheckIns,
  ])

  useEffect(() => {
    if (!sendError) return

    setNotice(sendError.message.split('\n')[0])
    setPendingAction(null)
  }, [sendError])

  async function ensureBase() {
    if (chainId !== base.id) {
      await switchChainAsync({
        chainId: base.id,
      })
    }
  }

  async function runAction(
    action: Exclude<PendingAction, null>,
  ) {
    setNotice('')
    resetTransaction()

    if (!isConnected) {
      setWalletOpen(true)
      return
    }

    if (!isContractConfigured) {
      setNotice(
        'Add the deployed contract address in src/config/contract.ts.',
      )
      return
    }

    try {
      await ensureBase()
      setPendingAction(action)

      const data = encodeFunctionData({
        abi: stillpointAbi,
        functionName:
          action === 'state' ? 'recordState' : 'dailyCheckIn',
        args: action === 'state' ? [selected] : [],
      })

      await sendTransactionAsync({
        to: STILLPOINT_ADDRESS,
        data,
        dataSuffix: DATA_SUFFIX,
        chainId: base.id,
      })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Transaction cancelled.'

      setNotice(message.split('\n')[0])
      setPendingAction(null)
    }
  }

  function connectWallet(connectorIndex: number) {
    const connector = connectors[connectorIndex]

    if (!connector) return

    connect(
      {
        connector,
        chainId: base.id,
      },
      {
        onSuccess: () => setWalletOpen(false),
      },
    )
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a
          className="brand"
          href="#top"
          aria-label="Stillpoint home"
        >
          <span className="brand-mark">
            <span />
          </span>
          <span>Stillpoint</span>
        </a>

        {isConnected ? (
          <button
            className="wallet-chip"
            onClick={() => disconnect()}
            title="Disconnect wallet"
          >
            <span className="wallet-status" />
            <span>{shortAddress(address)}</span>
            <LogOut size={15} strokeWidth={1.8} />
          </button>
        ) : (
          <button
            className="connect-button"
            onClick={() => setWalletOpen(true)}
          >
            <Wallet size={17} strokeWidth={1.8} />
            Connect
          </button>
        )}
      </header>

      <main id="top">
        <section className="intro">
          <p className="eyebrow">A daily moment on Base</p>

          <h1>
            How are you,
            <br />
            right now?
          </h1>

          <p className="intro-copy">
            Choose the state that feels closest. Leave one quiet
            signal onchain.
          </p>
        </section>

        <section
          className="state-studio"
          aria-label="Choose your current state"
        >
          <div className="orb-stage">
            <div
              className="state-orb"
              style={
                {
                  '--state-color': selectedState.color,
                  '--state-ring': `${selectedState.ring}%`,
                } as React.CSSProperties
              }
            >
              <span className="orb-core" />
            </div>

            <div className="state-name" aria-live="polite">
              <strong>{selectedState.name}</strong>
              <span>{selectedState.note}</span>
            </div>
          </div>

          <div className="state-selector">
            {states.map((state, index) => (
              <button
                key={state.name}
                className={
                  index === selected
                    ? 'state-option active'
                    : 'state-option'
                }
                onClick={() => setSelected(index)}
                aria-label={`Choose ${state.name}`}
                aria-pressed={index === selected}
              >
                <span
                  className="state-dot"
                  style={{ background: state.color }}
                />
                <span>{state.name}</span>
              </button>
            ))}
          </div>

          <button
            className="primary-action"
            onClick={() => void runAction('state')}
            disabled={busy || entriesToday >= 5}
          >
            <span>
              {entriesToday >= 5
                ? 'Five moments recorded'
                : `Record ${selectedState.name.toLowerCase()}`}
            </span>

            {busy && pendingAction === 'state' ? (
              <span className="spinner" />
            ) : (
              <ArrowRight size={20} />
            )}
          </button>

          <div className="daily-cap">
            <span>{entriesToday} of 5 today</span>

            <div className="cap-dots" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((item) => (
                <span
                  key={item}
                  className={
                    item < entriesToday ? 'filled' : ''
                  }
                />
              ))}
            </div>
          </div>
        </section>

        <section className="checkin-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Daily continuity</p>
              <h2>Return to yourself.</h2>
            </div>

            <span className="utc-label">
              Resets 00:00 UTC
            </span>
          </div>

          <div className="checkin-row">
            <div
              className={
                checkedIn
                  ? 'checkin-symbol complete'
                  : 'checkin-symbol'
              }
            >
              {checkedIn ? (
                <Check size={27} />
              ) : (
                <CircleDot size={27} />
              )}
            </div>

            <div className="checkin-copy">
              <strong>
                {checkedIn
                  ? 'Today is complete'
                  : 'Daily check-in'}
              </strong>

              <span>
                {checkedIn
                  ? 'Come back tomorrow to continue.'
                  : 'Keep a simple, unbroken rhythm.'}
              </span>
            </div>

            <button
              className="checkin-button"
              onClick={() => void runAction('checkin')}
              disabled={busy || checkedIn}
              aria-label="Daily check-in"
            >
              {busy && pendingAction === 'checkin' ? (
                <span className="spinner dark" />
              ) : checkedIn ? (
                <Check size={20} />
              ) : (
                <ChevronRight size={22} />
              )}
            </button>
          </div>

          <div className="metrics">
            <div className="metric">
              <Flame size={20} strokeWidth={1.7} />
              <span>Current streak</span>
              <strong>
                {Number(profile?.streak || 0)}
              </strong>
            </div>

            <div className="metric">
              <Sparkles size={20} strokeWidth={1.7} />
              <span>Your moments</span>
              <strong>
                {Number(profile?.totalEntries || 0n)}
              </strong>
            </div>
          </div>
        </section>

        <section className="community-strip">
          <div>
            <span>Collective moments</span>
            <strong>
              {Number(globalEntries || 0n).toLocaleString()}
            </strong>
          </div>

          <div>
            <span>Daily returns</span>
            <strong>
              {Number(globalCheckIns || 0n).toLocaleString()}
            </strong>
          </div>

          <p>
            No app fee. No token. Only Base network gas.
          </p>
        </section>

        {(statusText ||
          notice ||
          !isContractConfigured) && (
          <div
            className={
              notice || !isContractConfigured
                ? 'toast error'
                : 'toast'
            }
            role="status"
          >
            {notice ||
              (!isContractConfigured
                ? 'Contract address required in src/config/contract.ts.'
                : statusText)}
          </div>
        )}
      </main>

      <footer>
        <span>Stillpoint</span>
        <span>Built on Base</span>
      </footer>

      {walletOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={() => setWalletOpen(false)}
        >
          <div
            className="wallet-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wallet-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setWalletOpen(false)}
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <span className="modal-symbol">
              <Wallet size={23} strokeWidth={1.6} />
            </span>

            <p className="eyebrow">Continue on Base</p>
            <h2 id="wallet-title">Choose a wallet</h2>

            <p className="modal-copy">
              Connect to record your daily state and check-in.
            </p>

            <div className="wallet-options">
              <button
                onClick={() => connectWallet(1)}
                disabled={isConnecting || isReconnecting}
              >
                <span className="wallet-logo base-logo">
                  B
                </span>

                <span>
                  <strong>Base Account</strong>
                  <small>Coinbase smart wallet</small>
                </span>

                <ChevronRight size={21} />
              </button>

              <button
                onClick={() => connectWallet(0)}
                disabled={isConnecting || isReconnecting}
              >
                <span className="wallet-logo browser-logo">
                  <Wallet size={20} />
                </span>

                <span>
                  <strong>Browser wallet</strong>
                  <small>MetaMask, Rabby and more</small>
                </span>

                <ChevronRight size={21} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
