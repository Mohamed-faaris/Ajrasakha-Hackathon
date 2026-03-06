import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import { Loader2, RefreshCw, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAnalyticsPredictions } from "@/hooks/use-analytics-predictions";
import { useTypedQuery } from "@/hooks/use-api";
import type { APMCRow, CropRow, PredictionResult, StateRow } from "@shared/types";

interface MandiCropOption {
  id: string;
  name: string;
  priceCount?: number;
}

interface SelectorStateOption {
  id: string;
  name: string;
}

interface SelectorMandiOption {
  id: string;
  name: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL environment variable is required");
}

const chartConfig = {
  price: { label: "Predicted Price", color: "hsl(var(--primary))" },
};

function useStateMasterOptions() {
  return useTypedQuery(
    ["states-master-options"],
    async (): Promise<SelectorStateOption[]> => {
      const response = await fetch(`${API_BASE_URL}/states`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch states");
      const data = (await response.json()) as Array<{ code: string; name: string }>;
      return data.map((item) => ({ id: item.code.toLowerCase(), name: item.name }));
    },
    { staleTime: 30 * 60 * 1000 }
  );
}

function useMandisByStateFallback(stateId?: string) {
  return useTypedQuery(
    ["mandis-fallback", stateId],
    async (): Promise<SelectorMandiOption[]> => {
      if (!stateId) return [];
      const response = await fetch(`${API_BASE_URL}/mandis/state/${stateId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch mandis");
      const data = (await response.json()) as Array<{ id: string; name: string }>;
      return data.map((item) => ({ id: item.id, name: item.name }));
    },
    { enabled: Boolean(stateId), staleTime: 10 * 60 * 1000 }
  );
}

function useMandiCrops(mandiId?: string) {
  return useTypedQuery(
    ["mandi-crops-fallback", mandiId],
    async (): Promise<MandiCropOption[]> => {
      if (!mandiId) return [];
      const response = await fetch(`${API_BASE_URL}/prices/mandi/${mandiId}/crops`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch crops for mandi");
      return response.json();
    },
    { enabled: Boolean(mandiId) }
  );
}

const Analytics = () => {
  const queryClient = useQueryClient();
  const [selectedState, setSelectedState] = useState("");
  const [selectedMandi, setSelectedMandi] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: allStates = [] } = useStateMasterOptions();
  const { data: allMandis = [] } = useMandisByStateFallback(selectedState || undefined);
  const { data: fallbackMandiCrops = [] } = useMandiCrops(selectedMandi || undefined);

  const statesQuery = useAnalyticsPredictions({});
  const apmcsQuery = useAnalyticsPredictions({ stateId: selectedState }, Boolean(selectedState));
  const cropsQuery = useAnalyticsPredictions(
    { stateId: selectedState, mandiId: selectedMandi },
    Boolean(selectedState && selectedMandi)
  );
  const predictionQuery = useAnalyticsPredictions(
    { stateId: selectedState, mandiId: selectedMandi, cropId: selectedCrop },
    Boolean(selectedState && selectedMandi && selectedCrop)
  );

  const stateRows = useMemo<StateRow[]>(
    () =>
      statesQuery.data?.level === "states" && Array.isArray(statesQuery.data.data)
        ? (statesQuery.data.data as StateRow[])
        : [],
    [statesQuery.data]
  );
  const apmcRows = useMemo<APMCRow[]>(
    () =>
      apmcsQuery.data?.level === "apmcs" && Array.isArray(apmcsQuery.data.data)
        ? (apmcsQuery.data.data as APMCRow[])
        : [],
    [apmcsQuery.data]
  );
  const cropRows = useMemo<CropRow[]>(
    () =>
      cropsQuery.data?.level === "crops" && Array.isArray(cropsQuery.data.data)
        ? (cropsQuery.data.data as CropRow[])
        : [],
    [cropsQuery.data]
  );
  const prediction = useMemo<PredictionResult | null>(
    () =>
      predictionQuery.data?.level === "prediction" &&
      predictionQuery.data.data &&
      !Array.isArray(predictionQuery.data.data)
        ? (predictionQuery.data.data as PredictionResult)
        : null,
    [predictionQuery.data]
  );

  const selectedStateRow = useMemo(
    () => stateRows.find((row) => row.stateId === selectedState) ?? null,
    [selectedState, stateRows]
  );
  const selectedApmcRow = useMemo(
    () => apmcRows.find((row) => row.mandiId === selectedMandi) ?? null,
    [selectedMandi, apmcRows]
  );
  const selectedCropRow = useMemo(
    () => cropRows.find((row) => row.cropId === selectedCrop) ?? null,
    [selectedCrop, cropRows]
  );

  const chartData = useMemo(
    () =>
      prediction?.predictions?.map((point) => ({
        date: point.date,
        price: point.predictedPrice,
      })) ?? [],
    [prediction]
  );

  const activeMeta =
    predictionQuery.data ??
    cropsQuery.data ??
    apmcsQuery.data ??
    statesQuery.data ?? { generatedOnMiss: 0, skippedOnCap: 0, cap: 25, level: "states" as const };

  const stateOptions = useMemo(() => {
    if (allStates.length > 0) {
      return allStates;
    }
    return stateRows.map((state) => ({ id: state.stateId, name: state.stateName }));
  }, [allStates, stateRows]);

  const apmcOptions = useMemo(() => {
    if (apmcRows.length > 0) {
      return apmcRows.map((apmc) => ({ id: apmc.mandiId, name: apmc.mandiName }));
    }
    return allMandis.map((mandi) => ({ id: mandi.id, name: mandi.name }));
  }, [allMandis, apmcRows]);

  const cropOptions = useMemo(() => {
    if (cropRows.length > 0) {
      return cropRows.map((crop) => ({ id: crop.cropId, name: crop.cropName }));
    }
    return fallbackMandiCrops.map((crop) => ({ id: crop.id, name: crop.name }));
  }, [cropRows, fallbackMandiCrops]);

  const handleRefresh = async () => {
    if (!selectedMandi || !selectedCrop) return;

    setIsRefreshing(true);
    try {
      await apiClient.refreshPrediction(selectedCrop, selectedMandi);
      await queryClient.invalidateQueries({ queryKey: ["analyticsPredictions"] });
      await queryClient.invalidateQueries({ queryKey: ["prediction", selectedCrop, selectedMandi] });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-bold">Agri Intelligence Control Board</h1>
        <p className="text-sm text-muted-foreground">
          Drill down by state, APMC, and crop. Predictions are served from cache first and generated on demand when missing.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Select
              value={selectedState}
              onValueChange={(value) => {
                setSelectedState(value);
                setSelectedMandi("");
                setSelectedCrop("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {stateOptions.map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedMandi}
              onValueChange={(value) => {
                setSelectedMandi(value);
                setSelectedCrop("");
              }}
              disabled={!selectedState}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedState ? "Select APMC" : "Select state first"} />
              </SelectTrigger>
              <SelectContent>
                {apmcOptions.map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCrop} onValueChange={setSelectedCrop} disabled={!selectedMandi}>
              <SelectTrigger>
                <SelectValue placeholder={selectedMandi ? "Select crop" : "Select APMC first"} />
              </SelectTrigger>
              <SelectContent>
                {cropOptions.map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(statesQuery.error || apmcsQuery.error || cropsQuery.error || predictionQuery.error) && (
            <p className="mt-3 text-xs text-destructive">
              Some analytics data failed to load. Fallback options are shown so you can still continue.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Current Level</p>
            <p className="font-display text-xl font-semibold uppercase">{activeMeta.level}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Generated On Miss</p>
            <p className="font-display text-xl font-semibold">{activeMeta.generatedOnMiss}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Skipped On Cap</p>
            <p className="font-display text-xl font-semibold">{activeMeta.skippedOnCap}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Generation Cap</p>
            <p className="font-display text-xl font-semibold">{activeMeta.cap}</p>
          </CardContent>
        </Card>
      </div>

      {selectedCrop && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">
              Prediction Detail
              {selectedCropRow ? ` - ${selectedCropRow.cropName}` : ""}
            </CardTitle>
            <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {predictionQuery.isLoading ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading prediction...
              </div>
            ) : !prediction ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Prediction is not available right now. Check data quality or retry refresh.
              </p>
            ) : (
              <>
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">Trend</p>
                      <div className="mt-1 flex items-center gap-2">
                        {prediction.trend === "Bullish" ? (
                          <TrendingUp className="h-5 w-5 text-emerald-600" />
                        ) : prediction.trend === "Bearish" ? (
                          <TrendingDown className="h-5 w-5 text-destructive" />
                        ) : (
                          <Minus className="h-5 w-5 text-muted-foreground" />
                        )}
                        <span className="font-semibold">{prediction.trend}</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">Next Day Price</p>
                      <p className="font-display text-2xl font-semibold">
                        ₹{prediction.predictions[0]?.predictedPrice?.toLocaleString("en-IN")}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">Next Day Confidence</p>
                      <p className="font-display text-2xl font-semibold">
                        {prediction.predictions[0]?.confidence?.toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <ChartContainer config={chartConfig} className="h-[320px] w-full">
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) =>
                        new Date(date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
                      }
                    />
                    <YAxis tickFormatter={(value) => `₹${value}`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 2 }} />
                  </ComposedChart>
                </ChartContainer>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">States Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {statesQuery.isLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading states...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>State</TableHead>
                  <TableHead className="text-right">APMCs</TableHead>
                  <TableHead className="text-right">Eligible Pairs</TableHead>
                  <TableHead className="text-right">Predictions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stateRows.map((row) => (
                  <TableRow key={row.stateId} className={selectedState === row.stateId ? "bg-primary/5" : ""}>
                    <TableCell className="font-medium">{row.stateName}</TableCell>
                    <TableCell className="text-right">{row.totalApmcs}</TableCell>
                    <TableCell className="text-right">{row.eligiblePairs}</TableCell>
                    <TableCell className="text-right">{row.predictionsAvailable}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedState && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              APMC Overview {selectedStateRow ? `- ${selectedStateRow.stateName}` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {apmcsQuery.isLoading ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading APMCs...
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>APMC</TableHead>
                    <TableHead className="text-right">Eligible Crops</TableHead>
                    <TableHead className="text-right">Eligible Pairs</TableHead>
                    <TableHead className="text-right">Predictions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apmcRows.map((row) => (
                    <TableRow key={row.mandiId} className={selectedMandi === row.mandiId ? "bg-primary/5" : ""}>
                      <TableCell className="font-medium">{row.mandiName}</TableCell>
                      <TableCell className="text-right">{row.eligibleCrops}</TableCell>
                      <TableCell className="text-right">{row.eligiblePairs}</TableCell>
                      <TableCell className="text-right">{row.predictionsAvailable}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {selectedMandi && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Crop Eligibility {selectedApmcRow ? `- ${selectedApmcRow.mandiName}` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cropsQuery.isLoading ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading crops...
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Crop</TableHead>
                    <TableHead className="text-right">Price Records</TableHead>
                    <TableHead className="text-right">Prediction</TableHead>
                    <TableHead className="text-right">Trend</TableHead>
                    <TableHead className="text-right">Next Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cropRows.map((row) => (
                    <TableRow key={row.cropId} className={selectedCrop === row.cropId ? "bg-primary/5" : ""}>
                      <TableCell className="font-medium">{row.cropName}</TableCell>
                      <TableCell className="text-right">{row.priceCount}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={row.hasPrediction ? "default" : "secondary"}>
                          {row.hasPrediction ? "Available" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{row.trend ?? "-"}</TableCell>
                      <TableCell className="text-right">
                        {row.nextPredictedPrice ? `₹${row.nextPredictedPrice.toLocaleString("en-IN")}` : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  );
};

export default Analytics;
