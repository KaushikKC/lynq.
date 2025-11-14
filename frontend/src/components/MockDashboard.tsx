export default function MockDashboard() {
  return (
    <div className="relative">
      {/* Accent Badge */}
      <div className="absolute -top-4 -right-4 z-10 bg-[#FFD93D] border-2 border-[#0C0C0C] rounded-full p-6 w-48 h-48 flex flex-col items-center justify-center text-center shadow-lg">
        <div className="text-3xl mb-2">💰</div>
        <div className="text-xs font-bold font-heading text-[#0C0C0C] mb-1">
          Instant Loans
        </div>
        <div className="text-[10px] text-[#0C0C0C]">
          Starting at $5 USDC
        </div>
      </div>

      {/* Mock Dashboard Card */}
      <div className="bg-white border-2 border-[#EDEDED] rounded-3xl p-6 shadow-xl transform rotate-3">
        <div className="space-y-5">
          {/* Dashboard Header */}
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold font-heading text-[#0C0C0C]">lynq.</div>
            <div className="flex items-center gap-2 bg-[#00D26A]/10 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-[#00D26A] rounded-full"></div>
              <span className="text-xs font-semibold text-[#00D26A]">Verified</span>
            </div>
          </div>

          {/* Credit Score */}
          <div className="bg-gradient-to-br from-[#FFD93D] to-[#FFC700] rounded-2xl p-4">
            <div className="text-xs font-medium text-[#0C0C0C]/70 mb-1">Credit Score</div>
            <div className="text-3xl font-bold font-heading text-[#0C0C0C] mb-2">640</div>
            <div className="flex items-center gap-2 text-xs text-[#0C0C0C]">
              <span>Bronze</span>
              <span>→</span>
              <span>Silver</span>
            </div>
            <div className="w-full bg-white/30 rounded-full h-1.5 mt-2">
              <div className="bg-[#0C0C0C] h-full rounded-full" style={{ width: "60%" }}></div>
            </div>
          </div>

          {/* Available Limit */}
          <div className="bg-[#F6F6F6] rounded-xl p-3">
            <div className="text-xs text-[#8E8E8E] mb-1">Available Loan Limit</div>
            <div className="text-xl font-bold font-heading text-[#0C0C0C]">$15 USDC</div>
          </div>

          {/* Active Loan Card */}
          <div className="bg-[#F6F6F6] rounded-xl p-3 border border-[#EDEDED]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-[#0C0C0C]">Active Loan</div>
              <div className="text-xs text-[#8E8E8E]">3 days left</div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-[#8E8E8E]">Amount</div>
                <div className="text-sm font-bold text-[#0C0C0C]">$10 USDC</div>
              </div>
              <div>
                <div className="text-xs text-[#8E8E8E]">Remaining</div>
                <div className="text-sm font-bold text-[#0C0C0C]">$3.03</div>
              </div>
            </div>
            <div className="w-full bg-[#EDEDED] rounded-full h-1.5 mt-2">
              <div className="bg-[#FFD93D] h-full rounded-full" style={{ width: "70%" }}></div>
            </div>
          </div>

          {/* Quick Action */}
          <button className="w-full bg-[#FFD93D] hover:bg-[#FFC700] text-[#0C0C0C] px-4 py-2.5 rounded-xl text-sm font-bold transition-colors">
            Request Loan
          </button>

          {/* Recent Activity */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-[#8E8E8E]">Recent Activity</div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-1.5 h-1.5 bg-[#00D26A] rounded-full"></div>
                <span className="text-[#0C0C0C]">Loan approved: $10 USDC</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-1.5 h-1.5 bg-[#00D26A] rounded-full"></div>
                <span className="text-[#0C0C0C]">Loan repaid: $7.07 USDC</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Second Phone Mockup (Behind) */}
      <div className="absolute -bottom-8 -left-8 bg-[#0C0C0C] border-2 border-[#EDEDED] rounded-3xl p-6 shadow-xl transform -rotate-6 w-64 z-0">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold font-heading text-white">lynq.</div>
            <div className="bg-[#FFD93D] text-[#0C0C0C] text-xs font-bold px-2 py-1 rounded-full">
              640
            </div>
          </div>
          
          {/* Credit Score Ring */}
          <div className="relative w-24 h-24 mx-auto">
            <svg className="transform -rotate-90 w-24 h-24">
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke="#8E8E8E"
                strokeWidth="6"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke="#FFD93D"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * 0.4}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-2xl font-bold font-heading text-white">640</div>
              <div className="text-xs text-[#8E8E8E]">Bronze</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-white text-sm font-semibold">Available Limit</div>
            <div className="text-2xl font-bold font-heading text-[#FFD93D]">$15 USDC</div>
            <button className="bg-[#FFD93D] hover:bg-[#FFC700] text-[#0C0C0C] px-4 py-2 rounded-lg text-sm font-semibold transition-colors w-full">
              Request Loan
            </button>
          </div>
          
          <div className="pt-2 border-t border-[#8E8E8E]/20">
            <div className="text-white text-xs mb-2">Wallet</div>
            <div className="text-[#8E8E8E] text-xs font-mono">0x1234...5678</div>
          </div>
        </div>
      </div>
    </div>
  );
}

