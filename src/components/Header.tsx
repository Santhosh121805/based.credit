import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAccount, useDisconnect } from 'wagmi';
import { LogOut, User } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { RegisterModal } from "./RegisterModal";
import { useUser } from "@/hooks/useUser";

export const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { user, isRegistered, register } = useUser();
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const handleDisconnect = () => {
    disconnect(undefined, {
      onSuccess: () => {
        toast.success("Wallet disconnected successfully!");
        navigate("/");
      },
      onError: (error) => {
        toast.error(`Disconnect failed: ${error.message}`);
      }
    });
  };

  const handleRegister = (userData: { name: string }) => {
    register(userData);
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-glass-border"
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-2xl font-bold"
            >
              <span className="text-foreground">B</span>
              <span className="text-neon-green">a</span>
              <span className="text-foreground">sed</span>
              <span className="text-neon-cyan">.</span>
              <span className="text-neon-green">credit</span>
            </motion.div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link to="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link to="#faq" className="text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {isConnected ? (
              <>
                {/* Show user name if registered */}
                {isRegistered && user && (
                  <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full glass-panel">
                    <User className="w-4 h-4 text-neon-green" />
                    <span className="text-sm font-medium">
                      {user.name}
                    </span>
                  </div>
                )}
                
                {/* Show wallet address */}
                <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full glass-panel">
                  <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                  <span className="text-sm font-mono">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleDisconnect}
                  className="gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Disconnect
                </Button>
              </>
            ) : (
              <>
                {isRegistered && user ? (
                  <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full glass-panel">
                    <User className="w-4 h-4 text-neon-green" />
                    <span className="text-sm font-medium">Welcome, {user.name}</span>
                  </div>
                ) : (
                  <Button 
                    variant="ghost" 
                    className="hidden md:inline-flex"
                    onClick={() => setShowRegisterModal(true)}
                  >
                    Register
                  </Button>
                )}
                <Button variant="hero">
                  It's free
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      
      <RegisterModal
        open={showRegisterModal}
        onOpenChange={setShowRegisterModal}
        onRegister={handleRegister}
      />
    </motion.header>
  );
};
