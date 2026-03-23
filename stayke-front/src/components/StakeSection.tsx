"use client";

import {
  Lock,
  Zap,
  ExternalLink,
  Info,
  TrendingUp,
  Trophy,
  Shield,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ── Mock data ─────────────────────────────────────────────────────────────────
const CHART_DATA = [
  { month: "Jan", apy: 2.1 },
  { month: "Feb", apy: 2.8 },
  { month: "Mar", apy: 3.4 },
  { month: "Apr", apy: 3.1 },
  { month: "May", apy: 4.2 },
  { month: "Jun", apy: 5.2 },
];

// ── Trust Arc (SVG puro, ligero) ──────────────────────────────────────────────
const TrustArc = ({ score }: { score: number }) => {
  const r = 54,
    cx = 80,
    cy = 80;
  const start = -210,
    end = 30;
  const fill = start + (score / 100) * (end - start);
  const toRad = (d: number) => (d * Math.PI) / 180;
  const arc = (a: number, b: number) => {
    const s = {
      x: cx + r * Math.cos(toRad(a)),
      y: cy + r * Math.sin(toRad(a)),
    };
    const e = {
      x: cx + r * Math.cos(toRad(b)),
      y: cy + r * Math.sin(toRad(b)),
    };
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${b - a > 180 ? 1 : 0} 1 ${e.x} ${e.y}`;
  };
  return (
    <svg viewBox="0 0 160 130" className="w-36 mx-auto">
      <defs>
        <linearGradient id="ag" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="hsl(174 90% 50%)" />
          <stop offset="100%" stopColor="hsl(260 60% 65%)" />
        </linearGradient>
        <filter id="ag2">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d={arc(start, end)}
        fill="none"
        stroke="hsl(220 15% 18%)"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d={arc(start, fill)}
        fill="none"
        stroke="url(#ag)"
        strokeWidth="10"
        strokeLinecap="round"
        filter="url(#ag2)"
      />
      <text
        x="80"
        y="78"
        textAnchor="middle"
        fill="white"
        fontSize="22"
        fontWeight="bold"
        fontFamily="sans-serif"
      >
        {score}
      </text>
      <text
        x="80"
        y="94"
        textAnchor="middle"
        fill="hsl(220 10% 55%)"
        fontSize="10"
        fontFamily="sans-serif"
      >
        /100
      </text>
    </svg>
  );
};

// ── Card wrapper ──────────────────────────────────────────────────────────────
const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden">
    {children}
  </div>
);

// ── Card header ───────────────────────────────────────────────────────────────
const CardHeader = ({
  icon: Icon,
  title,
  iconColor = "text-primary",
  iconBg = "bg-primary/10 border-primary/20",
}: {
  icon: React.ElementType;
  title: string;
  iconColor?: string;
  iconBg?: string;
}) => (
  <div className="flex items-center justify-between mb-5">
    <div className="flex items-center gap-2">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-xl border ${iconBg}`}
      >
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <h2 className="font-display text-sm font-bold text-foreground">
        {title}
      </h2>
    </div>
    <Info className="h-4 w-4 text-muted-foreground" />
  </div>
);

// ── Coming soon footer ────────────────────────────────────────────────────────
const ComingSoon = () => (
  <div className="mt-auto pt-4 flex justify-center">
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-background/60 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-primary">
      <Zap className="h-3 w-3" />
      Coming Soon
    </span>
  </div>
);

// ── CTA Button ────────────────────────────────────────────────────────────────
const CTAButton = ({ label }: { label: string }) => (
  <button
    disabled
    className="w-full rounded-xl gradient-solana py-3 text-sm font-bold text-primary-foreground shadow-glow opacity-70 cursor-not-allowed"
  >
    {label}
  </button>
);

// ── Custom tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-primary/30 bg-card/90 backdrop-blur-sm px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-primary">{payload[0].value}% APY</p>
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function StakingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 pt-24 pb-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            Staking & <span className="text-gradient">Trust</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-lg">
            Lock USDC to build trust, earn staking rewards, and unlock VIP
            benefits across the Stayke platform.
          </p>
        </div>

        {/* Grid — misma altura en todas las cards */}
        <div className="grid grid-cols-1 gap-5  lg:grid-cols-3 items-stretch">
          {/* ── Card 1: Security Deposit ── */}
          <Card>
            <div className="absolute top-0 left-0 h-32 w-32 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
            <div className="relative flex flex-col flex-1 p-5">
              <CardHeader icon={Lock} title="Security Deposit" />

              <p className="text-xs text-muted-foreground mb-1">Balance</p>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-display text-3xl font-bold text-foreground">
                  2,500.00
                </span>
                <span className="text-sm text-muted-foreground">USDC</span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Locked for Platform Legitimacy
              </p>

              <div className="h-2 w-full rounded-full bg-muted overflow-hidden mb-2">
                <div className="h-full w-[65%] rounded-full gradient-solana" />
              </div>
              <p className="text-xs mb-4">
                Status:{" "}
                <span className="text-emerald-400 font-semibold">
                  Secure & Active
                </span>
              </p>

              <p className="text-xs text-muted-foreground leading-relaxed mb-5">
                Your deposit is safely locked in the Stayke Vault, ensuring
                platform trust. Funds are fully liquid upon rental completion.
              </p>

              <div className="mt-auto">
                <CTAButton label="Deposit USDC" />
                <ComingSoon />
              </div>
            </div>
          </Card>

          {/* ── Card 2: Staking Performance ── */}
          <Card>
            <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-secondary/8 blur-3xl pointer-events-none" />
            <div className="relative flex flex-col flex-1 p-5">
              <CardHeader
                icon={TrendingUp}
                title="Staking Performance"
                iconColor="text-secondary"
                iconBg="bg-secondary/10 border-secondary/20"
              />

              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { label: "Total Yields Earned", value: "145.20" },
                  { label: "Pending Rewards", value: "12.50" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-muted-foreground mb-0.5">
                      {label}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-xl font-bold text-gradient">
                        {value}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        USDC
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recharts area chart */}
              <div className="flex-1 min-h-30 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={CHART_DATA}
                    margin={{ top: 8, right: 8, left: -28, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="chartGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="hsl(174 90% 50%)"
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(174 90% 50%)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: "hsl(220 10% 55%)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "hsl(220 10% 55%)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{
                        stroke: "hsl(174 90% 50%)",
                        strokeWidth: 1,
                        strokeDasharray: "4 4",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="apy"
                      stroke="hsl(174 90% 50%)"
                      strokeWidth={2}
                      fill="url(#chartGrad)"
                      dot={false}
                      activeDot={{
                        r: 4,
                        fill: "hsl(174 90% 50%)",
                        strokeWidth: 0,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-auto">
                <CTAButton label="Claim Rewards" />
                <a
                  href="#"
                  className="flex items-center justify-center gap-1 mt-3 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  View on Solana Explorer
                </a>
                <ComingSoon />
              </div>
            </div>
          </Card>

          {/* ── Card 3: Trust & Rewards ── */}
          <Card>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-32 w-32 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
            <div className="relative flex flex-col flex-1 p-5 sm:col-span-2 lg:col-span-1">
              <CardHeader icon={Trophy} title="Trust & Rewards" />

              <p className="text-xs text-center text-muted-foreground mb-1">
                Trust Score
              </p>
              <TrustArc score={85} />
              <p className="text-xs text-center text-muted-foreground -mt-1">
                VIP Status Progress
              </p>
              <p className="text-xs text-center text-primary mt-1 font-medium mb-4">
                15 points to next tier
              </p>

              <div className="rounded-xl border border-border bg-background/60 p-4 mb-4">
                <p className="text-xs text-muted-foreground mb-1 text-center">
                  Loyalty Tokens Earned
                </p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="font-display text-2xl font-bold text-gradient">
                    350
                  </span>
                  <span className="text-sm text-muted-foreground">STK</span>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2 leading-relaxed">
                  Accumulate STK tokens for exclusive discounts and priority
                  rental access.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 mb-2">
                {[Trophy, Shield].map((Icon, i) => (
                  <div
                    key={i}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border ${i === 1 ? "border-primary/30 bg-primary/10" : "border-border bg-muted/40"}`}
                  >
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                ))}
              </div>

              <ComingSoon />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
