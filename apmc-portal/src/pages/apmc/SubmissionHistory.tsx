import { useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSubmissionHistory } from "@/hooks/useAPMCHooks";

const crops = ["All", "Wheat", "Rice", "Soybean", "Cotton", "Maize", "Chickpea", "Mustard"];

export default function SubmissionHistory() {
  const { data: records, totalPages, currentPage } = useSubmissionHistory();
  const [search, setSearch] = useState("");
  const [cropFilter, setCropFilter] = useState("All");
  const [page, setPage] = useState(currentPage);

  const filtered = records.filter((r) => {
    const matchesCrop = cropFilter === "All" || r.crop === cropFilter;
    const matchesSearch =
      !search ||
      r.crop.toLowerCase().includes(search.toLowerCase()) ||
      r.date.includes(search);
    return matchesCrop && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Submission History</h1>
        <p className="text-sm text-muted-foreground">View all past price submissions</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-heading">Records</CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-48 pl-8"
                />
              </div>
              <Select value={cropFilter} onValueChange={setCropFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {crops.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Crop</TableHead>
                  <TableHead className="text-right">Min (₹)</TableHead>
                  <TableHead className="text-right">Max (₹)</TableHead>
                  <TableHead className="text-right">Modal (₹)</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.date}</TableCell>
                    <TableCell>{r.crop}</TableCell>
                    <TableCell className="text-right">{r.minPrice.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{r.maxPrice.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{r.modalPrice.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{r.source}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {filtered.length} of {records.length} records
            </p>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <Button
                  key={i}
                  variant={page === i + 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(i + 1)}
                  className="h-8 w-8 p-0"
                >
                  {i + 1}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
