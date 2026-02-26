import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type AlertType = "above" | "below";
type PriceAlert = { id: string; crop: string; threshold: number; type: AlertType };
const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const PriceAlerts = () => {
  const [alertCrop, setAlertCrop] = useState("");
  const [alertThreshold, setAlertThreshold] = useState("");
  const [alertType, setAlertType] = useState<AlertType>("above");
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    api
      .getAlerts()
      .then(setAlerts)
      .catch(() => setAlerts([]));
  }, []);

  const addAlert = async () => {
    if (!alertCrop || !alertThreshold) return;

    try {
      const created = await api.createAlert({
        crop: alertCrop,
        threshold: Number(alertThreshold),
        type: alertType,
      });
      setAlerts((prev) => [created, ...prev]);
      setAlertCrop("");
      setAlertThreshold("");
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to create alert."),
        variant: "destructive",
      });
    }
  };

  const deleteAlert = async (id: string) => {
    try {
      await api.deleteAlert(id);
      setAlerts((prev) => prev.filter((item) => item.id !== id));
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to delete alert."),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Price Alerts</h1>
        <p className="text-sm text-muted-foreground">Create and manage crop price threshold alerts</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Price Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            <Select value={alertType} onValueChange={(value) => setAlertType(value as AlertType)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="above">Above</SelectItem>
                <SelectItem value="below">Below</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={addAlert} size="sm">
              Add Alert
            </Button>
          </div>
          {alerts.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between text-sm bg-muted/50 rounded-md px-3 py-2">
                  <span>
                    {alert.crop} - {alert.type} Rs {alert.threshold.toLocaleString()}/qtl
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => deleteAlert(alert.id)}>
                    x
                  </Button>
                </div>
              ))}
            </div>
          )}
          {alerts.length === 0 && <p className="text-sm text-muted-foreground">No alerts configured yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default PriceAlerts;
