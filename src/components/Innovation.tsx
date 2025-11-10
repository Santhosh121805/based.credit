import { motion } from "framer-motion";
import { Zap, Shield, TrendingUp, Users, Globe, Lock } from "lucide-react";

export const Innovation = () => {
  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "AI analyzes your wallet in seconds, not hours",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Zero-knowledge proofs protect your identity",
    },
    {
      icon: TrendingUp,
      title: "Fair Credit",
      description: "Good behavior = better rates. It's that simple",
    },
    {
      icon: Users,
      title: "Social Trust",
      description: "Build reputation through verified interactions",
    },
    {
      icon: Globe,
      title: "Multi-Chain",
      description: "Works across Ethereum, Arbitrum, Base, and more",
    },
    {
      icon: Lock,
      title: "Fraud Detection",
      description: "AI spots suspicious activity before it happens",
    },
  ];

  return (
    <section className="py-32 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-neon-green/10 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-6xl md:text-7xl font-black mb-6">
            <span className="text-foreground text-glitch">FUELING</span>
            <br />
            <span className="text-neon-green animate-glow text-glitch">INNOVATION</span>
            <br />
            <span className="text-foreground text-glitch">GROWTH</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Revolutionizing DeFi lending with AI-powered trust scores that make credit accessible to everyone
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-panel p-8 rounded-2xl group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-neon-green to-neon-cyan flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Icon className="w-7 h-7 text-background" />
                </div>
                <h3 className="text-2xl font-bold mb-3 group-hover:text-neon-green transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-32 glass-panel rounded-3xl p-12"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-neon-green flex items-center justify-center">
              <span className="text-3xl">🤖</span>
            </div>
            <div>
              <h3 className="text-3xl font-bold">How Based.credit Works</h3>
              <p className="text-muted-foreground">In 3 simple steps</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="text-6xl font-black text-neon-green/20 mb-4">01</div>
              <h4 className="text-xl font-bold mb-2">Connect Wallet</h4>
              <p className="text-muted-foreground">
                Link your crypto wallet securely. We support all major providers.
              </p>
            </div>
            <div className="relative">
              <div className="text-6xl font-black text-neon-cyan/20 mb-4">02</div>
              <h4 className="text-xl font-bold mb-2">AI Analysis</h4>
              <p className="text-muted-foreground">
                Our AI scans your on-chain history across multiple networks.
              </p>
            </div>
            <div className="relative">
              <div className="text-6xl font-black text-neon-green/20 mb-4">03</div>
              <h4 className="text-xl font-bold mb-2">Get Your Score</h4>
              <p className="text-muted-foreground">
                Receive your trust score and unlock better lending rates.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
