import MockDashboard from "@/components/MockDashboard";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="min-h-screen flex items-center pt-24 pb-20 px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-extrabold font-heading text-[#0C0C0C] leading-tight">
              Your digital bank for the on-chain world
              </h1>
              <p className="text-lg lg:text-xl text-[#0C0C0C] leading-relaxed max-w-xl">
                Get instant access to micro-stablecoin loans, manage your on-chain credit, and grow your portfolio — all in one decentralized platform.
              </p>
            </div>
            
            {/* Email Input CTA */}
            <div className="space-y-3">
              <div className="flex max-w-lg gap-2">
                {/* <input
                  type="email"
                  placeholder="name@email.com"
                  className="flex-1 px-5 py-4 rounded-l-2xl border border-[#EDEDED] text-[#0C0C0C] placeholder:text-[#8E8E8E] focus:outline-none focus:ring-2 focus:ring-[#FFD93D] transition-all"
                /> */}
                <Link href="/verify" className="bg-[#FFD93D] hover:bg-[#FFC700] text-[#0C0C0C] px-8 py-4 rounded-2xl font-semibold transition-colors uppercase tracking-wide whitespace-nowrap">
                  Launch App
                </Link>
                <button className="bg-transparent border border-[#FFD93D] hover:border-2 text-[#0C0C0C] px-8 py-4 rounded-2xl font-semibold transition-colors tracking-wide whitespace-nowrap">
                  Watch Demo
                </button>
              </div>
              {/* <p className="text-sm text-[#8E8E8E]">
                Open an account in seconds.
              </p> */}
            </div>
          </div>

          {/* Right Content - Mock Dashboard */}
          <MockDashboard />
        </div>
      </div>
    </section>
  );
}

