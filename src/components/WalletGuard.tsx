import { motion } from "framer-motion";
import { useAccount } from 'wagmi';
import { Loader2, Wallet } from "lucide-react";
import { useEffect, useState } from "react";

interface WalletGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const WalletGuard = ({ children, fallback }: WalletGuardProps) => {
  const { isConnected, isConnecting, isReconnecting } = useAccount();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Give a brief moment for wallet connection to initialize
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading || isConnecting || isReconnecting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel rounded-2xl p-8 text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mx-auto mb-4 w-12 h-12 flex items-center justify-center"
          >
            <Loader2 className="w-8 h-8 text-neon-green" />
          </motion.div>
          <h3 className="text-xl font-bold mb-2">Checking Wallet Connection</h3>
          <p className="text-muted-foreground">Please wait while we verify your wallet...</p>
        </motion.div>
      </div>
    );
  }

  if (!isConnected) {
    return fallback || (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel rounded-2xl p-8 text-center max-w-md"
        >
          <Wallet className="w-12 h-12 text-neon-green mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Wallet Required</h3>
          <p className="text-muted-foreground mb-4">
            Please connect your wallet to access this feature.
          </p>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
};