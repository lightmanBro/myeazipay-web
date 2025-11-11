import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, gql, useQuery } from '@apollo/client';
import styles from './FormPage.module.css';

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

const SEND_FUNDS_MUTATION = gql`
  mutation SendFunds($to: String!, $amount: String!, $network: Network!, $walletAddress: String!) {
    sendFunds(to: $to, amount: $amount, network: $network, walletAddress: $walletAddress) {
      transactionHash
      from
      to
      amount
      amountInEther
      status
      network
    }
  }
`;

interface SendFundsFormData {
  walletAddress: string;
  to: string;
  amount: string;
  network: 'testnet' | 'mainnet';
}

function SendFundsPage() {
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<any>(null);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<SendFundsFormData>();

  const { data: userData } = useQuery(ME_QUERY);
  const wallets = userData?.me?.wallets || [];

  const [sendFunds] = useMutation(SEND_FUNDS_MUTATION, {
    onCompleted: (data) => {
      setSuccess(data.sendFunds);
      setError('');
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const onSubmit = async (data: SendFundsFormData) => {
    console.log(data.network.toUpperCase());
    try {
      await sendFunds({
        variables: {
          to: data.to,
          amount: data.amount,
          network: data.network.toUpperCase(),
          walletAddress: data.walletAddress,
        },
      });
    } catch (err) {
      // Error handled in onError
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <h1 className={styles.formTitle}>Send Funds</h1>
          <p className={styles.formSubtitle}>Transfer cryptocurrency to another address</p>
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <svg className={styles.alertIcon} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {success ? (
          <div className={styles.successContainer}>
            <div className={styles.successAlert}>
              <svg className={styles.successIcon} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Transaction submitted successfully!
            </div>

            <div className={styles.walletInfo}>
              <div className={styles.infoGroup}>
                <label className={styles.infoLabel}>Transaction Hash:</label>
                <div className={styles.addressBox}>
                  <code className={styles.addressCode}>{success.transactionHash}</code>
                  <button
                    onClick={() => navigator.clipboard.writeText(success.transactionHash)}
                    className={styles.copyButton}
                    title="Copy hash"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Status:</span>
                <span className={styles.infoValue}>{success.status}</span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Amount:</span>
                <span className={styles.infoValue}>{success.amountInEther} ETH</span>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="walletAddress" className={styles.formLabel}>From Wallet</label>
              <select
                id="walletAddress"
                {...register('walletAddress', { required: 'Please select a wallet' })}
                className={styles.formSelect}
              >
                <option value="">Select wallet</option>
                {wallets.map((wallet: any) => (
                  <option key={wallet.id} value={wallet.address}>
                    {wallet.address.slice(0, 10)}... ({wallet.network})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="to" className={styles.formLabel}>To Address</label>
              <input
                id="to"
                type="text"
                className={styles.formInput}
                {...register('to', { required: 'Recipient address is required' })}
                placeholder="0x..."
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="amount" className={styles.formLabel}>Amount (ETH)</label>
              <input
                id="amount"
                type="number"
                step="0.000000000000000001"
                className={styles.formInput}
                {...register('amount', { required: 'Amount is required' })}
                placeholder="0.001"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="network" className={styles.formLabel}>Network</label>
              <select
                id="network"
                {...register('network', { required: true })}
                defaultValue="testnet"
                className={styles.formSelect}
              >
                <option value="testnet">Testnet</option>
                <option value="mainnet">Mainnet</option>
              </select>
            </div>

            <button
              type="submit"
              className={styles.primaryButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className={styles.buttonLoading}>
                  <span className={styles.spinner}></span>
                  Sending...
                </span>
              ) : (
                'Send Funds'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default SendFundsPage;
