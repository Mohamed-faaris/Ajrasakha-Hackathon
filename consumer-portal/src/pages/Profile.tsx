import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/lib/api";
import type {
  UserProfile,
  UserRole,
  FarmerDetails,
  TraderDetails,
  DeveloperDetails,
  AdminDetails,
  APMCDetails,
} from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { z } from "zod";

const ROLE_LABELS: Record<UserRole, string> = {
  farmer: "Farmer",
  trader: "Trader",
  developer: "Developer",
  admin: "Admin",
  apmc: "APMC",
};

const ROUTE_ROLE_TO_VALUE: Record<string, UserRole> = {
  farmer: "farmer",
  trader: "trader",
  developer: "developer",
  admin: "admin",
  apmc: "apmc",
};

const parseCsv = (value: string) =>
  value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

const ProfileRequiredFieldsSchema = z
  .object({
    role: z.enum(["farmer", "trader", "developer", "admin", "apmc"]),
    farmSize: z.string().optional(),
    primaryCrops: z.string().optional(),
    companyName: z.string().optional(),
    tradingStates: z.string().optional(),
    developerCompanyName: z.string().optional(),
    developerApiKey: z.string().optional(),
    adminEmployeeId: z.string().optional(),
    apmcMandiName: z.string().optional(),
    apmcLicenseNumber: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.role === "farmer") {
      if (!value.farmSize?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Farm Size is mandatory for Farmer.",
          path: ["farmSize"],
        });
      }
      if (!value.primaryCrops?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Primary Crops is mandatory for Farmer.",
          path: ["primaryCrops"],
        });
      }
    }

    if (value.role === "trader") {
      if (!value.companyName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Company Name is mandatory for Trader.",
          path: ["companyName"],
        });
      }
      if (!value.tradingStates?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Trading States is mandatory for Trader.",
          path: ["tradingStates"],
        });
      }
    }

    if (value.role === "developer") {
      if (!value.developerCompanyName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Company Name is mandatory for Developer.",
          path: ["developerCompanyName"],
        });
      }
      if (!value.developerApiKey?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Intended API Access is mandatory for Developer.",
          path: ["developerApiKey"],
        });
      }
    }

    if (value.role === "admin" && !value.adminEmployeeId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Employee ID is mandatory for Admin.",
        path: ["adminEmployeeId"],
      });
    }

    if (value.role === "apmc") {
      if (!value.apmcMandiName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Mandi Name is mandatory for APMC.",
          path: ["apmcMandiName"],
        });
      }
      if (!value.apmcLicenseNumber?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "License Number is mandatory for APMC.",
          path: ["apmcLicenseNumber"],
        });
      }
    }
  });

export default function Profile() {
  const { role: roleParam } = useParams();
  const requestedRole = roleParam ? ROUTE_ROLE_TO_VALUE[roleParam] : undefined;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showRoleChangeDialog, setShowRoleChangeDialog] = useState(false);
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);

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

  const [developerCompanyName, setDeveloperCompanyName] = useState("");
  const [developerApiKey, setDeveloperApiKey] = useState("");
  const [developerUseCase, setDeveloperUseCase] = useState("");

  const [adminEmployeeId, setAdminEmployeeId] = useState("");
  const [adminDepartment, setAdminDepartment] = useState("");

  const [apmcMandiName, setApmcMandiName] = useState("");
  const [apmcLicenseNumber, setApmcLicenseNumber] = useState("");
  const [apmcState, setApmcState] = useState("");

  const hydrateFormFromProfile = useCallback((data: UserProfile) => {
    setProfile(data);
    setRole(requestedRole ?? data.role ?? "farmer");
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

    const developerDetails = data.developerDetails as DeveloperDetails | null;
    setDeveloperCompanyName(developerDetails?.companyName || "");
    setDeveloperApiKey(developerDetails?.intendedApiKey || "");
    setDeveloperUseCase(developerDetails?.useCase || "");

    const adminDetails = data.adminDetails as AdminDetails | null;
    setAdminEmployeeId(adminDetails?.employeeId || "");
    setAdminDepartment(adminDetails?.department || "");

    const apmcDetails = data.apmcDetails as APMCDetails | null;
    setApmcMandiName(apmcDetails?.mandiName || "");
    setApmcLicenseNumber(apmcDetails?.licenseNumber || "");
    setApmcState(apmcDetails?.state || "");
  }, [requestedRole]);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const data = await api.getMyProfile();
        if (data) {
          hydrateFormFromProfile(data);
        } else {
          setProfile(null);
        }
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile();
  }, [requestedRole, hydrateFormFromProfile]);

  const handleRoleChange = (newRole: UserRole) => {
    if (newRole !== role && profile?.role) {
      setPendingRole(newRole);
      setShowRoleChangeDialog(true);
    } else {
      setRole(newRole);
    }
  };

  const confirmRoleChange = () => {
    if (pendingRole) {
      const nextRole = pendingRole;
      setRole(nextRole);
      setShowRoleChangeDialog(false);
      setPendingRole(null);
      toast({
        title: "Role Changed",
        description: `Your role has been changed to ${ROLE_LABELS[nextRole]}. Please fill in the required details below.`,
      });
    }
  };

  const classificationBadge = useMemo(() => {
    if (!profile?.classification) return null;
    const confidence = Math.round(profile.classification.confidence * 100);
    return `${profile.classification.method.replace("_", " ")} (${confidence}% confidence)`;
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const validationResult = ProfileRequiredFieldsSchema.safeParse({
        role,
        farmSize,
        primaryCrops,
        companyName,
        tradingStates,
        developerCompanyName,
        developerApiKey,
        adminEmployeeId,
        apmcMandiName,
        apmcLicenseNumber,
      });

      if (!validationResult.success) {
        const firstError = validationResult.error.issues[0]?.message ?? "Please fill all mandatory fields.";
        toast({
          title: "Validation Error",
          description: firstError,
          variant: "destructive",
        });
        return;
      }

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
        developerDetails:
          role === "developer"
            ? {
                companyName: developerCompanyName || undefined,
                intendedApiKey: developerApiKey || undefined,
                useCase: developerUseCase || undefined,
              }
            : undefined,
        adminDetails:
          role === "admin"
            ? {
                employeeId: adminEmployeeId || undefined,
                department: adminDepartment || undefined,
              }
            : undefined,
        apmcDetails:
          role === "apmc"
            ? {
                mandiName: apmcMandiName || undefined,
                licenseNumber: apmcLicenseNumber || undefined,
                state: apmcState || undefined,
              }
            : undefined,
      };

      const updated = await api.updateMyProfile(payload);
      hydrateFormFromProfile(updated);
      updateStoredUser({ role });
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
    return <div className="text-sm text-muted-foreground">Loading profile...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Profile</h1>
          <p className="text-sm text-muted-foreground">Set role-specific details for personalized insights.</p>
          <p className="text-xs text-muted-foreground mt-1">
            <span className="text-destructive">*</span> indicates mandatory fields
          </p>
        </div>
        {classificationBadge && <Badge variant="secondary">{classificationBadge}</Badge>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>User Role <span className="text-destructive">*</span></Label>
              <Select value={role} onValueChange={(v) => handleRoleChange(v as UserRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="farmer">Farmer</SelectItem>
                  <SelectItem value="trader">Trader</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input value={stateName} onChange={(e) => setStateName(e.target.value)} placeholder="Maharashtra" />
            </div>
            <div className="space-y-2">
              <Label>District</Label>
              <Input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Nashik" />
            </div>
            <div className="space-y-2">
              <Label>Preferred Crops (comma separated)</Label>
              <Input value={preferredCrops} onChange={(e) => setPreferredCrops(e.target.value)} placeholder="Wheat, Onion" />
            </div>
            <div className="space-y-2">
              <Label>Preferred Mandis (comma separated)</Label>
              <Input value={preferredMandis} onChange={(e) => setPreferredMandis(e.target.value)} placeholder="Lasalgaon, Azadpur" />
            </div>
          </div>
        </CardContent>
      </Card>

      {role === "farmer" && (
        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Farmer Profile</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Farm Size (acres) <span className="text-destructive">*</span></Label>
              <Input required type="number" value={farmSize} onChange={(e) => setFarmSize(e.target.value)} placeholder="4.5" />
            </div>
            <div className="space-y-2">
              <Label>Primary Crops <span className="text-destructive">*</span></Label>
              <Input required value={primaryCrops} onChange={(e) => setPrimaryCrops(e.target.value)} placeholder="Soybean, Cotton" />
            </div>
          </CardContent>
        </Card>
      )}

      {role === "trader" && (
        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Trader Profile</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Name <span className="text-destructive">*</span></Label>
              <Input required value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="AgriTrade Pvt Ltd" />
            </div>
            <div className="space-y-2">
              <Label>GST Number</Label>
              <Input value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="27ABCDE1234F1Z5" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Trading States <span className="text-destructive">*</span></Label>
              <Input required value={tradingStates} onChange={(e) => setTradingStates(e.target.value)} placeholder="MH, MP, GJ" />
            </div>
          </CardContent>
        </Card>
      )}

      {role === "developer" && (
        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Developer Profile</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Name <span className="text-destructive">*</span></Label>
              <Input required value={developerCompanyName} onChange={(e) => setDeveloperCompanyName(e.target.value)} placeholder="AgriTech Labs" />
            </div>
            <div className="space-y-2">
              <Label>Intended API Access <span className="text-destructive">*</span></Label>
              <Input required value={developerApiKey} onChange={(e) => setDeveloperApiKey(e.target.value)} placeholder="Market Prices, Alerts" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Use Case</Label>
              <Textarea value={developerUseCase} onChange={(e) => setDeveloperUseCase(e.target.value)} placeholder="Building procurement intelligence dashboards" />
            </div>
          </CardContent>
        </Card>
      )}

      {role === "admin" && (
        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Admin Profile</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Employee ID <span className="text-destructive">*</span></Label>
              <Input required value={adminEmployeeId} onChange={(e) => setAdminEmployeeId(e.target.value)} placeholder="ADM-1024" />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input value={adminDepartment} onChange={(e) => setAdminDepartment(e.target.value)} placeholder="Operations" />
            </div>
          </CardContent>
        </Card>
      )}

      {role === "apmc" && (
        <Card>
          <CardHeader><CardTitle className="font-display text-lg">APMC Profile</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mandi Name <span className="text-destructive">*</span></Label>
              <Input required value={apmcMandiName} onChange={(e) => setApmcMandiName(e.target.value)} placeholder="Lasalgaon APMC" />
            </div>
            <div className="space-y-2">
              <Label>License Number <span className="text-destructive">*</span></Label>
              <Input required value={apmcLicenseNumber} onChange={(e) => setApmcLicenseNumber(e.target.value)} placeholder="APMC-7781" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>APMC State</Label>
              <Input value={apmcState} onChange={(e) => setApmcState(e.target.value)} placeholder="Maharashtra" />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : `Save ${ROLE_LABELS[role]} Profile`}
        </Button>
      </div>

      <Dialog open={showRoleChangeDialog} onOpenChange={setShowRoleChangeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Change User Role?
            </DialogTitle>
            <DialogDescription>
              You are about to change your role from <strong>{ROLE_LABELS[profile?.role || "farmer"]}</strong> to <strong>{pendingRole ? ROLE_LABELS[pendingRole] : ""}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This will change your access permissions and the features available to you.
              You may need to update role-specific details after saving.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleChangeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmRoleChange}>
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function updateStoredUser(data: { role: UserRole }) {
  try {
    const stored = localStorage.getItem("user");
    if (stored) {
      const user = JSON.parse(stored);
      user.role = data.role;
      localStorage.setItem("user", JSON.stringify(user));
    }

    if (sessionStorage.getItem("session")) {
      const storedSession = sessionStorage.getItem("session");
      if (storedSession) {
        const session = JSON.parse(storedSession);
        if (session?.user) {
          session.user.role = data.role;
          sessionStorage.setItem("session", JSON.stringify(session));
        }
      }
    }
  } catch (error) {
    console.error("Failed to update stored user:", error);
  }
}
