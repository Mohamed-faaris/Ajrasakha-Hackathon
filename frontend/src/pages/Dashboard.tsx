import { useEffect, useState, useMemo } from "react";
import { api, type PriceFilters } from "@/lib/api";
import type { CropPrice, CropInfo, State } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, ArrowUpDown, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { useSession } from "@/lib/auth";
import type { UserRole } from "@/lib/types";
import { hasRoleCapability } from "@/lib/role-access";

type SortKey = "crop" | "minPrice" | "maxPrice" | "modalPrice";

const Dashboard = () => {
  const { data } = useSession();
  const role = data?.user?.role as UserRole | undefined;
  const [prices, setPrices] = useState<CropPrice[]>([]);
  const [allCrops, setAllCrops] = useState<CropInfo[]>([]);
  const [allStates, setAllStates] = useState<State[]>([]);
  const [filters, setFilters] = useState<PriceFilters>({});
  const [searchQ, setSearchQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("crop");
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    api.getCrops().then(setAllCrops);
    api.getStates().then(setAllStates);
  }, []);

  useEffect(() => {
    api.getPrices(filters).then(setPrices);
  }, [filters]);

  const filtered = useMemo(() => {
    let d = [...prices];
    if (searchQ) {
      const q = searchQ.toLowerCase();
      d = d.filter(
        (p) =>
          p.crop.toLowerCase().includes(q) ||
          p.mandi.toLowerCase().includes(q) ||
          p.state.toLowerCase().includes(q) ||
          p.district.toLowerCase().includes(q)
      );
    }
    d.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === "string") return sortAsc ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
      return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return d;
  }, [prices, searchQ, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const exportCSV = () => {
    const header = "Date,State,District,Mandi,Crop,Variety,Min Price,Max Price,Modal Price,Unit,Source\n";
    const rows = filtered.map(p =>
      `${p.date},${p.state},${p.district},${p.mandi},${p.crop},${p.variety},${p.minPrice},${p.maxPrice},${p.modalPrice},${p.unit},${p.source}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "mandi-prices.csv"; a.click();
  };

  const sourceBadgeVariant = (source: string) => {
    if (source === "eNAM") return "default";
    if (source === "Agmarknet") return "secondary";
    return "outline";
  };

  const canBulkExport = hasRoleCapability(role, "bulk_export") || hasRoleCapability(role, "bulk_historical_data_access");
  const canUseArbitrage = hasRoleCapability(role, "arbitrage_detection");
  const canSeeCoverageGaps = hasRoleCapability(role, "coverage_gap_visualization");
  const canUseApi = hasRoleCapability(role, "api_access");

  return (
    <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold">Market Prices Dashboard</h1>
            <p className="text-sm text-muted-foreground">Today's prices across {filtered.length} records</p>
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-1" /> {canBulkExport ? "Bulk Export CSV" : "Export CSV"}
          </Button>
        </div>

        <Card className="bg-muted/20">
          <CardContent className="pt-5">
            {canUseArbitrage && (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Trader tools enabled</p>
                  <p className="text-xs text-muted-foreground">Use live arbitrage signals to compare mandi spreads.</p>
                </div>
                <Button asChild size="sm">
                  <Link to="/arbitrage">Open Arbitrage Engine</Link>
                </Button>
              </div>
            )}
            {!canUseArbitrage && canSeeCoverageGaps && (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Policy analytics mode</p>
                  <p className="text-xs text-muted-foreground">Review integration gaps and market anomalies from map insights.</p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link to="/map">Open Coverage View</Link>
                </Button>
              </div>
            )}
            {!canUseArbitrage && !canSeeCoverageGaps && canUseApi && (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Startup data mode</p>
                  <p className="text-xs text-muted-foreground">API/data-quality oriented workflows are enabled for your account.</p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link to="/reports">Open Data Exports</Link>
                </Button>
              </div>
            )}
            {!canUseArbitrage && !canSeeCoverageGaps && !canUseApi && (
              <div>
                <p className="text-sm font-medium">Farmer market mode</p>
                <p className="text-xs text-muted-foreground">Track live prices, trends, and alerts to decide where and when to sell.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap gap-3 items-center">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-9 h-9" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} />
              </div>
              <Select value={filters.state || "all"} onValueChange={(v) => setFilters({ ...filters, state: v === "all" ? undefined : v })}>
                <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="State" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {allStates.map((s) => <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.crop || "all"} onValueChange={(v) => setFilters({ ...filters, crop: v === "all" ? undefined : v })}>
                <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Crop" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Crops</SelectItem>
                  {allCrops.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.source || "all"} onValueChange={(v) => setFilters({ ...filters, source: v === "all" ? undefined : v })}>
                <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Source" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="eNAM">eNAM</SelectItem>
                  <SelectItem value="Agmarknet">Agmarknet</SelectItem>
                  <SelectItem value="State Portal">State Portal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => handleSort("crop")}>
                  <span className="flex items-center gap-1">Crop <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead>Mandi</TableHead>
                <TableHead>State / District</TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => handleSort("minPrice")}>
                  <span className="flex items-center gap-1 justify-end">Min ₹ <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => handleSort("maxPrice")}>
                  <span className="flex items-center gap-1 justify-end">Max ₹ <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => handleSort("modalPrice")}>
                  <span className="flex items-center gap-1 justify-end">Modal ₹ <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 50).map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.crop}<span className="text-xs text-muted-foreground ml-1">({p.variety})</span></TableCell>
                  <TableCell>{p.mandi}</TableCell>
                  <TableCell>
                    <span className="text-xs">{p.state}</span>
                    <br />
                    <span className="text-xs text-muted-foreground">{p.district}</span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">₹{p.minPrice.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono text-sm">₹{p.maxPrice.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold">₹{p.modalPrice.toLocaleString()}</TableCell>
                  <TableCell><Badge variant={sourceBadgeVariant(p.source)} className="text-[10px]">{p.source}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length > 50 && (
            <div className="p-4 text-center text-sm text-muted-foreground border-t">
              Showing 50 of {filtered.length} records. Use filters to narrow results.
            </div>
          )}
        </Card>
    </div>
  );
};

export default Dashboard;
