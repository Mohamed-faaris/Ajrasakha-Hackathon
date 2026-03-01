import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar } from "lucide-react";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth";
import type { State, CropInfo, UserRole } from "@/lib/types";
import { hasRoleCapability } from "@/lib/role-access";

const Reports = () => {
  const { data } = useSession();
  const role = data?.user?.role as UserRole | undefined;

  const [state, setState] = useState("all");
  const [crop, setCrop] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [states, setStates] = useState<State[]>([]);
  const [crops, setCrops] = useState<CropInfo[]>([]);

  useEffect(() => {
    api.getStates().then(setStates);
    api.getCrops().then(setCrops);
  }, []);

  const sampleReports = [
    { title: "Weekly Market Summary - All India", date: "2026-02-10", type: "Summary", pages: 12 },
    { title: "Maharashtra Onion Price Report", date: "2026-02-09", type: "State Report", pages: 8 },
    { title: "Wheat MSP Comparison - Rabi 2025-26", date: "2026-02-07", type: "Analysis", pages: 15 },
    { title: "APMC Coverage Gap Analysis", date: "2026-02-05", type: "Coverage", pages: 20 },
    { title: "Top Arbitrage Opportunities - Feb 2026", date: "2026-02-03", type: "Arbitrage", pages: 6 },
  ];

  const canBulkExport = hasRoleCapability(role, "bulk_export") || hasRoleCapability(role, "bulk_historical_data_access");
  const canPolicyReports = hasRoleCapability(role, "policy_reports");
  const canArbitrage = hasRoleCapability(role, "arbitrage_detection");
  const canApi = hasRoleCapability(role, "api_access");

  const visibleReports = sampleReports.filter((report) => {
    if (report.type === "Coverage") return canPolicyReports;
    if (report.type === "Arbitrage") return canArbitrage;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground">Generate and download market reports</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Generate Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label className="text-xs">State</Label>
              <Select value={state} onValueChange={setState}>
                <SelectTrigger><SelectValue placeholder="All States" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {states.map((s) => <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Crop</Label>
              <Select value={crop} onValueChange={setCrop}>
                <SelectTrigger><SelectValue placeholder="All Crops" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Crops</SelectItem>
                  {crops.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">From</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button>
              <FileText className="h-4 w-4 mr-1" /> {canPolicyReports ? "Generate Policy PDF" : "Generate PDF"}
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-1" /> {canBulkExport ? "Download Bulk CSV" : "Download CSV"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/20">
        <CardContent className="pt-5">
          {!canApi && !canPolicyReports && (
            <p className="text-sm text-muted-foreground">Role mode: simple field-ready reports and printable summaries.</p>
          )}
          {canPolicyReports && (
            <p className="text-sm text-muted-foreground">Role mode: state-level policy exports with coverage and anomaly context.</p>
          )}
          {canApi && (
            <p className="text-sm text-muted-foreground">Role mode: API-oriented exports with large historical data support.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {visibleReports.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary/60" />
                  <div>
                    <p className="font-medium text-sm">{r.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {r.date}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">{r.type}</Badge>
                      <span className="text-xs text-muted-foreground">{r.pages} pages</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/10">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold font-display text-primary">+12%</p>
              <p className="text-xs text-muted-foreground">Avg potato price this month across 450 APMCs</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-destructive">-8%</p>
              <p className="text-xs text-muted-foreground">Tomato prices dropped in South India</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-secondary">Rs 2,450</p>
              <p className="text-xs text-muted-foreground">National avg wheat price (above MSP)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
