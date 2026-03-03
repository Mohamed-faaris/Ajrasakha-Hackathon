import { useState } from "react";
import { format } from "date-fns";
import { Copy, RefreshCw, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useIntegrationSettings } from "@/hooks/useAPMCHooks";

export default function IntegrationSettings() {
  const { data: settings, updateSource, regenerateKey } = useIntegrationSettings();
  const [source, setSource] = useState(settings.dataSourceType);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Integration Settings</h1>
        <p className="text-sm text-muted-foreground">Configure your data source and API access</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-heading">Data Source Type</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={source}
              onValueChange={(v) => {
                setSource(v as typeof source);
                updateSource(v);
              }}
              className="space-y-3"
            >
              {[
                { value: "manual", label: "Manual Entry", desc: "Enter prices one by one via the form" },
                { value: "excel", label: "Excel Upload", desc: "Upload CSV or Excel files in bulk" },
                { value: "api", label: "API Integration", desc: "Push data via REST API" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                >
                  <RadioGroupItem value={opt.value} className="mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {source === "api" && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-heading">API Credentials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="flex gap-2">
                  <Input value={settings.apiKey} readOnly className="bg-muted font-mono text-sm" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(settings.apiKey, "apiKey")}
                  >
                    {copied === "apiKey" ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <div className="flex gap-2">
                  <Input value={settings.webhookUrl} readOnly className="bg-muted font-mono text-sm" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(settings.webhookUrl, "webhook")}
                  >
                    {copied === "webhook" ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button variant="outline" className="gap-2" onClick={regenerateKey}>
                <RefreshCw className="h-4 w-4" />
                Regenerate API Key
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-heading">Verification Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Verified</span>
              <span className="text-sm font-medium">
                {format(new Date(settings.lastVerified), "PPP")}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
