import { useEffect, useState } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Key, LogOut, Copy, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { data: session, isLoading } = useSession();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isLoading && !session) {
      navigate("/login");
    }
  }, [session, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!session) return null;

  const handleCopyApiUrl = () => {
    navigator.clipboard.writeText("https://api.mandi-insights.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900">Developer Portal</h1>
              <p className="text-xs text-slate-500">Mandi Insights API</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">{session.user?.email}</span>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>API Endpoint</CardDescription>
              <CardTitle className="text-2xl font-mono">/api/dev</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={handleCopyApiUrl}>
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? "Copied!" : "Copy Base URL"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Authentication</CardDescription>
              <CardTitle className="text-2xl">API Key</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Use your API key in the <code className="bg-slate-100 px-1 rounded">x-api-key</code> header
              </p>
              <Button onClick={() => navigate("/api-keys")}>
                <Key className="h-4 w-4 mr-2" />
                Manage Keys
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Rate Limit</CardDescription>
              <CardTitle className="text-2xl">100/min</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Requests per minute per API key
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>Get started with the Mandi Insights API</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-green-400 text-sm font-mono">
{`# Get prices
curl "https://api.mandi-insights.com/api/dev/prices?cropId=abc" \\
  -H "x-api-key: sk_live_xxxxxxxxxxxx"

# Get crops
curl "https://api.mandi-insights.com/api/dev/crops" \\
  -H "x-api-key: sk_live_xxxxxxxxxxxx"

# Get states
curl "https://api.mandi-insights.com/api/dev/states" \\
  -H "x-api-key: sk_live_xxxxxxxxxxxx"`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
