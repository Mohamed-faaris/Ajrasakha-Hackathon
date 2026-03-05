import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Key, Plus, Trash2, Check, AlertCircle, Book, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api-client";

interface ApiKey {
  id: string;
  name: string;
  key?: string;
  prefix: string;
  start?: string;
  createdAt: string;
  expiresAt?: string;
  lastUsedAt?: string;
}

const apiRootUrl = API_BASE_URL.replace(/\/consumer-portal\/?$/, "");

const API_DOCS = {
  baseUrl: apiRootUrl,
  endpoints: [
    {
      method: "GET",
      path: "/consumer-portal/crops",
      description: "Get list of all available crops",
      params: [],
    },
    {
      method: "GET",
      path: "/consumer-portal/states",
      description: "Get list of all Indian states with APMC markets",
      params: [],
    },
    {
      method: "GET",
      path: "/consumer-portal/mandis",
      description: "Get list of mandis (markets)",
      params: [
        { name: "stateCode", type: "string", required: false, description: "Filter by state code" },
      ],
    },
    {
      method: "GET",
      path: "/consumer-portal/prices",
      description: "Get current crop prices",
      params: [
        { name: "crop", type: "string", required: false, description: "Filter by crop name" },
        { name: "state", type: "string", required: false, description: "Filter by state" },
        { name: "mandi", type: "string", required: false, description: "Filter by mandi" },
      ],
    },
    {
      method: "GET",
      path: "/consumer-portal/coverage",
      description: "Get state-wise APMC coverage data",
      params: [],
    },
    {
      method: "GET",
      path: "/consumer-portal/top-movers",
      description: "Get crops with highest price changes",
      params: [],
    },
    {
      method: "GET",
      path: "/consumer-portal/mandi-prices",
      description: "Get latest prices by mandi location",
      params: [
        { name: "stateName", type: "string", required: false, description: "Filter by state" },
        { name: "cropId", type: "string", required: false, description: "Filter by crop" },
      ],
    },
    {
      method: "GET",
      path: "/consumer-portal/predictions/:cropId/:mandiId",
      description: "Get 30-day price prediction for a crop in a mandi",
      params: [
        { name: "cropId", type: "string", required: true, description: "Crop ID path parameter" },
        { name: "mandiId", type: "string", required: true, description: "Mandi ID path parameter" },
      ],
    },
  ],
  devEndpoints: [
    {
      method: "GET",
      path: "/dev/prices/prices",
      description: "Raw price data (dev only)",
      params: [],
      requiresAuth: true,
    },
    {
      method: "GET",
      path: "/dev/crops",
      description: "All crop data including inactive (dev only)",
      params: [],
      requiresAuth: true,
    },
    {
      method: "GET",
      path: "/dev/states",
      description: "All state data including inactive (dev only)",
      params: [],
      requiresAuth: true,
    },
  ],
};

const ApiDocs = () => {
  const { toast } = useToast();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const authBaseUrlEnv = import.meta.env.VITE_AUTH_BASE_URL;
  if (!authBaseUrlEnv) {
    throw new Error("VITE_AUTH_BASE_URL environment variable is required");
  }

  const trimmedAuthBaseUrl = authBaseUrlEnv.replace(/\/+$/, "");
  const AUTH_BASE_URL = trimmedAuthBaseUrl.endsWith("/auth")
    ? trimmedAuthBaseUrl
    : `${trimmedAuthBaseUrl}/auth`;

  const normalizeApiKey = (raw: Record<string, unknown>): ApiKey => {
    const id = String(raw.id ?? raw.keyId ?? raw._id ?? "");
    const name = String(raw.name ?? "API Key");
    const prefix = String(raw.prefix ?? raw.start ?? "");
    const start = raw.start ? String(raw.start) : undefined;
    const key = typeof raw.key === "string" ? raw.key : undefined;
    const createdAt = String(raw.createdAt ?? new Date().toISOString());
    const expiresAt = raw.expiresAt ? String(raw.expiresAt) : undefined;
    const lastUsedAt = raw.lastUsedAt ? String(raw.lastUsedAt) : undefined;

    return { id, name, prefix, start, key, createdAt, expiresAt, lastUsedAt };
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const res = await fetch(`${AUTH_BASE_URL}/api-key/list`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data?.apiKeys)
          ? data.apiKeys
          : Array.isArray(data)
            ? data
            : [];
        setKeys(list.map((item: Record<string, unknown>) => normalizeApiKey(item)));
      } else {
        const err = await res.json().catch(() => ({}));
        toast({
          title: "Error",
          description: err?.error?.message || err?.message || "Failed to load API keys",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
      toast({
        title: "Error",
        description: "Failed to load API keys",
        variant: "destructive",
      });
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast({ title: "Error", description: "Please enter a name for the API key", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${AUTH_BASE_URL}/api-key/create`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName, expiresIn: 60 * 60 * 24 * 365 }),
      });

      if (res.ok) {
        const data = await res.json();
        const created = (data?.apiKey ?? data) as Record<string, unknown> | undefined;
        if (created) {
          setKeys((prev) => [...prev, normalizeApiKey(created)]);
          setNewKeyName("");
          toast({ title: "Success", description: "API key created. Copy it now - you won't see it again!" });
        } else {
          toast({ title: "Success", description: "API key created." });
          await fetchApiKeys();
        }
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error?.message || "Failed to create API key", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create API key", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteApiKey = async (keyId: string) => {
    try {
      const res = await fetch(`${AUTH_BASE_URL}/api-key/delete`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId }),
      });

      if (res.ok) {
        setKeys(keys.filter((k) => k.id !== keyId));
        toast({ title: "Success", description: "API key deleted" });
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error?.message || "Failed to delete API key", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete API key", variant: "destructive" });
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const copyExample = (method: string, path: string) => {
    const example = `curl -X ${method} "${API_DOCS.baseUrl}${path}" \\
  -H "x-api-key: YOUR_API_KEY"`;
    navigator.clipboard.writeText(example);
    toast({ title: "Copied", description: "cURL example copied to clipboard" });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">API Documentation</h1>
        <p className="text-sm text-muted-foreground">Manage API keys and explore available endpoints</p>
      </div>

      <Tabs defaultValue="keys" className="space-y-4">
        <TabsList>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="docs">Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Your API Keys
              </CardTitle>
              <CardDescription>
                Create API keys to access the Mandi Insights API programmatically
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Key name (e.g., Production App)"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="max-w-md"
                />
                <Button onClick={createApiKey} disabled={isLoading}>
                  <Plus className="h-4 w-4 mr-2" />
                  {isLoading ? "Creating..." : "Create Key"}
                </Button>
              </div>

              {keys.length > 0 ? (
                <div className="space-y-2">
                  {keys.map((key) => (
                    <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{key.name}</span>
                          <Badge variant="outline">{key.start || `${key.prefix}***`}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Created: {new Date(key.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => key.key && copyToClipboard(key.key, key.id)}
                          disabled={!key.key}
                        >
                          {copiedKey === key.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteApiKey(key.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No API keys yet</p>
                  <p className="text-sm">Create one to start using the API</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Usage Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Include your API key in the <code>x-api-key</code> header for all API requests</p>
              <p>• Example: <code className="bg-muted px-1">curl -H "x-api-key: your-api-key" ...</code></p>
              <p>• API keys are rate-limited to 100 requests/minute</p>
              <p>• Keep your keys secure - never expose them in client-side code</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                Available Endpoints
              </CardTitle>
              <CardDescription>
                Base URL: <code className="bg-muted px-1">{API_DOCS.baseUrl}</code>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {API_DOCS.endpoints.map((endpoint, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant={endpoint.method === "GET" ? "default" : "secondary"}>
                      {endpoint.method}
                    </Badge>
                    <code className="text-sm font-mono">{endpoint.path}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyExample(endpoint.method, endpoint.path)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{endpoint.description}</p>
                  {endpoint.params.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Params: </span>
                      {endpoint.params.map((p, j) => (
                        <span key={j} className="mr-2">
                          {p.required && "*"}
                          <code className="bg-muted px-1">{p.name}</code>
                          ({p.type})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="border-t pt-6">
                <h3 className="font-medium flex items-center gap-2 mb-4">
                  <Code className="h-4 w-4" />
                  Developer Endpoints
                  <Badge variant="outline">Requires Auth</Badge>
                </h3>
                {API_DOCS.devEndpoints.map((endpoint, i) => (
                  <div key={i} className="border rounded-lg p-4 mb-2 bg-muted/30">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant={endpoint.method === "GET" ? "default" : "secondary"}>
                        {endpoint.method}
                      </Badge>
                      <code className="text-sm font-mono">{endpoint.path}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyExample(endpoint.method, endpoint.path)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApiDocs;
