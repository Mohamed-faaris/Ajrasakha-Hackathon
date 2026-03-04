import {
  CalendarDays,
  Database,
  HeartPulse,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/apmc/StatCard";
import { useAPMCStats } from "@/hooks/useAPMCHooks";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export default function APMCDashboard() {
  const { data: stats } = useAPMCStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your APMC integration</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Last Submission"
          value={stats.lastSubmission}
          icon={CalendarDays}
          accentColor="primary"
          description="Most recent data entry"
        />
        <StatCard
          title="Total Records"
          value={stats.totalRecords.toLocaleString()}
          icon={Database}
          accentColor="secondary"
          description="All-time submissions"
        />
        <StatCard
          title="Data Health"
          value={stats.dataHealth}
          icon={HeartPulse}
          accentColor="success"
          description="No delays detected"
        />
        <StatCard
          title="Coverage Contribution"
          value={`${stats.coverageContribution}%`}
          icon={TrendingUp}
          accentColor="info"
          description="Regional coverage share"
        />
        <StatCard
          title="Monthly Avg"
          value={Math.round(stats.submissionTrend.reduce((a, b) => a + b.count, 0) / stats.submissionTrend.length)}
          icon={BarChart3}
          accentColor="accent"
          description="Avg submissions per month"
        />
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-heading">Submission Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.submissionTrend}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 55%, 35%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 55%, 35%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(80, 15%, 88%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(142, 55%, 35%)"
                  strokeWidth={2}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
