import { useState, useEffect } from 'react';
import { useQuery, gql, useLazyQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import styles from './DashboardPage.module.css';
import { useNotification } from '../hooks/useNotification';

const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      wallets {
        id
        address
        network
        createdAt
      }
    }
  }
`;

const BALANCE_QUERY = gql`
  query Balance($address: String!, $network: Network!) {
    balance(address: $address, network: $network) {
      address
      balance
      balanceInWei
      network
      lastUpdated
    }
  }
`;

const TRANSACTION_HISTORY_QUERY = gql`
  query TransactionHistory($address: String!, $network: Network!, $limit: Int) {
    transactionHistory(address: $address, network: $network, limit: $limit) {
      id
      transactionHash
      from
      to
      amount
      amountInEther
      status
      network
      blockNumber
      createdAt
    }
  }
`;

function DashboardPage() {
  const { loading, error, data, refetch } = useQuery(ME_QUERY);
  const [balances, setBalances] = useState<Record<string, { balance: string; loading: boolean; error?: string; lastUpdated?: Date }>>({});
  const [latestTransactions, setLatestTransactions] = useState<any[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [getBalance] = useLazyQuery(BALANCE_QUERY);
  const [getTransactionHistory] = useLazyQuery(TRANSACTION_HISTORY_QUERY);
  const { showNotification } = useNotification();

  const user = data?.me;
  const wallets = user?.wallets || [];
  console.log(wallets);

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch((err) => {
      alert('Failed to copy address: ' + err);
      console.error('Failed to copy address:', err);
    });
  };
  const checkBalance = async (address: string, network: string) => {
    // Prevent multiple simultaneous requests for the same address
    const currentBalance = balances[address];
    if (currentBalance?.loading) {
      return; // Already loading, skip
    }

    setBalances((prev) => ({ ...prev, [address]: { balance: prev[address]?.balance || '0', loading: true, error: undefined } }));

    try {
      // Add timeout to prevent infinite hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout: Balance check took too long')), 30000);
      });

      const queryPromise = getBalance({
        variables: { address, network: network.toUpperCase() },
        fetchPolicy: 'network-only', // Always fetch fresh data
      });

      const { data: balanceData, error: queryError } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (queryError) {
        throw new Error(queryError.message || 'Failed to fetch balance');
      }

      if (balanceData?.balance) {
        setBalances((prev) => ({
          ...prev,
          [address]: {
            balance: parseFloat(balanceData.balance.balance).toFixed(8),
            loading: false,
            lastUpdated: new Date(balanceData.balance.lastUpdated),
            error: undefined,
          },
        }));
      } else {
        // No balance data returned, set loading to false with error
        setBalances((prev) => ({
          ...prev,
          [address]: {
            balance: prev[address]?.balance || '0',
            loading: false,
            error: 'No balance data received',
          },
        }));
      }
    } catch (err: any) {
      console.error('Balance check error:', err);

      // Handle rate limiting specifically
      const isRateLimited = err.networkError?.statusCode === 429 ||
        err.message?.includes('429') ||
        err.message?.includes('rate limit');

      if (isRateLimited) {
        showNotification(
          'Rate limit exceeded. Please wait a moment before checking balances again.',
          'warning'
        );
      }

      setBalances((prev) => ({
        ...prev,
        [address]: {
          balance: prev[address]?.balance || '0',
          loading: false,
          error: isRateLimited
            ? 'Rate limit exceeded. Please wait a moment and try again.'
            : err.message || 'Failed to fetch balance',
        },
      }));
    }
  };

  // Auto-load balances for all wallets when wallets are loaded (with throttling)
  useEffect(() => {
    if (wallets.length > 0 && !loading) {
      // Throttle balance checks - load one at a time with delay to avoid rate limiting
      wallets.forEach((wallet: any, index: number) => {
        const networkKey = wallet.network.toLowerCase() === 'testnet' ? 'testnet' : 'mainnet';
        const walletBalance = balances[wallet.address];
        // Only auto-load if not already loaded and not currently loading
        if ((!walletBalance || !walletBalance.lastUpdated) && !walletBalance?.loading) {
          // Stagger requests to avoid rate limiting (500ms delay between each)
          setTimeout(() => {
            checkBalance(wallet.address, networkKey);
          }, index * 500);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallets.length, loading]);

  // Load latest transactions from all wallets (with throttling and delay)
  useEffect(() => {
    const loadLatestTransactions = async () => {
      if (wallets.length === 0) {
        setLatestTransactions([]);
        return;
      }

      // Delay transaction loading to avoid rate limiting (wait 2 seconds after balance checks)
      await new Promise(resolve => setTimeout(resolve, 2000));

      setTransactionsLoading(true);
      try {
        const allTransactions: any[] = [];

        // Fetch transactions from each wallet (limit 5 per wallet) with throttling
        for (let i = 0; i < wallets.length; i++) {
          const wallet = wallets[i];
          try {
            // Add delay between requests to avoid rate limiting
            if (i > 0) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }

            const networkKey = wallet.network.toLowerCase() === 'testnet' ? 'testnet' : 'mainnet';
            const { data: txData } = await getTransactionHistory({
              variables: {
                address: wallet.address,
                network: networkKey,
                limit: 5,
              },
            });

            if (txData?.transactionHistory) {
              allTransactions.push(...txData.transactionHistory);
            }
          } catch (err: any) {
            // Handle rate limiting errors gracefully
            if (err.networkError?.statusCode === 429) {
              showNotification(
                'Rate limit exceeded while loading transactions. Some transactions may not be displayed.',
                'warning'
              );
              break; // Stop trying more wallets if rate limited
            }
            console.error(`Failed to load transactions for wallet ${wallet.address}:`, err);
          }
        }

        // Sort by date (newest first) and take top 10
        const sorted = allTransactions.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });

        setLatestTransactions(sorted.slice(0, 10));
      } catch (err) {
        console.error('Failed to load transactions:', err);
      } finally {
        setTransactionsLoading(false);
      }
    };

    loadLatestTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallets.length]);

  const getTotalBalance = () => {
    return wallets.reduce((total: number, wallet: any) => {
      const balance = parseFloat(balances[wallet.address]?.balance || '0');
      return total + balance;
    }, 0);
  };

  const getWalletColor = (index: number) => {
    const colors = ['btc', 'usdt', 'eth'];
    return colors[index % colors.length];
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getStatusClass = (status: string) => {
    if (status.toLowerCase().includes('success') || status.toLowerCase().includes('confirmed')) {
      return styles.statusSuccess;
    }
    if (status.toLowerCase().includes('pending') || status.toLowerCase().includes('queue')) {
      return styles.statusPending;
    }
    return styles.statusError;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorMessage}>
          <svg className={styles.errorIcon} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.container}>
        {/* Welcome Section */}
        <div className={styles.welcomeSection}>
          <h1 className={styles.welcomeText}>Welcome, {user?.email?.split('@')[0] || 'User'}</h1>
        </div>

        {/* Main Content */}
        <div className={styles.mainContent}>
          {/* My Wallets Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>My wallets</h2>
              <button onClick={() => refetch()} className={styles.refreshButton}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <div className={styles.totalBalance}>
              <div className={styles.totalBalanceHeader}>
                <svg className={styles.totalBalanceIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.599.402-2.599 1M15 8.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5z" />
                </svg>
                <span className={styles.totalLabel}>Total Balance</span>
              </div>
              <div className={styles.totalAmount}>
                $ {getTotalBalance().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className={styles.totalSubtext}>
                Across all wallets
              </div>
              {/* Action Buttons and Total Balance */}
              <div className={styles.actionButtons}>
                <Link to="/send-funds" className={styles.sendButton}>
                  Send
                </Link>
                <Link to="/create-wallet" className={styles.createWalletButton}>
                  Create Wallet
                </Link>
              </div>
            </div>


            {wallets.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyText}>No wallets yet. Create your first wallet to get started!</p>
                <Link to="/create-wallet" className={styles.createButton}>
                  Create Wallet
                </Link>
              </div>
            ) : (
              <>
                <div className={styles.walletCards}>
                  {wallets.map((wallet: any, index: number) => {
                    const walletBalance = balances[wallet.address];
                    const networkKey = wallet.network.toLowerCase() === 'testnet' ? 'testnet' : 'mainnet';
                    const colorClass = getWalletColor(index);
                    const balanceValue = parseFloat(walletBalance?.balance || '0');
                    const usdValue = balanceValue * 2000; // Mock conversion rate

                    return (
                      <div key={wallet.id} className={`${styles.walletCard} ${styles[colorClass]}`}>
                        <div className={styles.walletCardHeader}>
                          <div className={styles.ratesSection}>
                            <div className={styles.ratesLabel}>RATES</div>
                            <div className={styles.rateValue}>1.00 ETH = $ {usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            <div className={styles.rateChange}>+1.06% 24 hours</div>
                          </div>
                          <div className={styles.graphPlaceholder}>
                            <svg viewBox="0 0 100 40" className={styles.miniGraph}>
                              <path
                                d="M 0,30 Q 25,20 50,15 T 100,10"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                opacity="0.8"
                              />
                            </svg>
                          </div>
                        </div>
                        <div className={styles.walletDetails}>
                          <div className={styles.walletInfo}>
                            <div className={styles.walletLabel}>WALLETS</div>
                            <div className={styles.walletBalance}>{balanceValue.toFixed(8)} ETH</div>
                            <div className={styles.walletUsd}>$ {usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          </div>
                        </div>
                        <div className={styles.walletAddress} onClick={() => copyAddress(wallet.address)} style={{ cursor: 'pointer' }}>
                          {formatAddress(wallet.address)}
                          <span className={styles.networkBadge}>{wallet.network}</span>
                        </div>
                        {copied && <span className={styles.copiedMessage}>Copied!</span>}
                        {!walletBalance || walletBalance.loading ? (
                          <button
                            onClick={() => checkBalance(wallet.address, networkKey)}
                            className={styles.checkBalanceButton}
                            disabled={walletBalance?.loading}
                          >
                            {walletBalance?.loading ? 'Checking...' : 'Check Balance'}
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Latest Transactions */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Latest transactions</h2>
              <Link to="/transactions" className={styles.viewAllLink}>
                View all
              </Link>
            </div>
            <div className={styles.transactionsList}>
              {transactionsLoading ? (
                <div className={styles.emptyTransactions}>
                  <p>Loading transactions...</p>
                </div>
              ) : latestTransactions.length > 0 ? (
                latestTransactions.map((tx: any) => (
                  <div key={tx.transactionHash || tx.id} className={styles.transactionItem}>
                    <div className={styles.transactionIcon}>E</div>
                    <div className={styles.transactionDetails}>
                      <div className={styles.transactionDate}>{formatDate(tx.createdAt)}</div>
                      <div className={styles.transactionType}>
                        {formatAddress(tx.from)} → {formatAddress(tx.to)}
                      </div>
                    </div>
                    <div className={styles.transactionAmount}>
                      {parseFloat(tx.amountInEther).toFixed(6)} ETH
                    </div>
                    <div className={`${styles.transactionStatus} ${getStatusClass(tx.status)}`}>
                      {tx.status}
                    </div>
                  </div>
                ))
              ) : wallets.length > 0 ? (
                <div className={styles.emptyTransactions}>
                  <p>No transactions found</p>
                </div>
              ) : (
                <div className={styles.emptyTransactions}>
                  <p>Create a wallet to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
