import { useState } from "react";
import type { ArbitrageOpportunity } from "@shared/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { ArrowLeftRight, Bell, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useArbitrageOpportunities, useAlerts, useCreateAlert, useDeleteAlert } from "@/hooks/use-coverage";
// use-coverage exports arbitrage hook; alerts mutations come from use-alerts
import { useCreateAlert as useCreateAlertMutation, useDeleteAlert as useDeleteAlertMutation, useAlerts as useAlertsQuery } from "@/hooks/use-alerts";

const Arbitrage = () => {
  const [alertCrop, setAlertCrop] = useState("");
  const [alertThreshold, setAlertThreshold] = useState("");
  const [alertType, setAlertType] = useState<"above" | "below">("above");
  const { toast } = useToast();

  const { data: opps = [], isLoading: oppsLoading, isError: oppsError } = useArbitrageOpportunities();
  const { data: alerts = [] } = useAlertsQuery();
  const createAlert = useCreateAlertMutation();
  const deleteAlert = useDeleteAlertMutation();

  // data fetched via hooks above

  const addAlert = async () => {
    if (!alertCrop || !alertThreshold) return;
    try {
      await createAlert.mutateAsync({
        crop: alertCrop,
        threshold: Number(alertThreshold),
        type: alertType,
      });
      setAlertCrop("");
      setAlertThreshold("");
    } catch (err) {
      // mutation handles toast; fallback
      toast({ title: "Error", description: "Failed to create alert.", variant: "destructive" });
    }
  };

  const deleteAlertById = async (id: string) => {
    try {
      await deleteAlert.mutateAsync(id);
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete alert.", variant: "destructive" });
    }
  };

  const completeness = [
    { crop: "Wheat", score: 82 },
    { crop: "Rice (Paddy)", score: 78 },
    { crop: "Onion", score: 65 },
    { crop: "Tomato", score: 58 },
    { crop: "Potato", score: 71 },
    { crop: "Cotton", score: 45 },
    { crop: "Soybean", score: 52 },
    { crop: "Mustard", score: 61 },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Arbitrage and Alerts</h1>
          <p className="text-sm text-muted-foreground">Price gaps, alert configuration, and data completeness</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-primary" />
              Arbitrage Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Crop</TableHead>
                  <TableHead>Mandi A (Low)</TableHead>
                  <TableHead className="text-right">Price A</TableHead>
                  <TableHead>Mandi B (High)</TableHead>
                  <TableHead className="text-right">Price B</TableHead>
                  <TableHead className="text-right">Diff</TableHead>
                  <TableHead className="text-right">Distance</TableHead>
                </TableRow>
              </TableHeader>
                <TableBody>
                 {opps.map((item, index) => (
                  <TableRow key={`${item.crop}-${index}`}>
                    <TableCell className="font-medium">{item.crop}</TableCell>
                    <TableCell>
                      <span className="text-sm">{item.mandiA}</span>
                      <br />
                      <span className="text-xs text-muted-foreground">{item.stateA}</span>
                    </TableCell>
                    <TableCell className="text-right font-mono">Rs {item.priceA.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className="text-sm">{item.mandiB}</span>
                      <br />
                      <span className="text-xs text-muted-foreground">{item.stateB}</span>
                    </TableCell>
                    <TableCell className="text-right font-mono">Rs {item.priceB.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="default" className="font-mono">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Rs {item.priceDiff.toLocaleString()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">{item.distanceKm} km</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Price Alerts
              </CardTitle>
            </CardHeader>
               <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Crop</Label>
                  <Input placeholder="e.g. Wheat" value={alertCrop} onChange={(e) => setAlertCrop(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Threshold (Rs/qtl)</Label>
                  <Input type="number" placeholder="2500" value={alertThreshold} onChange={(e) => setAlertThreshold(e.target.value)} />
                </div>
              </div>
               <div className="flex items-center gap-3">
                <Select value={alertType} onValueChange={(value) => setAlertType(value as "above" | "below")}> 
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="above">Above</SelectItem>
                    <SelectItem value="below">Below</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={addAlert} size="sm" disabled={createAlert.isLoading}>
                  Add Alert
                </Button>
              </div>
               {alerts.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between text-sm bg-muted/50 rounded-md px-3 py-2">
                      <span>
                        {alert.crop} - {alert.thresholdType || alert.type} Rs {alert.thresholdPrice ? alert.thresholdPrice.toLocaleString() : alert.threshold}/qtl
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => deleteAlertById(alert.id)} disabled={deleteAlert.isLoading}>
                        x
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {alerts.length === 0 && <p className="text-sm text-muted-foreground">No alerts configured yet.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Data Completeness Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">% of APMCs reporting for each crop</p>
              <div className="space-y-3">
                {completeness.map((item) => (
                  <div key={item.crop}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{item.crop}</span>
                      <span className="font-mono font-medium">{item.score}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${item.score}%`,
                          backgroundColor:
                            item.score > 70
                              ? "hsl(var(--primary))"
                              : item.score > 50
                                ? "hsl(var(--warning))"
                                : "hsl(var(--destructive))",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
};

export default Arbitrage;
