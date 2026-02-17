import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { StateCoverage, CropInfo, UserRole } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { useSession } from "@/lib/auth";
import { hasRoleCapability } from "@/lib/role-access";

const MapInsights = () => {
  const { data } = useSession();
  const role = data?.user?.role as UserRole | undefined;

  const [coverage, setCoverage] = useState<StateCoverage[]>([]);
  const [allCrops, setAllCrops] = useState<CropInfo[]>([]);
  const [selectedCrop, setSelectedCrop] = useState("Wheat");

  useEffect(() => {
    api.getStateCoverage().then(setCoverage);
    api.getCrops().then(setAllCrops);
  }, []);

  const totalEnam = coverage.reduce((s, c) => s + c.enamIntegrated, 0);
  const totalPortal = coverage.reduce((s, c) => s + c.statePortal, 0);
  const totalApmcs = coverage.reduce((s, c) => s + c.totalApmcs, 0);

  const comparisonData = coverage
    .sort((a, b) => (b.avgPrice || 0) - (a.avgPrice || 0))
    .slice(0, 10)
    .map((c) => ({ state: c.stateCode, avgPrice: c.avgPrice || 0 }));

  const chartConfig = {
    avgPrice: { label: "Avg Price (Rs/qtl)", color: "hsl(var(--primary))" },
  };

  const canSeeCoverageGap = hasRoleCapability(role, "coverage_gap_visualization");
  const canSeeDataQuality = hasRoleCapability(role, "data_quality_indicators");

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Geographic Insights</h1>
          <p className="text-sm text-muted-foreground">State-wise APMC coverage and price distribution</p>
        </div>
        <Select value={selectedCrop} onValueChange={setSelectedCrop}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {allCrops.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">eNAM Integrated</p>
            <p className="text-3xl font-bold font-display text-primary">{totalEnam.toLocaleString()}</p>
            <Progress value={(totalEnam / totalApmcs) * 100} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">State Portal Coverage</p>
            <p className="text-3xl font-bold font-display text-secondary">{totalPortal.toLocaleString()}</p>
            <Progress value={(totalPortal / totalApmcs) * 100} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Total APMCs Tracked</p>
            <p className="text-3xl font-bold font-display">{totalApmcs.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Target: 7,021</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">State-wise APMC Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {coverage.map((c) => {
              const pct = (c.enamIntegrated + c.statePortal) / c.totalApmcs * 100;
              const bg = pct > 80 ? "bg-primary/15 border-primary/30" : pct > 50 ? "bg-secondary/15 border-secondary/30" : "bg-destructive/10 border-destructive/20";
              return (
                <div key={c.stateCode} className={`rounded-lg border p-3 ${bg}`}>
                  <p className="font-semibold text-sm truncate">{c.state}</p>
                  <p className="text-xs text-muted-foreground">{c.totalApmcs} APMCs</p>
                  <div className="flex gap-1 mt-2">
                    <Badge variant="default" className="text-[9px] px-1.5">{c.enamIntegrated} eNAM</Badge>
                    <Badge variant="secondary" className="text-[9px] px-1.5">{c.statePortal} Portal</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{pct.toFixed(0)}% covered</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Interstate Price Comparison - {selectedCrop}</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="state" fontSize={11} />
              <YAxis fontSize={11} tickFormatter={(v) => `Rs${v}`} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="avgPrice" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {(canSeeCoverageGap || canSeeDataQuality) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {canSeeCoverageGap && (
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Coverage Gap Watchlist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {coverage
                  .map((c) => ({ ...c, uncoveredPct: c.totalApmcs ? (c.uncovered / c.totalApmcs) * 100 : 0 }))
                  .sort((a, b) => b.uncoveredPct - a.uncoveredPct)
                  .slice(0, 4)
                  .map((c) => (
                    <div key={c.stateCode} className="flex items-center justify-between border-b pb-2">
                      <span>{c.state}</span>
                      <span className="font-mono text-muted-foreground">{c.uncoveredPct.toFixed(1)}% uncovered</span>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}
          {canSeeDataQuality && (
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Source Quality Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Source confidence: 0.91</p>
                <p>Missing-data risk: medium in 3 states</p>
                <p className="text-muted-foreground">Use source tags while exporting embedded charts or JSON.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default MapInsights;
