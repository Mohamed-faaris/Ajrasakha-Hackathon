import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, TrendingUp, TrendingDown, BellRing, Clock, Trash2, BellOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAlerts, useCreateAlert, useDeleteAlert } from "@/hooks/use-alerts";
import { useCrops, useMandis } from "@/hooks/use-crops";
import type { PriceAlert, AlertDirection } from "@shared/types";
import { apiClient } from "@/lib/api-client";

// FCM Hook - requests push notification permission
const useFCM = () => {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if ("Notification" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      return { success: false, error: "Notifications not supported" };
    }

    setIsLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        // In a real implementation, this would get the FCM token
        // from Firebase messaging and register it with the server
        setToken("placeholder-token");
        return { success: true, token: "placeholder-token" };
      } else {
        return { success: false, error: `Permission ${result}` };
      }
    } catch (error) {
      return { success: false, error: String(error) };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    permission,
    isSupported,
    token,
    isLoading,
    requestPermission,
  };
};

type AlertType = "price" | "trend" | "both";
type TrendDirection = "increase" | "decrease";

interface ExtendedPriceAlert extends PriceAlert {
  alertType?: AlertType;
  mandi?: string;
  trendPercentage?: number;
  trendDays?: number;
  trendDirection?: TrendDirection;
  cooldownHours?: number;
  lastNotifiedAt?: string;
}

const PriceAlerts = () => {
  const { toast } = useToast();
  const { data: alerts = [], isLoading: alertsLoading } = useAlerts();
  const createAlert = useCreateAlert();
  const deleteAlert = useDeleteAlert();
  const { data: crops = [] } = useCrops();
  const { data: mandis = [] } = useMandis();
  const { permission, isSupported, isLoading: fcmLoading, requestPermission } = useFCM();

  // Alert type selection
  const [alertType, setAlertType] = useState<AlertType>("price");

  // Price alert fields
  const [priceCrop, setPriceCrop] = useState("");
  const [priceMandi, setPriceMandi] = useState("");
  const [priceThreshold, setPriceThreshold] = useState("");
  const [priceDirection, setPriceDirection] = useState<AlertDirection>("above");

  // Trend alert fields
  const [trendPercentage, setTrendPercentage] = useState("");
  const [trendDays, setTrendDays] = useState("5");
  const [trendDirection, setTrendDirection] = useState<TrendDirection>("increase");

  // Common fields
  const [cooldownHours, setCooldownHours] = useState("24");
  const [sendingSample, setSendingSample] = useState(false);
  const [sendingTestPush, setSendingTestPush] = useState(false);

  const showPriceSection = alertType === "price" || alertType === "both";
  const showTrendSection = alertType === "trend" || alertType === "both";

  const handleCreateAlert = async () => {
    // Validate based on alert type
    if (showPriceSection && (!priceCrop || !priceThreshold)) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required price alert fields.",
        variant: "destructive",
      });
      return;
    }

    if (showTrendSection && (!trendPercentage || !trendDays)) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required trend alert fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createAlert.mutateAsync({
        crop: priceCrop,
        mandiId: priceMandi || undefined,
        alertType,
        threshold: showPriceSection ? Number(priceThreshold) : undefined,
        type: showPriceSection ? priceDirection : undefined,
        percentage: showTrendSection ? Number(trendPercentage) : undefined,
        days: showTrendSection ? Number(trendDays) : undefined,
        trendDirection: showTrendSection ? trendDirection : undefined,
        cooldownHours: Number(cooldownHours),
      });

      // Reset form after successful creation
      setPriceCrop("");
      setPriceMandi("");
      setPriceThreshold("");
      setTrendPercentage("");
      setTrendDays("5");
      setCooldownHours("24");

      toast({
        title: "Success",
        description: "Alert created successfully. An email will also be sent when triggered.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create alert. Please try again.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleSendTestPush = async () => {
    if (!isSupported) {
      toast({
        title: "Push not supported",
        description: "This browser does not support notifications.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSendingTestPush(true);
      let granted = permission === "granted";
      if (!granted) {
        const pushResult = await requestPermission();
        granted = pushResult.success;
      }

      if (!granted) {
        throw new Error("Notification permission not granted.");
      }

      const selectedCropName = crops.find((crop) => crop.id === priceCrop)?.name || "WHEAT";
      const selectedMandiName = mandis.find((mandi) => mandi.id === priceMandi)?.name || "Sample Mandi";
      new Notification("Test Push Notification", {
        body: `${selectedCropName} at ${selectedMandiName} crossed your watch threshold.`,
        icon: "/favicon.ico",
      });

      toast({
        title: "Test push sent",
        description: "Browser test push notification sent.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send test push.",
        variant: "destructive",
      });
    } finally {
      setSendingTestPush(false);
    }
  };

  const handleSendSampleMail = async () => {
    try {
      setSendingSample(true);
      const selectedCropName = crops.find((crop) => crop.id === priceCrop)?.name;
      const selectedMandiName = mandis.find((mandi) => mandi.id === priceMandi)?.name;

      const response = await apiClient.sendSampleAlertEmail({
        alertType,
        cropName: selectedCropName,
        mandiName: selectedMandiName,
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to send sample email");
      }

      toast({
        title: "Sample email sent",
        description: response.message || "Sample alert email sent successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send sample email.",
        variant: "destructive",
      });
    } finally {
      setSendingSample(false);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      await deleteAlert.mutateAsync(id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete alert. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getAlertTypeBadge = (alert: ExtendedPriceAlert) => {
    const type = alert.alertType || "price";
    const variants: Record<AlertType, { variant: "default" | "secondary" | "outline"; label: string }> = {
      price: { variant: "default", label: "Price" },
      trend: { variant: "secondary", label: "Trend" },
      both: { variant: "outline", label: "Both" },
    };
    const config = variants[type];
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  const getPermissionStatusIcon = () => {
    switch (permission) {
      case "granted":
        return <BellRing className="h-4 w-4 text-green-500" />;
      case "denied":
        return <BellOff className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPermissionStatusText = () => {
    switch (permission) {
      case "granted":
        return "Push notifications enabled";
      case "denied":
        return "Push notifications blocked";
      default:
        return "Push notifications not enabled";
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Price Alerts</h1>
        <p className="text-sm text-muted-foreground">Create and manage crop price threshold and trend alerts</p>
      </div>

      {/* FCM Permission Card */}
      {isSupported && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Alert Channels
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getPermissionStatusIcon()}
                <div>
                  <p className="text-sm font-medium">{getPermissionStatusText()}</p>
                  <p className="text-xs text-muted-foreground">
                    Receive alerts even when the app is closed
                  </p>
                </div>
              </div>
              {permission !== "granted" && (
                <Button
                  onClick={requestPermission}
                  disabled={fcmLoading || permission === "denied"}
                  size="sm"
                >
                  {fcmLoading ? "Enabling..." : "Enable Notifications"}
                </Button>
              )}
            </div>
            <div className="space-y-3 rounded-md border p-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-xs text-muted-foreground">Receive alert mails when triggered.</p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleSendSampleMail}
                  disabled={sendingSample}
                  className="w-full md:w-auto"
                >
                  {sendingSample ? "Sending..." : "Send Sample"}
                </Button>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Push</p>
                  <p className="text-xs text-muted-foreground">Test a browser push notification.</p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleSendTestPush}
                  disabled={sendingTestPush}
                  className="w-full md:w-auto"
                >
                  {sendingTestPush ? "Sending..." : "Send Test Push"}
                </Button>
              </div>
            </div>
            {permission === "denied" && (
              <p className="text-xs text-muted-foreground">
                You have blocked notifications. Please enable them in your browser settings to receive alerts.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Alert Card */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Create New Alert
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Alert Type Selection */}
          <div className="space-y-2">
            <Label className="text-xs">Alert Type</Label>
            <Tabs value={alertType} onValueChange={(value) => setAlertType(value as AlertType)}>
              <TabsList className="grid w-full grid-cols-3 md:w-auto">
                <TabsTrigger value="price">Price Alert</TabsTrigger>
                <TabsTrigger value="trend">Trend Alert</TabsTrigger>
                <TabsTrigger value="both">Both</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Price Alert Section */}
          {showPriceSection && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Price Alert Settings
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Crop *</Label>
                  <Select value={priceCrop} onValueChange={setPriceCrop}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select crop" />
                    </SelectTrigger>
                    <SelectContent>
                      {crops.map((crop) => (
                        <SelectItem key={crop.id} value={crop.id}>
                          {crop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Mandi (Optional)</Label>
                  <Select value={priceMandi} onValueChange={setPriceMandi}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any mandi" />
                    </SelectTrigger>
                    <SelectContent>
                      {mandis.map((mandi) => (
                        <SelectItem key={mandi.id} value={mandi.id}>
                          {mandi.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Threshold Price (Rs/qtl) *</Label>
                  <Input
                    type="number"
                    placeholder="2500"
                    value={priceThreshold}
                    onChange={(e) => setPriceThreshold(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Direction</Label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="priceDirection"
                        value="above"
                        checked={priceDirection === "above"}
                        onChange={(e) => setPriceDirection(e.target.value as AlertDirection)}
                        className="rounded border-gray-300"
                      />
                      <TrendingUp className="h-4 w-4" />
                      Above
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="priceDirection"
                        value="below"
                        checked={priceDirection === "below"}
                        onChange={(e) => setPriceDirection(e.target.value as AlertDirection)}
                        className="rounded border-gray-300"
                      />
                      <TrendingDown className="h-4 w-4" />
                      Below
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trend Alert Section */}
          {showTrendSection && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Trend Alert Settings
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Percentage Change (%) *</Label>
                  <Input
                    type="number"
                    placeholder="20"
                    value={trendPercentage}
                    onChange={(e) => setTrendPercentage(e.target.value)}
                    min="1"
                    max="100"
                  />
                  <p className="text-xs text-muted-foreground">Alert when price changes by this %</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Over Days *</Label>
                  <Input
                    type="number"
                    placeholder="5"
                    value={trendDays}
                    onChange={(e) => setTrendDays(e.target.value)}
                    min="1"
                    max="30"
                  />
                  <p className="text-xs text-muted-foreground">Compare price over this period</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Direction</Label>
                  <div className="flex items-center gap-4 pt-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="trendDirection"
                        value="increase"
                        checked={trendDirection === "increase"}
                        onChange={(e) => setTrendDirection(e.target.value as TrendDirection)}
                        className="rounded border-gray-300"
                      />
                      <TrendingUp className="h-4 w-4" />
                      Increase
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="trendDirection"
                        value="decrease"
                        checked={trendDirection === "decrease"}
                        onChange={(e) => setTrendDirection(e.target.value as TrendDirection)}
                        className="rounded border-gray-300"
                      />
                      <TrendingDown className="h-4 w-4" />
                      Decrease
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cooldown Setting */}
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-2">
              <Clock className="h-3 w-3" />
              Cooldown Period (hours)
            </Label>
            <Input
              type="number"
              value={cooldownHours}
              onChange={(e) => setCooldownHours(e.target.value)}
              min="1"
              max="168"
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">
              Minimum hours between notifications for this alert (default: 24)
            </p>
          </div>

          <Button
            onClick={handleCreateAlert}
            disabled={createAlert.isPending}
            className="w-full md:w-auto"
          >
            {createAlert.isPending ? "Creating..." : "Create Alert"}
          </Button>
        </CardContent>
      </Card>

      {/* Alert List */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Your Alerts ({alerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alertsLoading ? (
            <p className="text-sm text-muted-foreground">Loading alerts...</p>
          ) : alerts.length > 0 ? (
            <div className="space-y-3">
              {(alerts as ExtendedPriceAlert[]).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start justify-between p-4 bg-muted/50 rounded-lg"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getAlertTypeBadge(alert)}
                      <span className="font-medium">{alert.cropName || alert.crop || alert.cropId}</span>
                      {alert.state && (
                        <span className="text-xs text-muted-foreground">({alert.state})</span>
                      )}
                    </div>

                    {/* Price alert details */}
                    {(!alert.alertType || alert.alertType === "price" || alert.alertType === "both") && alert.thresholdPrice !== undefined && (
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <TrendingUp className="h-3 w-3" />
                        {(alert.direction || alert.thresholdType) === "above" ? "Above" : "Below"} Rs{" "}
                        {alert.thresholdPrice?.toLocaleString()}/qtl
                        {(alert.mandiName || alert.mandi) && <span className="text-xs">at {alert.mandiName || alert.mandi}</span>}
                      </div>
                    )}

                    {/* Trend alert details */}
                    {(alert.alertType === "trend" || alert.alertType === "both") && (
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <TrendingUp className="h-3 w-3" />
                        {alert.trendDirection === "increase" ? "Increase" : "Decrease"} of{" "}
                        {(alert.percentage ?? alert.trendPercentage)}% over {(alert.days ?? alert.trendDays)} days
                      </div>
                    )}

                    {/* Cooldown and last notified */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Cooldown: {alert.cooldownHours || 24}h
                      </span>
                      {alert.lastNotifiedAt && (
                        <span className="flex items-center gap-1">
                          <BellRing className="h-3 w-3" />
                          Last notified: {new Date(alert.lastNotifiedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAlert(alert.id)}
                    disabled={deleteAlert.isPending}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">No alerts configured yet.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create an alert to get notified when prices change.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PriceAlerts;
