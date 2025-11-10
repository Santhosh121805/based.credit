import { http, createConfig } from 'wagmi';
import { mainnet, arbitrum, base } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

const projectId = 'demo-project-id'; // You can use this demo ID or get your own from WalletConnect Cloud

export const config = createConfig({
  chains: [mainnet, arbitrum, base],
  connectors: [
    injected(),
    walletConnect({ projectId }),
    coinbaseWallet({ appName: 'based.credit' }),
  ],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
  },
});
