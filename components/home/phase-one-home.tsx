import ChangeSection from "@/components/home/change-section";
import HomeHeader from "@/components/home/home-header";
import PhaseStatusSection from "@/components/home/phase-status-section";
import PortfolioSection from "@/components/home/portfolio-section";
import RecommendationSection from "@/components/home/recommendation-section";
import SellWatchSection from "@/components/home/sell-watch-section";
import SummaryCards from "@/components/home/summary-cards";
import TradeLogSection from "@/components/home/trade-log-section";
import UniverseSection from "@/components/home/universe-section";

export default function PhaseOneHome() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-10">
        <HomeHeader />

        <SummaryCards />

        <RecommendationSection />

        <section className="grid gap-4 lg:grid-cols-2">
          <ChangeSection />
          <SellWatchSection />
        </section>

        <UniverseSection />

        <PortfolioSection />

        <TradeLogSection />

        <PhaseStatusSection />
      </div>
    </main>
  );
}