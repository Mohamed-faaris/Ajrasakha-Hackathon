import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuickStats } from "@/hooks/use-quick-stats";
import { useTopMovers } from "@/hooks/use-prices";
import type { TopMover } from "@shared/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  TrendingUp,
  TrendingDown,
  BarChart3,
  MapPin,
  Wheat,
  ArrowRight,
} from "lucide-react";

const Index = () => {
  const [search, setSearch] = useState("");
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
  } = useQuickStats();
  const { data: movers = [], isLoading: moversLoading } = useTopMovers();

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
        stats && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={MapPin}
              label="Total APMCs"
              value={stats.totalApmcs.toLocaleString()}
            />
            <StatCard
              icon={Wheat}
              label="Crops Tracked"
              value={stats.cropsTracked}
            />
            <StatCard
              icon={BarChart3}
              label="Today's Updates"
              value={stats.todaysUpdates}
            />
            <StatCard
              icon={MapPin}
              label="States Covered"
              value={stats.statesCovered}
            />
          </section>
        )
      )}

      {/* Coverage Breakdown */}
      {stats && (
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
                  {((stats.enamIntegrated / stats.totalApmcs) * 100).toFixed(1)}
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
                  {(
                    (stats.statePortalCovered / stats.totalApmcs) *
                    100
                  ).toFixed(1)}
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
                  {((stats.uncovered / stats.totalApmcs) * 100).toFixed(1)}% gap
                  remaining
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Top Movers */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold">
            Top Gainers & Losers
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">View All →</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {moversLoading ? (
            <div className="col-span-4 text-center text-sm text-muted-foreground">
              Loading movers…
            </div>
          ) : (
            movers.slice(0, 8).map((m) => (
              <Card
                key={`${m.crop}-${m.state}`}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm">{m.crop}</p>
                      <p className="text-xs text-muted-foreground">{m.state}</p>
                    </div>
                    <Badge
                      variant={m.direction === "up" ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {m.direction === "up" ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {m.changePercent > 0 ? "+" : ""}
                      {m.changePercent}%
                    </Badge>
                  </div>
                  <p className="text-lg font-bold mt-2 font-display">
                    ₹{m.currentPrice.toLocaleString()}
                    <span className="text-xs font-normal text-muted-foreground">
                      /qtl
                    </span>
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
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
  icon: any;
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
