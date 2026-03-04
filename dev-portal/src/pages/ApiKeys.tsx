import { useEffect, useState } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TrendingUp, LogOut, Plus, Trash2, Copy, Check, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  prefix: string;
  createdAt: string;
  expiresAt: string | null;
}

export default function ApiKeys() {
  const { data: session, isLoading } = useSession();
  const navigate = useNavigate();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !session) {
      navigate("/login");
    }
  }, [session, isLoading, navigate]);

  useEffect(() => {
    if (session) {
      loadKeys();
    }
  }, [session]);

  const loadKeys = async () => {
    try {
      const { data } = await authClient.apiKey.list();
      setKeys(data || []);
    } catch (err) {
      console.error("Failed to load keys:", err);
    } finally {
      setLoading(false);
    }
  };

  const createKey = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const { data, error } = await authClient.apiKey.create({
        name: newKeyName,
      });
      if (error) {
        throw new Error(error.message);
      }
      if (data) {
        setShowNewKey(data.key);
        setNewKeyName("");
        loadKeys();
      }
    } catch (err) {
      console.error("Failed to create key:", err);
    } finally {
      setCreating(false);
    }
  };

  const deleteKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) return;
    try {
      await authClient.apiKey.delete({ keyId });
      loadKeys();
    } catch (err) {
      console.error("Failed to delete key:", err);
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900">API Keys</h1>
              <p className="text-xs text-slate-500">Developer Portal</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => signOut()}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New API Key</CardTitle>
            <CardDescription>
              Create an API key to access the Mandi Insights API programmatically
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="e.g., Production App, Development, CI/CD"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createKey()}
              />
              <Button onClick={createKey} disabled={creating || !newKeyName.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                {creating ? "Creating..." : "Create Key"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {showNewKey && (
          <Card className="border-yellow-300 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-5 w-5" />
                Save This Key
              </CardTitle>
              <CardDescription className="text-yellow-700">
                This is the only time you'll see this key. Copy it now.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <code className="flex-1 bg-white px-4 py-3 rounded border font-mono text-sm break-all">
                  {showNewKey}
                </code>
                <Button variant="outline" onClick={() => copyKey(showNewKey)}>
                  {copied === showNewKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="secondary" onClick={() => setShowNewKey(null)}>
                  Done
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Your API Keys</CardTitle>
            <CardDescription>
              Manage your API keys for programmatic access
            </CardDescription>
          </CardHeader>
          <CardContent>
            {keys.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                No API keys yet. Create one above to get started.
              </p>
            ) : (
              <div className="space-y-3">
                {keys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{key.name}</p>
                      <p className="text-sm text-slate-500 font-mono">
                        {key.prefix}•••••••••••••
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Created {new Date(key.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => deleteKey(key.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
