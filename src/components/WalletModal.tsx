import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Wallet } from "lucide-react";
import { useConnect } from 'wagmi';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';
import { toast } from "sonner";

interface WalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WalletModal = ({ open, onOpenChange }: WalletModalProps) => {
  const navigate = useNavigate();
  const { connect, connectors } = useConnect();

  const wallets = [
    { 
      name: "MetaMask", 
      icon: "🦊",
      connector: connectors.find(c => c.id === 'injected')
    },
    { 
      name: "WalletConnect", 
      icon: "🔗",
      connector: connectors.find(c => c.id === 'walletConnect')
    },
    { 
      name: "Coinbase", 
      icon: "💼",
      connector: connectors.find(c => c.id === 'coinbaseWallet')
    },
    { 
      name: "Rainbow", 
      icon: "🌈",
      connector: connectors.find(c => c.id === 'injected')
    },
  ];

  const handleConnect = (connector: any) => {
    if (!connector) {
      toast.error("Wallet not available");
      return;
    }
    
    connect({ connector }, {
      onSuccess: () => {
        toast.success("Wallet connected successfully!");
        onOpenChange(false);
        navigate("/dashboard");
      },
      onError: (error) => {
        toast.error(`Connection failed: ${error.message}`);
      }
    });
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
                className="w-full justify-start text-lg h-16 hover:glow-green transition-all"
                onClick={() => handleConnect(wallet.connector)}
              >
                <span className="text-2xl mr-4">{wallet.icon}</span>
                {wallet.name}
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
