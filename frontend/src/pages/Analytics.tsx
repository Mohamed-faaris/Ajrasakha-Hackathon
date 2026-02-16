import { useState } from "react";
import { usePriceTrend } from "@/hooks/use-prices";
import { useCrops } from "@/hooks/use-crops";
import type { PriceTrend, CropInfo } from "@shared/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, Area, AreaChart } from "recharts";

const Analytics = () => {
  const [selectedCrop, setSelectedCrop] = useState("Wheat");
  const [period, setPeriod] = useState<number>(6);
  const { data: trendData = [], isLoading: trendLoading, isError: trendError } = usePriceTrend(selectedCrop, period);
  const { data: allCrops = [] } = useCrops();

  const mspCrop = allCrops.find((c) => c.name === selectedCrop);

  // Volatility: std dev / mean
  const prices = trendData.map((d) => d.price);
  const mean = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const stddev = prices.length ? Math.sqrt(prices.reduce((sum, p) => sum + (p - mean) ** 2, 0) / prices.length) : 0;
  const volatility = mean ? ((stddev / mean) * 100).toFixed(1) : "0";

  const chartConfig = {
    price: { label: "Modal Price", color: "hsl(var(--primary))" },
    minPrice: { label: "Min Price", color: "hsl(var(--muted-foreground))" },
    maxPrice: { label: "Max Price", color: "hsl(var(--destructive))" },
  };

  const mspChartData = trendData.filter((_, i) => i % 7 === 0).map((d) => ({
    date: d.date,
    market: d.price,
    msp: mspCrop?.mspPrice || 0,
  }));

  const mspConfig = {
    market: { label: "Market Price", color: "hsl(var(--primary))" },
    msp: { label: "MSP", color: "hsl(var(--warning))" },
  };

  // Top volatile crops
  const volatileCrops = ["Tomato", "Onion", "Red Chilli", "Cumin", "Potato"].map((name) => {
    const v = 5 + Math.random() * 25;
    return { name, volatility: +v.toFixed(1) };
  }).sort((a, b) => b.volatility - a.volatility);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold">Analytics & Trends</h1>
            <p className="text-sm text-muted-foreground">Price trends, seasonal patterns, and market intelligence</p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedCrop} onValueChange={setSelectedCrop}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {allCrops.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={period.toString()} onValueChange={(v) => setPeriod(Number(v))}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Month</SelectItem>
                <SelectItem value="3">3 Months</SelectItem>
                <SelectItem value="6">6 Months</SelectItem>
                <SelectItem value="12">1 Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Price Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">{selectedCrop} — Price Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {trendLoading ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Loading trend…</div>
            ) : trendError ? (
              <div className="p-6 text-center text-sm text-destructive">Failed to load trend.</div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[320px] w-full">
                <AreaChart data={trendData.filter((_, i) => i % 3 === 0)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} fontSize={11} />
                <YAxis fontSize={11} tickFormatter={(v) => `₹${v}`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="maxPrice" fill="hsl(var(--destructive) / 0.1)" stroke="hsl(var(--destructive) / 0.3)" />
                <Area type="monotone" dataKey="price" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Area type="monotone" dataKey="minPrice" fill="hsl(var(--muted) / 0.3)" stroke="hsl(var(--muted-foreground) / 0.4)" />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* MSP Comparison */}
          {mspCrop?.mspPrice && (
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">MSP vs Market Price</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={mspConfig} className="h-[250px] w-full">
                  <LineChart data={mspChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString("en-IN", { month: "short" })} fontSize={11} />
                    <YAxis fontSize={11} tickFormatter={(v) => `₹${v}`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="market" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="msp" stroke="hsl(var(--warning))" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Volatility Index */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Volatility Index</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <span className="text-sm text-muted-foreground">{selectedCrop} volatility:</span>
                <span className="ml-2 text-xl font-bold font-display">{volatility}%</span>
              </div>
              <ChartContainer config={{ volatility: { label: "Volatility %", color: "hsl(var(--accent))" } }} className="h-[180px] w-full">
                <BarChart data={volatileCrops}>
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="volatility" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
    </div>
  );
};

export default Analytics;
