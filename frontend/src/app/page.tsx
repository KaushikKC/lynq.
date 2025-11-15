import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import { FaCoins, FaRobot, FaChartLine } from "react-icons/fa";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />

      {/* Features Section */}
      <section className="py-20 px-6 lg:px-8 bg-[#0C0C0C]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <div className="text-sm text-[#8E8E8E] uppercase tracking-wider font-medium">
              / CORE FEATURES /
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold font-heading text-white">
              Everything you need to unlock decentralized finance
            </h2>
            <p className="text-lg text-[#8E8E8E] max-w-2xl mx-auto">
              Built for speed, powered by AI, designed for growth. Experience
              the future of on-chain banking.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1: Micro-Loans */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="mb-6">
                <div className="w-16 h-16 rounded-2xl bg-[#FFD93D] flex items-center justify-center mb-4">
                  <FaCoins className="w-8 h-8 text-[#0C0C0C]" />
                </div>
                <h3 className="text-2xl font-extrabold font-heading text-[#0C0C0C] mb-3">
                  Micro-Loans
                </h3>
                <p className="text-[#0C0C0C] leading-relaxed mb-4">
                  Get instant stablecoin loans starting at $5. No credit checks,
                  no waiting periods—just collateral-based lending that works
                  24/7. Access funds in seconds, repay on your terms.
                </p>
                <div className="flex items-center gap-2 text-sm text-[#8E8E8E]">
                  <span className="font-semibold text-[#0C0C0C]">
                    Starting at $5
                  </span>
                  <span>•</span>
                  <span>Instant approval</span>
                </div>
              </div>
            </div>

            {/* Feature 2: Agent Screening */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="mb-6">
                <div className="w-16 h-16 rounded-2xl bg-[#FFD93D] flex items-center justify-center mb-4">
                  <FaRobot className="w-8 h-8 text-[#0C0C0C]" />
                </div>
                <h3 className="text-2xl font-extrabold font-heading text-[#0C0C0C] mb-3">
                  Agent Screening
                </h3>
                <p className="text-[#0C0C0C] leading-relaxed mb-4">
                  AI-powered eligibility checks, no humans. Our autonomous
                  agents analyze your on-chain history, collateral, and
                  reputation in milliseconds. Transparent, fair, and completely
                  automated.
                </p>
                <div className="flex items-center gap-2 text-sm text-[#8E8E8E]">
                  <span className="font-semibold text-[#0C0C0C]">
                    AI-powered
                  </span>
                  <span>•</span>
                  <span>Zero bias</span>
                </div>
              </div>
            </div>

            {/* Feature 3: Reputation Growth */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="mb-6">
                <div className="w-16 h-16 rounded-2xl bg-[#FFD93D] flex items-center justify-center mb-4">
                  <FaChartLine className="w-8 h-8 text-[#0C0C0C]" />
                </div>
                <h3 className="text-2xl font-extrabold font-heading text-[#0C0C0C] mb-3">
                  Reputation Growth
                </h3>
                <p className="text-[#0C0C0C] leading-relaxed mb-4">
                  Build on-chain credit and unlock bigger limits. Every
                  successful repayment boosts your reputation score. Refer
                  friends, maintain good standing, and watch your borrowing
                  power grow exponentially.
                </p>
                <div className="flex items-center gap-2 text-sm text-[#8E8E8E]">
                  <span className="font-semibold text-[#0C0C0C]">
                    On-chain credit
                  </span>
                  <span>•</span>
                  <span>Unlock limits</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl lg:text-5xl font-bold font-heading text-[#0C0C0C]">
                Building the next-generation financial infrastructure
              </h2>
              <p className="text-lg text-[#0C0C0C] leading-relaxed">
                We&apos;re creating a decentralized ecosystem where credit,
                savings, and payments work seamlessly — starting with micro
                stablecoin loans and expanding to credit and rupee cards.
              </p>
              <button className="bg-[#FFD93D] hover:bg-[#FFC700] text-[#0C0C0C] px-8 py-4 rounded-2xl font-semibold transition-colors uppercase tracking-wide">
                Learn More
              </button>
            </div>
            <div className="bg-[#F6F6F6] rounded-3xl p-12 flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <div className="text-6xl mb-4">🏛️</div>
                <div className="text-2xl font-bold font-heading text-[#0C0C0C]">
                  Decentralized Finance
                </div>
                <div className="text-[#8E8E8E]">Built for everyone</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 lg:px-8 bg-[#0C0C0C]">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl lg:text-5xl font-bold font-heading text-white">
            Ready to take control of your finances?
          </h2>
          <button className="bg-[#FFD93D] hover:bg-[#FFC700] text-[#0C0C0C] px-12 py-5 rounded-2xl text-lg font-bold transition-colors uppercase tracking-wide">
            Get Started Now
          </button>
          <p className="text-[#8E8E8E] text-lg">
            No KYC. No waiting. 100% decentralized.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
