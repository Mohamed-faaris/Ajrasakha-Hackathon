import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { usePrediction, usePredictionStatus } from "@/hooks/use-prediction";
import { useCrops, useStates } from "@/hooks/use-crops";
import { useMandis } from "@/hooks/use-crops";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useTypedQuery } from "@/hooks/use-api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Hook to get crops available for a mandi
function useMandiCrops(mandiId?: string) {
  return useTypedQuery(
    ["mandi-crops", mandiId],
    async () => {
      if (!mandiId) return [];
      const res = await fetch(`/api/prices/mandi/${mandiId}/crops`);
      if (!res.ok) throw new Error("Failed to fetch crops");
      return res.json();
    },
    { enabled: !!mandiId }
  );
}

// Hook to get prices for a mandi
function useMandiPrices(mandiId?: string) {
  return useTypedQuery(
    ["mandi-prices", mandiId],
    async () => {
      if (!mandiId) return [];
      const res = await fetch(`/api/prices/mandi/${mandiId}/prices?limit=50`);
      if (!res.ok) throw new Error("Failed to fetch prices");
      return res.json();
    },
    { enabled: !!mandiId }
  );
}

const Analytics = () => {
  const queryClient = useQueryClient();
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedMandi, setSelectedMandi] = useState<string>("");
  const [selectedCrop, setSelectedCrop] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: allStates = [] } = useStates();
  const { data: mandis = [], isLoading: mandisLoading, error: mandisError } = useMandis(selectedState);
  const { data: mandiCrops = [] } = useMandiCrops(selectedMandi);
  const { data: mandiPrices = [] } = useMandiPrices(selectedMandi);

  const { data: prediction, isLoading: predictionLoading, error: predictionError } = usePrediction(
    selectedCrop || undefined,
    selectedMandi || undefined
  );
  const { data: predictionStatus } = usePredictionStatus(
    selectedCrop || undefined,
    selectedMandi || undefined
  );

  // Get selected mandi name
  const selectedMandiName = useMemo(() => {
    return mandis.find(m => m.id === selectedMandi)?.name || selectedMandi;
  }, [mandis, selectedMandi]);

  // Get selected state name
  const selectedStateName = useMemo(() => {
    return allStates.find(s => s.id === selectedState)?.name || selectedState;
  }, [allStates, selectedState]);

  // Get selected crop name
  const selectedCropName = useMemo(() => {
    return mandiCrops.find(c => c.id === selectedCrop)?.name || selectedCrop;
  }, [mandiCrops, selectedCrop]);

  // Build chart data from predictions
  const chartData = useMemo(() => {
    if (!prediction?.predictions?.length) return [];
    return prediction.predictions.map((p) => ({
      date: p.date,
      price: p.predictedPrice,
      confidence: p.confidence,
    }));
  }, [prediction]);

  // Group prices by crop
  const pricesByCrop = useMemo(() => {
    const grouped: Record<string, typeof mandiPrices> = {};
    mandiPrices.forEach(p => {
      if (!grouped[p.cropId]) grouped[p.cropId] = [];
      grouped[p.cropId].push(p);
    });
    return grouped;
  }, [mandiPrices]);

  const handleRefresh = async () => {
    if (!selectedCrop || !selectedMandi) return;
    setIsRefreshing(true);
    try {
      await apiClient.refreshPrediction(selectedCrop, selectedMandi);
      queryClient.invalidateQueries({ queryKey: ["prediction", selectedCrop, selectedMandi] });
    } catch (error) {
      console.error("Failed to refresh prediction:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const chartConfig = {
    price: { label: "Predicted Price", color: "hsl(var(--primary))" },
    confidence: { label: "Confidence %", color: "hsl(var(--secondary))" },
  };

  const hasSelection = selectedCrop && selectedMandi;
  const showPredictionCard = hasSelection && !predictionLoading && !predictionError && prediction;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Analytics & Predictions</h1>
          <p className="text-sm text-muted-foreground">Select state → mandi → crop to view price predictions</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Step 1: Select State */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Step 1: State</span>
              <Select value={selectedState} onValueChange={(v) => { 
                setSelectedState(v); 
                setSelectedMandi(""); 
                setSelectedCrop("");
              }}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  {allStates.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Step 2: Select Mandi */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Step 2: Mandi</span>
              <Select
                key={`mandi-select-${selectedState}-${mandis.length}`}
                value={selectedMandi}
                onValueChange={(v) => {
                  setSelectedMandi(v);
                  setSelectedCrop("");
                }}
                disabled={!selectedState || mandisLoading}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder={
                    mandisLoading ? "Loading mandis..." :
                    mandisError ? "Error loading mandis" :
                    selectedState ? `${mandis.length} mandis available` :
                    "Select state first"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {mandis.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {mandisError && (
                <p className="text-xs text-destructive">{(mandisError as Error).message}</p>
              )}
            </div>

            {/* Step 3: Select Crop */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Step 3: Crop</span>
              <Select value={selectedCrop} onValueChange={setSelectedCrop} disabled={!selectedMandi || mandiCrops.length === 0}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={
                    !selectedMandi ? "Select mandi first" :
                    mandiCrops.length === 0 ? "No crops available" :
                    `${mandiCrops.length} crops available`
                  } />
                </SelectTrigger>
                <SelectContent>
                  {mandiCrops.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedMandi && mandiCrops.length === 0 && (
                <p className="text-xs text-amber-600">No price data for this mandi</p>
              )}
            </div>

            {hasSelection && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="mt-5"
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                Refresh Prediction
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mandi Info & Available Crops */}
      {selectedMandi && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">
              {selectedMandiName} - Available Crops
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mandiCrops.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No price data available for this mandi.</p>
                <p className="text-sm text-muted-foreground mt-1">Try selecting a different mandi.</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {mandiCrops.map((crop) => (
                  <Badge
                    key={crop.id}
                    variant={selectedCrop === crop.id ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedCrop(crop.id)}
                  >
                    {crop.name}
                    <span className="ml-1 text-xs opacity-70">({crop.priceCount} records)</span>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Prices Table */}
      {selectedMandi && mandiPrices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">
              Recent Prices at {selectedMandiName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Crop</TableHead>
                  <TableHead className="text-right">Min ₹</TableHead>
                  <TableHead className="text-right">Max ₹</TableHead>
                  <TableHead className="text-right">Modal ₹</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mandiPrices.slice(0, 10).map((p) => (
                  <TableRow key={`${p.cropId}-${p.date}`} className={selectedCrop === p.cropId ? "bg-primary/5" : ""}>
                    <TableCell className="text-xs">{p.date?.split('T')[0]}</TableCell>
                    <TableCell className="font-medium">{p.cropName}</TableCell>
                    <TableCell className="text-right font-mono">₹{p.minPrice?.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono">₹{p.maxPrice?.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono font-semibold">₹{p.modalPrice?.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {mandiPrices.length > 10 && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                Showing 10 of {mandiPrices.length} records
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Price Prediction */}
      {selectedCrop && selectedMandi && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">
              {selectedCropName} at {selectedMandiName} - Price Prediction
              {predictionStatus?.hasValidPrediction && (
                <Badge variant="outline" className="ml-2">
                  {predictionStatus.trend}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {predictionLoading ? (
              <div className="p-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading prediction...
              </div>
            ) : predictionError || !prediction ? (
              <div className="p-6 text-center text-sm text-destructive">
                <p>No prediction available for this crop/mandi combination.</p>
                <p className="text-xs mt-2">Insufficient historical data or prediction service unavailable.</p>
              </div>
            ) : chartData.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No prediction data available.
              </div>
            ) : (
              <>
                <ChartContainer config={chartConfig} className="h-[320px] w-full">
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                      fontSize={11}
                    />
                    <YAxis fontSize={11} tickFormatter={(v) => `₹${v}`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="confidence"
                      fill="hsl(var(--secondary) / 0.2)"
                      stroke="hsl(var(--secondary) / 0.5)"
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                    />
                  </ComposedChart>
                </ChartContainer>

                {/* Prediction Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Trend</p>
                      <div className="flex items-center gap-2">
                        {prediction.trend === "Bullish" ? (
                          <TrendingUp className="h-5 w-5 text-emerald-600" />
                        ) : prediction.trend === "Bearish" ? (
                          <TrendingDown className="h-5 w-5 text-destructive" />
                        ) : (
                          <Minus className="h-5 w-5 text-muted-foreground" />
                        )}
                        <span className={`text-lg font-bold ${
                          prediction.trend === "Bullish" ? "text-emerald-600" :
                          prediction.trend === "Bearish" ? "text-destructive" :
                          "text-muted-foreground"
                        }`}>
                          {prediction.trend}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Next Day Prediction</p>
                      <p className="text-2xl font-bold font-display">
                        ₹{prediction.predictions[0]?.predictedPrice?.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Confidence</p>
                      <p className="text-2xl font-bold font-display">
                        {prediction.predictions[0]?.confidence?.toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Forecast Days</p>
                      <p className="text-2xl font-bold font-display">{prediction.predictions.length}</p>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!selectedState && (
        <Card className="bg-muted/20">
          <CardContent className="p-12 text-center">
            <p className="text-lg font-medium text-muted-foreground">Select a state to get started</p>
            <p className="text-sm text-muted-foreground mt-2">Choose a state to view available mandis and their price predictions</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Analytics;
