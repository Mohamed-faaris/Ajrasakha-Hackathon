import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, ReferenceLine } from "recharts";

const Analytics = () => {
  const [selectedCrop, setSelectedCrop] = useState("Wheat");
  const [period, setPeriod] = useState<number>(6);
  const trendData = [
    { date: "2024-01-01", price: 2100, minPrice: 2000, maxPrice: 2200 },
    { date: "2024-02-01", price: 2200, minPrice: 2100, maxPrice: 2300 },
    { date: "2024-03-01", price: 2150, minPrice: 2050, maxPrice: 2250 },
    { date: "2024-04-01", price: 2250, minPrice: 2150, maxPrice: 2350 },
    { date: "2024-05-01", price: 2300, minPrice: 2200, maxPrice: 2400 },
    { date: "2024-06-01", price: 2280, minPrice: 2180, maxPrice: 2380 },
  ];
  const allCrops = [
    { name: "Wheat", mspPrice: 2275 },
    { name: "Rice", mspPrice: 2183 },
    { name: "Maize", mspPrice: 2225 },
    { name: "Gram", mspPrice: 5440 },
  ];
  const trendLoading = false;
  const trendError = false;

  const mspCrop = allCrops.find((c) => c.name === selectedCrop);
  const mspValue = mspCrop?.mspPrice ?? allCrops[0]?.mspPrice ?? 2275;
  const combinedData = trendData.map((d) => ({
    ...d,
    msp: mspValue,
  }));

  // Volatility: std dev / mean
  const prices = trendData.map((d) => d.price);
  const mean = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const stddev = prices.length ? Math.sqrt(prices.reduce((sum, p) => sum + (p - mean) ** 2, 0) / prices.length) : 0;
  const volatility = mean ? ((stddev / mean) * 100).toFixed(1) : "0";

  const chartConfig = {
    price: { label: "Modal Price", color: "hsl(var(--primary))" },
    minPrice: { label: "Min Price", color: "hsl(var(--muted-foreground))" },
    maxPrice: { label: "Max Price", color: "hsl(var(--destructive))" },
    msp: { label: "MSP", color: "hsl(var(--warning))" },
  };

  // Top volatile crops
  const volatileCrops = ["Tomato", "Onion", "Red Chilli", "Cumin", "Potato"].map((name) => {
    const v = 5 + Math.random() * 25;
    return { name, volatility: +v.toFixed(1) };
  }).sort((a, b) => b.volatility - a.volatility);

  const canViewVolatility = true;
  const canViewAnomalies = true;
  const canViewDataQuality = true;
  const canViewPrediction = true;

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
          <CardTitle className="font-display text-lg">{selectedCrop} - Price Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {trendLoading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Loading trend...</div>
          ) : trendError ? (
            <div className="p-6 text-center text-sm text-destructive">Failed to load trend.</div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[320px] w-full">
  <ComposedChart data={combinedData}>
    <CartesianGrid strokeDasharray="3 3" />

    <XAxis
      dataKey="date"
      tickFormatter={(d) =>
        new Date(d).toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
        })
      }
      fontSize={11}
    />

    <YAxis
      fontSize={11}
      tickFormatter={(v) => `₹${v}`}
      domain={["dataMin - 100", "dataMax + 100"]}
    />

    <ReferenceLine
  y={mspValue}
  stroke="#f59e0b"
  strokeWidth={3}
  strokeDasharray="6 6"
  label={{
    value: `MSP ₹${mspValue}`,
    position: "right",
    fill: "#f59e0b",
    fontSize: 12,
  }}
/>

    <ChartTooltip content={<ChartTooltipContent />} />

    {/* Price band */}
    <Area
      type="monotone"
      dataKey="maxPrice"
      fill="hsl(var(--destructive) / 0.1)"
      stroke="hsl(var(--destructive) / 0.3)"
    />

    <Area
      type="monotone"
      dataKey="minPrice"
      fill="hsl(var(--muted) / 0.3)"
      stroke="hsl(var(--muted-foreground) / 0.4)"
    />

    {/* Modal price line */}
    <Line
      type="monotone"
      dataKey="price"
      stroke="hsl(var(--primary))"
      strokeWidth={3}
      dot={{ r: 3 }}
    />

    {/* MSP line — render LAST so it appears on top */}
    <Line
      type="monotone"
      dataKey="msp"
      stroke="hsl(var(--warning))"
      strokeWidth={3}
      strokeDasharray="6 6"
      dot={false}
      isAnimationActive={false}
    />
  </ComposedChart>
</ChartContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {canViewVolatility && (
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
        )}
      </div>

      {(canViewAnomalies || canViewDataQuality || canViewPrediction) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {canViewAnomalies && (
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Anomaly Signals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Spike detection threshold crossed in 3 markets this week.</p>
                <p className="text-muted-foreground">Suggested action: inspect supply-chain disruption in high-volatility zones.</p>
              </CardContent>
            </Card>
          )}
          {canViewPrediction && (
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Predictive Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>30-day forward band indicates moderate upside for {selectedCrop}.</p>
                <p className="text-muted-foreground">Use forecast with policy simulation before intervention rollout.</p>
              </CardContent>
            </Card>
          )}
          {canViewDataQuality && (
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Data Quality Indicators</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Source confidence: 0.92 | Missing points: 4.1%</p>
                <p className="text-muted-foreground">Recommended: prefer eNAM-tagged records for embedded analytics outputs.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default Analytics;
