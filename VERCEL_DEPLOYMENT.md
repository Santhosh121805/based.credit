# 🚀 Deploy Trust AI Weave to Vercel

This guide will help you deploy the Trust AI Weave frontend to Vercel for public access.

## 🎯 Live Demo
- **Frontend**: Will be available at: `https://your-project-name.vercel.app`
- **Smart Contracts**: 
  - TrustAIToken: `0x23653F0a47785a8c4552C4fFfe32fD33f011041F` ([View on Etherscan](https://sepolia.etherscan.io/address/0x23653F0a47785a8c4552C4fFfe32fD33f011041F))
  - CreditScoreNFT: `0xa5D8F9Ad375314D539C72A955dFb5DCB2C82f365` ([View on Etherscan](https://sepolia.etherscan.io/address/0xa5D8F9Ad375314D539C72A955dFb5DCB2C82f365))

## 🔧 Deployment Methods

### Method 1: Deploy via Vercel CLI (Recommended)

#### 1️⃣ Install Vercel CLI
```bash
npm i -g vercel
```

#### 2️⃣ Login to Vercel
```bash
vercel login
```

#### 3️⃣ Deploy from your project directory
```bash
cd "C:\Users\Santhosh S\Downloads\trust-ai-weave"
vercel
```

#### 4️⃣ Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account
- **Link to existing project?** → No
- **What's your project's name?** → `trust-ai-weave` or `based-credit`
- **In which directory is your code located?** → `./`

#### 5️⃣ Production deployment
```bash
vercel --prod
```

### Method 2: Deploy via Vercel Dashboard

#### 1️⃣ Visit [vercel.com](https://vercel.com) and sign in

#### 2️⃣ Click "New Project"

#### 3️⃣ Import your GitHub repository:
- Select "Import Git Repository"
- Choose: `https://github.com/Santhosh121805/based.credit`

#### 4️⃣ Configure project settings:
- **Project Name**: `trust-ai-weave` or `based-credit`
- **Framework Preset**: Vite ✅ (auto-detected)
- **Root Directory**: `./` ✅
- **Build Command**: `npm run build` ✅ (auto-detected)
- **Output Directory**: `dist` ✅ (auto-detected)
- **Install Command**: `npm install` ✅ (auto-detected)

#### 5️⃣ Environment Variables (Optional)
If you need any environment variables for production:
```
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
VITE_INFURA_API_KEY=your_infura_api_key
```

#### 6️⃣ Click "Deploy" 🚀

## ⚡ Build Configuration

Your project is already configured with:

✅ **vercel.json** - Deployment configuration  
✅ **vite.config.ts** - Build settings  
✅ **package.json** - Dependencies and scripts  

## 🌐 Custom Domain (Optional)

After deployment, you can add a custom domain:

1. Go to your Vercel dashboard
2. Select your project
3. Go to "Settings" → "Domains"
4. Add your custom domain

## 🔍 Deployment Status

### Expected Build Output:
```
✓ Build completed in 30s
✓ Static files generated in /dist
✓ Deployment ready at: https://your-project.vercel.app
```

### What Gets Deployed:
- ✅ React frontend with Web3 integration
- ✅ Wallet connection (MetaMask, WalletConnect)
- ✅ Registration and dashboard
- ✅ Credit scoring interface
- ✅ All UI components and assets

### What Stays Local:
- ❌ Backend server (requires separate deployment)
- ❌ Smart contracts (already deployed to Sepolia)
- ❌ Database connections
- ❌ Environment files with sensitive data

## 🎉 After Deployment

Once deployed, your dApp will be live and users can:
- Connect their Web3 wallets
- Register accounts  
- View credit scoring dashboard
- Interact with your deployed smart contracts
- Access the full Trust AI Weave experience

## 🚨 Troubleshooting

### Common Issues:

**Build fails due to Node.js version**
- Vercel uses Node.js 18 by default
- Your project is compatible ✅

**Missing dependencies**
- All dependencies are in package.json ✅
- Build command will install them automatically ✅

**Environment variables**
- Add any needed env vars in Vercel dashboard
- Use `VITE_` prefix for frontend variables

**Routing issues**
- React Router is configured ✅
- Vercel will handle client-side routing ✅

## 📊 Performance

Expected performance scores:
- **Build Time**: ~30-60 seconds
- **Page Load**: < 2 seconds
- **Bundle Size**: Optimized with Vite
- **Lighthouse Score**: 90+ expected

---

🎯 **Ready to deploy?** Run `vercel` in your terminal or import from GitHub!