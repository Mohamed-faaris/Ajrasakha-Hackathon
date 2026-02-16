import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar } from "lucide-react";
import { api } from "@/lib/api";
import type { State, CropInfo } from "@/lib/types";

const Reports = () => {
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
    { title: "Weekly Market Summary — All India", date: "2026-02-10", type: "Summary", pages: 12 },
    { title: "Maharashtra Onion Price Report", date: "2026-02-09", type: "State Report", pages: 8 },
    { title: "Wheat MSP Comparison — Rabi 2025-26", date: "2026-02-07", type: "Analysis", pages: 15 },
    { title: "APMC Coverage Gap Analysis", date: "2026-02-05", type: "Coverage", pages: 20 },
    { title: "Top Arbitrage Opportunities — Feb 2026", date: "2026-02-03", type: "Arbitrage", pages: 6 },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">Generate and download market reports</p>
        </div>

        {/* Report Generator */}
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
                <FileText className="h-4 w-4 mr-1" /> Generate PDF
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-1" /> Download CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sampleReports.map((r, i) => (
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

        {/* Summary Card */}
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
                <p className="text-2xl font-bold font-display text-secondary">₹2,450</p>
                <p className="text-xs text-muted-foreground">National avg wheat price (above MSP)</p>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  );
};

export default Reports;
