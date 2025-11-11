import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Wallet, Loader2 } from "lucide-react";
import { useConnect, useAccount, type Connector } from 'wagmi';
import { toast } from "sonner";
import { useState } from "react";

interface WalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WalletModal = ({ open, onOpenChange }: WalletModalProps) => {
  const navigate = useNavigate();
  const { connect, connectors, isPending } = useConnect();
  const { isConnected } = useAccount();
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);

  const wallets = [
    { 
      name: "MetaMask", 
      icon: "🦊",
      connector: connectors.find(c => c.id === 'injected'),
      description: "Connect using MetaMask browser extension"
    },
    { 
      name: "WalletConnect", 
      icon: "🔗",
      connector: connectors.find(c => c.id === 'walletConnect'),
      description: "Scan QR code with your mobile wallet"
    },
    { 
      name: "Coinbase Wallet", 
      icon: "💼",
      connector: connectors.find(c => c.id === 'coinbaseWallet'),
      description: "Connect using Coinbase Wallet"
    },
  ];

  const handleConnect = async (connector: Connector | undefined, walletName: string) => {
    if (!connector) {
      toast.error("Wallet not available");
      return;
    }
    
    setConnectingWallet(walletName);
    
    try {
      await connect({ connector });
      toast.success(`${walletName} connected successfully!`);
      onOpenChange(false);
      navigate("/dashboard");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Connection failed: ${errorMessage}`);
    } finally {
      setConnectingWallet(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass-panel border-glass-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="w-6 h-6 text-neon-green" />
            Connect Wallet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-6">
          {wallets.map((wallet, index) => (
            <motion.div
              key={wallet.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Button
                variant="glass"
                className="w-full justify-start text-lg h-20 hover:glow-green transition-all relative"
                onClick={() => handleConnect(wallet.connector, wallet.name)}
                disabled={isPending || connectingWallet === wallet.name}
              >
                <div className="flex items-center justify-start w-full">
                  <span className="text-2xl mr-4">{wallet.icon}</span>
                  <div className="text-left">
                    <div className="font-semibold">{wallet.name}</div>
                    <div className="text-xs text-muted-foreground">{wallet.description}</div>
                  </div>
                  {connectingWallet === wallet.name && (
                    <Loader2 className="w-4 h-4 animate-spin ml-auto" />
                  )}
                </div>
              </Button>
            </motion.div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          By connecting your wallet, you agree to our Terms of Service and Privacy Policy
        </p>
      </DialogContent>
    </Dialog>
  );
};
