import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { 
  TrendingUp, 
  Activity, 
  Shield, 
  Clock, 
  Coins, 
  AlertCircle, 
  Users, 
  Zap,
  ArrowUp,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useAccount, useBalance, useBlockNumber } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { formatEther } from 'viem';

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address: address,
    chainId: mainnet.id,
  });
  const { data: blockNumber } = useBlockNumber({ watch: true });
  
  const [score, setScore] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  useEffect(() => {
    // Simulate AI analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      // Animate score count up
      let current = 0;
      const target = 782;
      const increment = target / 50;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setScore(target);
          clearInterval(timer);
        } else {
          setScore(Math.floor(current));
        }
      }, 20);
    }, 2000);
  }, []);

  const categories = [
    {
      icon: Activity,
      title: "Transaction History",
      score: 135,
      max: 150,
      color: "text-neon-green",
      glow: "glow-green",
    },
    {
      icon: Coins,
      title: "DeFi Usage",
      score: 142,
      max: 150,
      color: "text-neon-cyan",
      glow: "glow-cyan",
    },
    {
      icon: TrendingUp,
      title: "Lending Record",
      score: 98,
      max: 100,
      color: "text-neon-green",
      glow: "glow-green",
    },
    {
      icon: Clock,
      title: "Wallet Age",
      score: 89,
      max: 100,
      color: "text-neon-cyan",
      glow: "glow-cyan",
    },
    {
      icon: Shield,
      title: "Asset Holdings",
      score: 112,
      max: 150,
      color: "text-neon-green",
      glow: "glow-green",
    },
    {
      icon: AlertCircle,
      title: "Risk Detection",
      score: 98,
      max: 100,
      color: "text-neon-cyan",
      glow: "glow-cyan",
    },
    {
      icon: Users,
      title: "Social Reputation",
      score: 85,
      max: 100,
      color: "text-neon-green",
      glow: "glow-green",
    },
    {
      icon: Zap,
      title: "Activity Level",
      score: 91,
      max: 100,
      color: "text-neon-cyan",
      glow: "glow-cyan",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-6 pt-32 pb-20">
        {/* AI Analysis Banner */}
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-2xl p-6 mb-8 border border-neon-green/30"
          >
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-6 h-6 text-neon-green" />
              </motion.div>
              <div>
                <div className="font-bold text-lg">AI Agent Analyzing Your Wallet...</div>
                <div className="text-sm text-muted-foreground">
                  Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Balance: {balance ? parseFloat(formatEther(balance.value)).toFixed(4) : '0.0000'} ETH
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Score Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-panel rounded-3xl p-12 mb-12 relative overflow-hidden"
        >
          {/* Background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-neon-green/20 rounded-full blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="text-sm text-muted-foreground mb-2">Your Credit Score</div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="text-8xl font-black text-neon-green animate-glow"
                >
                  {score}
                  <span className="text-4xl text-muted-foreground">/1000</span>
                </motion.div>
                <div className="flex items-center gap-2 mt-4">
                  <div className="flex items-center gap-1 text-neon-green">
                    <ArrowUp className="w-4 h-4" />
                    <span className="font-bold">+12</span>
                  </div>
                  <span className="text-sm text-muted-foreground">points this week</span>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-green/20 text-neon-green mb-4">
                  <Shield className="w-4 h-4" />
                  <span className="font-bold">Low Risk</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="text-muted-foreground">Wallet: <span className="text-foreground font-bold">{address?.slice(0, 6)}...{address?.slice(-4)}</span></div>
                  <div className="text-muted-foreground">Balance: <span className="text-foreground font-bold">{balance ? parseFloat(formatEther(balance.value)).toFixed(4) : '0.0000'} ETH</span></div>
                  <div className="text-muted-foreground">DeFi Trust: <span className="text-foreground font-bold">94%</span></div>
                  <div className="text-muted-foreground">Trust Rate: <span className="text-foreground font-bold">99%</span></div>
                </div>
              </div>
            </div>

            {/* Top Chains */}
            <div className="flex items-center gap-4 pt-6 border-t border-glass-border">
              <span className="text-sm text-muted-foreground">Top Chains:</span>
              <div className="flex gap-2">
                {["Ethereum", "Arbitrum", "Base"].map((chain) => (
                  <div key={chain} className="px-3 py-1 rounded-full glass-panel text-sm">
                    {chain}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI Insight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-panel rounded-2xl p-8 mb-12 border border-neon-cyan/30"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-green to-neon-cyan flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-background" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">AI Insight</h3>
              <p className="text-muted-foreground leading-relaxed">
                Your transaction history shows consistent liquidity provision with <span className="text-neon-green font-semibold">zero defaults</span>. 
                You've interacted with <span className="text-neon-cyan font-semibold">12 verified DeFi protocols</span> and maintained a 
                <span className="text-neon-green font-semibold"> 100% repayment rate</span>. 
                AI Confidence: <span className="text-neon-green font-bold">94% ✓</span> — You're a low-risk wallet suitable for undercollateralized loans.
              </p>
              <div className="mt-4 flex gap-3">
                <Button variant="hero" size="sm">
                  View Loan Offers
                </Button>
                <Button variant="glass" size="sm">
                  Full Report
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Reputation Breakdown */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-6">Reputation Breakdown</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => {
            const Icon = category.icon;
            const percentage = (category.score / category.max) * 100;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                className={`glass-panel rounded-2xl p-6 ${category.glow} cursor-pointer group`}
              >
                <Icon className={`w-8 h-8 ${category.color} mb-4 group-hover:scale-110 transition-transform`} />
                <h3 className="font-bold mb-2 text-sm text-muted-foreground">{category.title}</h3>
                <div className="text-3xl font-black mb-3">
                  {category.score}
                  <span className="text-lg text-muted-foreground">/{category.max}</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ delay: 0.8 + index * 0.05, duration: 0.8 }}
                    className={`h-full ${percentage > 80 ? 'bg-neon-green' : percentage > 60 ? 'bg-neon-cyan' : 'bg-muted-foreground'}`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Loan Eligibility */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-12 glass-panel rounded-3xl p-12 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-neon-cyan/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-4">Loan Eligibility</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Based on your score, you qualify for:
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="glass-panel rounded-xl p-6">
                <div className="text-3xl font-bold text-neon-green mb-2">$15,000</div>
                <div className="text-sm text-muted-foreground">Max Loan Amount</div>
              </div>
              <div className="glass-panel rounded-xl p-6">
                <div className="text-3xl font-bold text-neon-cyan mb-2">4.5%</div>
                <div className="text-sm text-muted-foreground">APR Rate</div>
              </div>
              <div className="glass-panel rounded-xl p-6">
                <div className="text-3xl font-bold text-neon-green mb-2">75%</div>
                <div className="text-sm text-muted-foreground">Min Collateral</div>
              </div>
            </div>

            <Button variant="neon" size="lg" className="mt-8">
              Apply for Loan
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
