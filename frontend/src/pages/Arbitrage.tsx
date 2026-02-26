import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ArbitrageOpportunity } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeftRight, TrendingUp } from "lucide-react";

const Arbitrage = () => {
  const [opps, setOpps] = useState<ArbitrageOpportunity[]>([]);

  useEffect(() => {
    api.getArbitrageOpportunities().then(setOpps);
  }, []);

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
          <h1 className="font-display text-2xl font-bold">Arbitrage</h1>
          <p className="text-sm text-muted-foreground">Price gaps and data completeness</p>
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
  );
};

export default Arbitrage;
