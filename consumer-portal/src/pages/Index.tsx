import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useStateCoverage } from "@/hooks/use-coverage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  BarChart3,
  MapPin,
  Wheat,
  IndianRupee,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

const Index = () => {
  const [search, setSearch] = useState("");
  const {
    data: coverage = [],
    isLoading: statsLoading,
    isError: statsError,
  } = useStateCoverage();

  const stats = useMemo(() => {
    const totalApmcs = coverage.reduce((sum, item) => sum + item.totalApmcs, 0);
    const enamIntegrated = coverage.reduce((sum, item) => sum + item.enamIntegrated, 0);
    const statePortalCovered = coverage.reduce((sum, item) => sum + item.statePortal, 0);
    const uncovered = coverage.reduce((sum, item) => sum + item.uncovered, 0);
    const statesCovered = coverage.length;
    const avgPrice =
      coverage.length > 0
        ? coverage.reduce((sum, item) => sum + (item.avgPrice ?? 0), 0) / coverage.length
        : 0;

    return {
      totalApmcs,
      statesCovered,
      enamIntegrated,
      statePortalCovered,
      uncovered,
      avgPrice,
    };
  }, [coverage]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Hero */}
      <section className="text-center py-8 md:py-12">
        <h1 className="font-display text-3xl md:text-5xl font-extrabold text-foreground mb-3">
          India's Complete <span className="text-primary">Mandi</span>{" "}
          Intelligence
        </h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-8">
          Real-time prices from all 7,021 APMCs — eNAM, Agmarknet & State
          Portals unified in one platform.
        </p>

        {/* Search */}
        <div className="max-w-xl mx-auto flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by crop, mandi, state..."
              className="pl-10 h-12 text-base"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button size="lg" className="h-12 px-6" asChild>
            <Link
              to={`/dashboard${search ? `?q=${encodeURIComponent(search)}` : ""}`}
            >
              Search <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Quick Stats */}
      {statsLoading ? (
        <div className="text-center p-4 text-sm text-muted-foreground">
          Loading stats…
        </div>
      ) : statsError ? (
        <div className="text-center p-4 text-sm text-destructive">
          Failed to load stats.
        </div>
      ) : (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={MapPin}
            label="Total APMCs"
            value={stats.totalApmcs.toLocaleString()}
          />
          <StatCard
            icon={Wheat}
            label="eNAM Integrated"
            value={stats.enamIntegrated.toLocaleString()}
          />
          <StatCard
            icon={BarChart3}
            label="State Portals"
            value={stats.statePortalCovered.toLocaleString()}
          />
          <StatCard
            icon={IndianRupee}
            label="Avg Price"
            value={`₹${Math.round(stats.avgPrice).toLocaleString()}`}
          />
        </section>
      )}

      {/* Coverage Breakdown */}
      <section>
        <h2 className="font-display text-xl font-bold mb-4">APMC Coverage</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold font-display text-primary">
                {stats.enamIntegrated.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">eNAM Integrated</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {stats.totalApmcs > 0 ? ((stats.enamIntegrated / stats.totalApmcs) * 100).toFixed(1) : "0.0"}
                % of total
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-secondary">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold font-display text-secondary">
                {stats.statePortalCovered.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">State Portals</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {stats.totalApmcs > 0 ? ((stats.statePortalCovered / stats.totalApmcs) * 100).toFixed(1) : "0.0"}
                % of total
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-destructive">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold font-display text-destructive">
                {stats.uncovered.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Uncovered</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {stats.totalApmcs > 0 ? ((stats.uncovered / stats.totalApmcs) * 100).toFixed(1) : "0.0"}% gap
                remaining
              </p>
            </CardContent>
          </Card>
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          Coverage across {stats.statesCovered} states.
        </p>
      </section>

      {/* CTA */}
      <section className="bg-primary/5 rounded-xl p-6 md:p-8 text-center border border-primary/10">
        <h2 className="font-display text-2xl font-bold mb-2">
          Explore Market Data
        </h2>
        <p className="text-muted-foreground mb-4">
          Dive into detailed prices, analytics, and geographic insights
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button asChild>
            <Link to="/dashboard">Market Prices</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/analytics">Analytics</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/map">Geographic Map</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold font-display">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default Index;
