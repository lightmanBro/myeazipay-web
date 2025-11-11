import { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import styles from './FormPage.module.css';

const CREATE_WALLET_MUTATION = gql`
  mutation CreateWallet($network: Network!) {
    createWallet(network: $network) {
      id
      address
      network
      createdAt
    }
  }
`;

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

function CreateWalletPage() {
  const [network, setNetwork] = useState<'testnet' | 'mainnet'>('testnet');
  const [createdWallet, setCreatedWallet] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  const [createWallet, { loading }] = useMutation(CREATE_WALLET_MUTATION, {
    onCompleted: async (data) => {
      setCreatedWallet(data.createWallet);
      setError('');
      // Navigate to dashboard immediately so user sees the new wallet
      // The refetchQueries will ensure the dashboard shows the new wallet
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    },
    onError: (err) => {
      setError(err.message);
    },
    refetchQueries: [{ query: ME_QUERY }],
    awaitRefetchQueries: true,
  });

  const handleSubmit = async () => {
    try {
      await createWallet({
        variables: { network:network.toUpperCase() },
      });
    } catch (err) {
      console.log(err);
      // Error handled in onError
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <h1 className={styles.formTitle}>Create Wallet</h1>
          <p className={styles.formSubtitle}>Generate a new blockchain wallet</p>
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <svg className={styles.alertIcon} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {createdWallet ? (
          <div className={styles.successContainer}>
            <div className={styles.successAlert}>
              <svg className={styles.successIcon} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Wallet created successfully!
            </div>

            <div className={styles.walletInfo}>
              <div className={styles.infoGroup}>
                <label className={styles.infoLabel}>Wallet Address:</label>
                <div className={styles.addressBox}>
                  <code className={styles.addressCode}>{createdWallet.address}</code>
                  <button
                    onClick={() => navigator.clipboard.writeText(createdWallet.address)}
                    className={styles.copyButton}
                    title="Copy address"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className={styles.infoGroup}>
                <label className={styles.infoLabel}>Network:</label>
                <span className={styles.networkValue}>{createdWallet.network}</span>
              </div>
            </div>

            <button onClick={() => navigate('/dashboard')} className={styles.primaryButton}>
              Go to Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="network" className={styles.formLabel}>Network</label>
              <select
                id="network"
                value={network}
                onChange={(e) => setNetwork(e.target.value as 'testnet' | 'mainnet')}
                className={styles.formSelect}
              >
                <option value="testnet">Testnet</option>
                <option value="mainnet">Mainnet</option>
              </select>
            </div>

            <button
              type="submit"
              className={styles.primaryButton}
              disabled={loading}
            >
              {loading ? (
                <span className={styles.buttonLoading}>
                  <span className={styles.spinner}></span>
                  Creating...
                </span>
              ) : (
                'Create Wallet'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default CreateWalletPage;
