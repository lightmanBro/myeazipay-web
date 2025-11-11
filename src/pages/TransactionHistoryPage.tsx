import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import styles from './TransactionHistoryPage.module.css';

const ME_QUERY = gql`
  query Me {
    me {
      wallets {
        id
        address
        network
      }
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
      gasUsed
      gasPrice
      createdAt
    }
  }
`;

function TransactionHistoryPage() {
  const [selectedWallet, setSelectedWallet] = useState<string>('');
  const [network, setNetwork] = useState<'testnet' | 'mainnet'>('testnet');
  const [limit, setLimit] = useState(10);

  const { data: userData } = useQuery(ME_QUERY);
  const wallets = userData?.me?.wallets || [];

  const { loading, error, data } = useQuery(TRANSACTION_HISTORY_QUERY, {
    variables: {
      address: selectedWallet,
      network,
      limit,
    },
    skip: !selectedWallet,
  });

  const transactions = data?.transactionHistory || [];

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getStatusClass = (status: string) => {
    if (status.toLowerCase().includes('success')) {
      return styles.statusSuccess;
    }
    if (status.toLowerCase().includes('pending') || status.toLowerCase().includes('queue')) {
      return styles.statusPending;
    }
    return styles.statusError;
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Transaction History</h1>
          <p className={styles.subtitle}>View and track your wallet transactions</p>
        </div>

        <div className={styles.filtersCard}>
          <div className={styles.filtersGrid}>
            <div className={styles.filterGroup}>
              <label htmlFor="wallet" className={styles.filterLabel}>Select Wallet</label>
              <select
                id="wallet"
                value={selectedWallet}
                onChange={(e) => setSelectedWallet(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">Select wallet</option>
                {wallets.map((wallet: any) => (
                  <option key={wallet.id} value={wallet.address}>
                    {formatAddress(wallet.address)} ({wallet.network})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="network" className={styles.filterLabel}>Network</label>
              <select
                id="network"
                value={network}
                onChange={(e) => setNetwork(e.target.value as 'testnet' | 'mainnet')}
                className={styles.filterSelect}
              >
                <option value="testnet">Testnet</option>
                <option value="mainnet">Mainnet</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="limit" className={styles.filterLabel}>Limit</label>
              <input
                id="limit"
                type="number"
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value, 10))}
                min={1}
                max={100}
                className={styles.filterInput}
              />
            </div>
          </div>
        </div>

        {loading && (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p className={styles.loadingText}>Loading transactions...</p>
          </div>
        )}

        {error && (
          <div className={styles.errorContainer}>
            <div className={styles.errorAlert}>
              <svg className={styles.alertIcon} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error.message}
            </div>
          </div>
        )}

        {selectedWallet && !loading && (
          <div className={styles.transactionsCard}>
            {transactions.length === 0 ? (
              <div className={styles.emptyState}>
                <svg className={styles.emptyIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className={styles.emptyText}>No transactions found for this wallet.</p>
              </div>
            ) : (
              <>
                <div className={styles.tableHeader}>
                  <div className={styles.tableRow}>
                    <div className={styles.tableCellHeader}>Hash</div>
                    <div className={styles.tableCellHeader}>From</div>
                    <div className={styles.tableCellHeader}>To</div>
                    <div className={styles.tableCellHeader}>Amount</div>
                    <div className={styles.tableCellHeader}>Status</div>
                    <div className={styles.tableCellHeader}>Date</div>
                  </div>
                </div>
                <div className={styles.tableBody}>
                  {transactions.map((tx: any) => (
                    <div key={tx.transactionHash || tx.id} className={styles.tableRow}>
                      <div className={styles.tableCell}>
                        <code className={styles.hashCode}>{formatAddress(tx.transactionHash || 'N/A')}</code>
                      </div>
                      <div className={styles.tableCell}>
                        <code className={styles.addressCode}>{formatAddress(tx.from)}</code>
                      </div>
                      <div className={styles.tableCell}>
                        <code className={styles.addressCode}>{formatAddress(tx.to)}</code>
                      </div>
                      <div className={styles.tableCell}>
                        <span className={styles.amount}>{tx.amountInEther} ETH</span>
                      </div>
                      <div className={styles.tableCell}>
                        <span className={`${styles.status} ${getStatusClass(tx.status)}`}>
                          {tx.status}
                        </span>
                      </div>
                      <div className={styles.tableCell}>
                        <span className={styles.date}>
                          {new Date(tx.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {!selectedWallet && !loading && (
          <div className={styles.emptyState}>
            <svg className={styles.emptyIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <p className={styles.emptyText}>Please select a wallet to view transactions</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TransactionHistoryPage;
