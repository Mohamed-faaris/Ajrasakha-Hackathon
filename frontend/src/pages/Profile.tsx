import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/lib/api";
import type {
  UserProfile,
  UserRole,
  FarmerDetails,
  TraderDetails,
  PolicyMakerDetails,
  AgriStartupDetails,
} from "@/lib/types";
import { useSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ROLE_LABELS: Record<UserRole, string> = {
  farmer: "Farmer",
  trader: "Trader",
  policy_maker: "Policy Maker",
  agri_startup: "Agri Startup",
};

const ROUTE_ROLE_TO_VALUE: Record<string, UserRole> = {
  farmer: "farmer",
  trader: "trader",
  "policy-maker": "policy_maker",
  "agri-startup": "agri_startup",
};

const getInitials = (name?: string | null) => {
  if (!name) return "U";
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const parseCsv = (value: string) =>
  value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

export default function Profile() {
  const { role: roleParam } = useParams();
  const requestedRole = roleParam ? ROUTE_ROLE_TO_VALUE[roleParam] : undefined;
  const { toast } = useToast();
  const { data: sessionData } = useSession();

  const user = sessionData?.user;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [role, setRole] = useState<UserRole>("farmer");
  const [phone, setPhone] = useState("");
  const [stateName, setStateName] = useState("");
  const [district, setDistrict] = useState("");
  const [preferredCrops, setPreferredCrops] = useState("");
  const [preferredMandis, setPreferredMandis] = useState("");

  const [farmSize, setFarmSize] = useState("");
  const [primaryCrops, setPrimaryCrops] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [tradingStates, setTradingStates] = useState("");

  const [organization, setOrganization] = useState("");
  const [designation, setDesignation] = useState("");
  const [policyFocusAreas, setPolicyFocusAreas] = useState("");

  const [startupName, setStartupName] = useState("");
  const [startupStage, setStartupStage] = useState<"idea" | "mvp" | "early" | "growth" | "scale">("idea");
  const [startupFocusAreas, setStartupFocusAreas] = useState("");

  useEffect(() => {
    api
      .getMyProfile()
      .then((data) => {
        if (!data) return;
        setProfile(data);
        setRole(data.role || "farmer");
        setPhone(data.phone || "");
        setStateName(data.state || "");
        setDistrict(data.district || "");
        setPreferredCrops((data.preferredCrops || []).join(", "));
        setPreferredMandis((data.preferredMandis || []).join(", "));

        const farmerDetails = data.farmerDetails as FarmerDetails | null;
        setFarmSize(farmerDetails?.farmSize ? String(farmerDetails.farmSize) : "");
        setPrimaryCrops((farmerDetails?.primaryCrops || []).join(", "));

        const traderDetails = data.traderDetails as TraderDetails | null;
        setCompanyName(traderDetails?.companyName || "");
        setGstNumber(traderDetails?.gstNumber || "");
        setTradingStates((traderDetails?.tradingStates || []).join(", "));

        const policyMakerDetails = data.policyMakerDetails as PolicyMakerDetails | null;
        setOrganization(policyMakerDetails?.organization || "");
        setDesignation(policyMakerDetails?.designation || "");
        setPolicyFocusAreas((policyMakerDetails?.policyFocusAreas || []).join(", "));

        const agriStartupDetails = data.agriStartupDetails as AgriStartupDetails | null;
        setStartupName(agriStartupDetails?.startupName || "");
        setStartupStage(agriStartupDetails?.stage || "idea");
        setStartupFocusAreas((agriStartupDetails?.focusAreas || []).join(", "));
      })
      .catch(() => {
        setProfile(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (requestedRole) {
      setRole(requestedRole);
    }
  }, [requestedRole]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        role,
        phone: phone || undefined,
        state: stateName || undefined,
        district: district || undefined,
        preferredCrops: parseCsv(preferredCrops),
        preferredMandis: parseCsv(preferredMandis),
        farmerDetails:
          role === "farmer"
            ? {
                isFarmer: true,
                farmSize: farmSize ? Number(farmSize) : undefined,
                primaryCrops: parseCsv(primaryCrops),
              }
            : undefined,
        traderDetails:
          role === "trader"
            ? {
                isTrader: true,
                companyName: companyName || undefined,
                gstNumber: gstNumber || undefined,
                tradingStates: parseCsv(tradingStates),
              }
            : undefined,
        policyMakerDetails:
          role === "policy_maker"
            ? {
                organization: organization || undefined,
                designation: designation || undefined,
                policyFocusAreas: parseCsv(policyFocusAreas),
              }
            : undefined,
        agriStartupDetails:
          role === "agri_startup"
            ? {
                startupName: startupName || undefined,
                stage: startupStage || undefined,
                focusAreas: parseCsv(startupFocusAreas),
              }
            : undefined,
      };

      const updated = await api.updateMyProfile(payload);
      setProfile(updated);
      toast({ title: "Profile updated", description: "Your profile was saved successfully." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update profile.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Loading profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Set role-specific details for personalized insights.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src="" alt={user?.name ?? "User"} />
              <AvatarFallback className="text-lg">
                {getInitials(user?.name)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-lg font-semibold leading-tight">
                {user?.name ?? "User"}
              </p>
              <p className="text-sm text-muted-foreground">
                {user?.email ?? "No email"}
              </p>
              <Badge variant={user?.emailVerified ? "default" : "secondary"}>
                {user?.emailVerified ? "Email Verified" : "Email Not Verified"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>User Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="farmer">Farmer</SelectItem>
                  <SelectItem value="trader">Trader</SelectItem>
                  <SelectItem value="policy_maker">Policy Maker</SelectItem>
                  <SelectItem value="agri_startup">Agri Startup</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
              />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                placeholder="Maharashtra"
              />
            </div>
            <div className="space-y-2">
              <Label>District</Label>
              <Input
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Nashik"
              />
            </div>
            <div className="space-y-2">
              <Label>Preferred Crops (comma separated)</Label>
              <Input
                value={preferredCrops}
                onChange={(e) => setPreferredCrops(e.target.value)}
                placeholder="Wheat, Onion"
              />
            </div>
            <div className="space-y-2">
              <Label>Preferred Mandis (comma separated)</Label>
              <Input
                value={preferredMandis}
                onChange={(e) => setPreferredMandis(e.target.value)}
                placeholder="Lasalgaon, Azadpur"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {role === "farmer" && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Farmer Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Farm Size (acres)</Label>
              <Input
                type="number"
                value={farmSize}
                onChange={(e) => setFarmSize(e.target.value)}
                placeholder="4.5"
              />
            </div>
            <div className="space-y-2">
              <Label>Primary Crops</Label>
              <Input
                value={primaryCrops}
                onChange={(e) => setPrimaryCrops(e.target.value)}
                placeholder="Soybean, Cotton"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {role === "trader" && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Trader Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="AgriTrade Pvt Ltd"
              />
            </div>
            <div className="space-y-2">
              <Label>GST Number</Label>
              <Input
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                placeholder="27ABCDE1234F1Z5"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Trading States</Label>
              <Input
                value={tradingStates}
                onChange={(e) => setTradingStates(e.target.value)}
                placeholder="MH, MP, GJ"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {role === "policy_maker" && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Policy Maker Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Organization</Label>
              <Input
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="State Agriculture Dept"
              />
            </div>
            <div className="space-y-2">
              <Label>Designation</Label>
              <Input
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="Deputy Director"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Policy Focus Areas</Label>
              <Textarea
                value={policyFocusAreas}
                onChange={(e) => setPolicyFocusAreas(e.target.value)}
                placeholder="Price stabilization, mandi modernization"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {role === "agri_startup" && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Agri Startup Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Startup Name</Label>
              <Input
                value={startupName}
                onChange={(e) => setStartupName(e.target.value)}
                placeholder="FarmPulse"
              />
            </div>
            <div className="space-y-2">
              <Label>Stage</Label>
              <Select
                value={startupStage || "idea"}
                onValueChange={(v) =>
                  setStartupStage(v as "idea" | "mvp" | "early" | "growth" | "scale")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="idea">Idea</SelectItem>
                  <SelectItem value="mvp">MVP</SelectItem>
                  <SelectItem value="early">Early</SelectItem>
                  <SelectItem value="growth">Growth</SelectItem>
                  <SelectItem value="scale">Scale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Focus Areas</Label>
              <Textarea
                value={startupFocusAreas}
                onChange={(e) => setStartupFocusAreas(e.target.value)}
                placeholder="Supply chain, price analytics, traceability"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : `Save ${ROLE_LABELS[role]} Profile`}
        </Button>
      </div>
    </div>
  );
}
