import { http, createConfig } from 'wagmi';
import { mainnet, arbitrum, base } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

// Get project ID from environment variable or use demo ID
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

// WalletConnect metadata
const metadata = {
  name: 'Trust AI Weave',
  description: 'Trust AI Weave - Decentralized AI Network',
  url: 'https://trust-ai-weave.com',
  icons: ['https://trust-ai-weave.com/icon.png']
};

export const config = createConfig({
  chains: [mainnet, arbitrum, base],
  connectors: [
    injected(),
    walletConnect({ 
      projectId,
      metadata,
      showQrModal: true,
    }),
    coinbaseWallet({ 
      appName: metadata.name,
      appLogoUrl: metadata.icons[0]
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
  },
});
