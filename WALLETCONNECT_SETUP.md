# WalletConnect Setup

## Getting Your Project ID

1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Sign up or log in
3. Create a new project
4. Copy your project ID
5. Create a `.env` file in your project root:

```bash
VITE_WALLETCONNECT_PROJECT_ID=your-actual-project-id-here
```

## Features

- ✅ WalletConnect v2 integration
- ✅ MetaMask support
- ✅ Coinbase Wallet support  
- ✅ QR Code modal for mobile wallets
- ✅ Proper error handling
- ✅ Loading states
- ✅ TypeScript support

## Supported Wallets

- MetaMask (browser extension)
- WalletConnect (any mobile wallet that supports WalletConnect)
- Coinbase Wallet
- Trust Wallet (via WalletConnect)
- Rainbow Wallet (via WalletConnect)
- And many more via WalletConnect protocol

## Testing

The app currently uses a demo project ID that works for testing. For production, you'll need your own project ID from WalletConnect Cloud.