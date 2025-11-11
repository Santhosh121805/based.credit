import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useState } from "react";
import { WalletModal } from "./WalletModal";

export const Hero = () => {
  const [showWalletModal, setShowWalletModal] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-neon-green/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel mb-6"
            >
              <Sparkles className="w-4 h-4 text-neon-green" />
              <span className="text-sm text-muted-foreground">AI-Powered Credit Reputation</span>
            </motion.div>

            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black mb-6 leading-none">
              <span className="text-foreground text-glitch">NEW ERA OF</span>
              <br />
              <span className="text-neon-green animate-glow text-glitch">BANKING.</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-lg">
              The trust layer for Web3. AI-powered credit scores for crypto wallets. 
              Score your wallet. Lend smarter. Build safer.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button 
                variant="hero" 
                size="lg" 
                className="text-lg px-8"
                onClick={() => setShowWalletModal(true)}
              >
                Connect Wallet <ArrowRight className="ml-2" />
              </Button>
              <Button variant="glass" size="lg" className="text-lg px-8">
                Check My Score
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="text-3xl font-bold text-neon-green">Instant</div>
                <div className="text-sm text-muted-foreground">Credit Scoring</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="text-3xl font-bold text-neon-cyan">Zero</div>
                <div className="text-sm text-muted-foreground">Collateral Needed</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="text-3xl font-bold text-neon-green">Trusted</div>
                <div className="text-sm text-muted-foreground">By Thousands</div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right content - 3D Cards */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative h-[600px] flex items-center justify-center">
              {/* Card stack */}
              <motion.div
                animate={{ 
                  y: [0, -20, 0],
                  rotateY: [0, 5, 0]
                }}
                transition={{ 
                  duration: 6, 
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
                className="absolute w-80 h-64 glass-panel rounded-3xl p-8 transform rotate-6"
                style={{ boxShadow: "0 25px 50px -12px rgba(214, 255, 0, 0.25)" }}
              >
                <div className="text-sm text-muted-foreground mb-2">New Borrower</div>
                <div className="text-4xl font-bold text-neon-green mb-4">650</div>
                <div className="text-xs text-muted-foreground">
                  Building credit history with smart AI insights.
                </div>
              </motion.div>

              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotateY: [0, -3, 0]
                }}
                transition={{ 
                  duration: 6, 
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.2
                }}
                className="absolute w-80 h-64 bg-gradient-to-br from-card to-glass-bg rounded-3xl p-8 transform -rotate-3"
                style={{ boxShadow: "0 25px 50px -12px rgba(0, 224, 255, 0.25)" }}
              >
                <div className="text-sm text-muted-foreground mb-2">Trusted Member</div>
                <div className="text-4xl font-bold text-neon-cyan mb-4">825</div>
                <div className="text-xs text-muted-foreground">
                  Verified DeFi history and lending reputation.
                </div>
                <Button variant="hero" className="mt-6">
                  Get Started <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </motion.div>

              <motion.div
                animate={{ 
                  y: [0, 0, 0],
                }}
                transition={{ 
                  duration: 6, 
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.4
                }}
                className="absolute w-80 h-64 bg-gradient-to-br from-neon-green to-neon-cyan rounded-3xl p-8 transform rotate-1 top-32"
                style={{ boxShadow: "0 25px 50px -12px rgba(214, 255, 0, 0.4)" }}
              >
                <div className="text-sm text-background/70 mb-2">Elite Borrower</div>
                <div className="text-4xl font-bold text-background mb-4">950</div>
                <div className="text-xs text-background/70">
                  Premium credit score unlocks top-tier rates.
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Partner logos */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-24 pt-12 border-t border-glass-border"
        >
          <div className="flex items-center justify-between opacity-40">
            <div className="text-2xl font-bold">Compound</div>
            <div className="text-2xl font-bold">AAVE</div>
            <div className="text-2xl font-bold">UniSwap</div>
            <div className="text-2xl font-bold">Ethereum</div>
            <div className="text-2xl font-bold">Polygon</div>
          </div>
        </motion.div>
      </div>

      <WalletModal open={showWalletModal} onOpenChange={setShowWalletModal} />
    </section>
  );
};
