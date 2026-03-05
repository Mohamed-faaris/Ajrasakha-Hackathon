import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TrendingUp, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { signUp } from "@/lib/auth";
import { api } from "@/lib/api";
import type { UserRole, State } from "@/lib/types";
import { CAPABILITY_LABELS, ROLE_ACCESS } from "@/lib/role-access";

const ROLE_LABELS: Record<UserRole, string> = {
  farmer: "Farmer",
  trader: "Trader",
  developer: "Developer",
  admin: "Admin",
  apmc: "APMC",
};

const parseCsv = (value: string) =>
  value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

export default function Signup() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<UserRole>("farmer");

  const [phone, setPhone] = useState("");
  const [stateName, setStateName] = useState("");
  const [district, setDistrict] = useState("");
  const [preferredCrops, setPreferredCrops] = useState("");

  const [farmSize, setFarmSize] = useState("");
  const [primaryCrops, setPrimaryCrops] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [hasGst, setHasGst] = useState<"yes" | "no">("no");
  const [gstNumber, setGstNumber] = useState("");
  const [tradingStates, setTradingStates] = useState("");

  const [organization, setOrganization] = useState("");
  const [designation, setDesignation] = useState("");
  const [policyFocusAreas, setPolicyFocusAreas] = useState("");

  const [startupName, setStartupName] = useState("");
  const [startupStage, setStartupStage] = useState<"idea" | "mvp" | "early" | "growth" | "scale">("idea");
  const [startupFocusAreas, setStartupFocusAreas] = useState("");

  const [developerCompanyName, setDeveloperCompanyName] = useState("");
  const [developerApiKey, setDeveloperApiKey] = useState("");
  const [developerUseCase, setDeveloperUseCase] = useState("");

  const [adminEmployeeId, setAdminEmployeeId] = useState("");
  const [adminDepartment, setAdminDepartment] = useState("");

  const [apmcMandiName, setApmcMandiName] = useState("");
  const [apmcLicenseNumber, setApmcLicenseNumber] = useState("");
  const [apmcState, setApmcState] = useState("");

  const [states, setStates] = useState<State[]>([]);

  useEffect(() => {
    api.getStates().then(setStates).catch(() => setStates([]));
  }, []);

  const roleAccess = useMemo(() => ROLE_ACCESS[role], [role]);

  const selectedState = useMemo(
    () => states.find((s) => s.name === stateName),
    [states, stateName]
  );

  const districts = selectedState?.districts || [];

  const handleStateChange = (value: string) => {
    setStateName(value);
    setDistrict("");
  };

  const validateRoleFields = () => {
    if (role === "farmer" && (!farmSize || !primaryCrops.trim())) {
      return "Farm size and primary crops are required for farmers.";
    }
    if (role === "trader" && (!companyName.trim() || !tradingStates.trim())) {
      return "Company name and trading states are required for traders.";
    }
    if (role === "trader" && hasGst === "yes" && !gstNumber.trim()) {
      return "GST number is required when GST is marked as available.";
    }
    if (role === "developer" && (!developerCompanyName.trim() || !developerApiKey.trim())) {
      return "Company name and intended API use are required for developers.";
    }
    if (role === "admin" && (!adminEmployeeId.trim())) {
      return "Employee ID is required for admin accounts.";
    }
    if (role === "apmc" && (!apmcMandiName.trim() || !apmcLicenseNumber.trim())) {
      return "Mandi name and license number are required for APMC.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }

    const validationMessage = validateRoleFields();
    if (validationMessage) {
      toast({ title: "Error", description: validationMessage, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await signUp.email({ name, email, password });
      try {
        await api.updateMyProfile({
          role,
          phone: phone || undefined,
          state: stateName || undefined,
          district: district || undefined,
          preferredCrops: parseCsv(preferredCrops),
          farmerDetails: role === "farmer" ? {
            isFarmer: true,
            farmSize: Number(farmSize),
            primaryCrops: parseCsv(primaryCrops),
          } : undefined,
          traderDetails: role === "trader" ? {
            isTrader: true,
            companyName: companyName || undefined,
            gstNumber: hasGst === "yes" ? gstNumber || undefined : undefined,
            tradingStates: parseCsv(tradingStates),
          } : undefined,
          developerDetails: role === "developer" ? {
            companyName: developerCompanyName || undefined,
            intendedApiKey: developerApiKey || undefined,
            useCase: developerUseCase || undefined,
          } : undefined,
          adminDetails: role === "admin" ? {
            employeeId: adminEmployeeId || undefined,
            department: adminDepartment || undefined,
          } : undefined,
          apmcDetails: role === "apmc" ? {
            mandiName: apmcMandiName || undefined,
            licenseNumber: apmcLicenseNumber || undefined,
            state: apmcState || undefined,
          } : undefined,
        });
      } catch {
        // Non-blocking: user can still continue and complete profile later.
      }
      toast({ title: "Account created", description: "Welcome to mandi-insights." });
      navigate("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="h-14 w-14 rounded-xl bg-primary flex items-center justify-center">
            <TrendingUp className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">mandi-insights</h1>
          <p className="text-sm text-muted-foreground">Create your account</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Sign Up</CardTitle>
            <CardDescription>Choose your role and complete role-specific details</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Ramesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="farmer@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>User Role</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="farmer">Farmer</SelectItem>
                      <SelectItem value="trader">Trader</SelectItem>
                      <SelectItem value="developer">Developer</SelectItem>
                      <SelectItem value="apmc">APMC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>State (optional)</Label>
                  <Select value={stateName} onValueChange={handleStateChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((s) => (
                        <SelectItem key={s.code} value={s.name}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>District (optional)</Label>
                  <Select value={district} onValueChange={setDistrict} disabled={!stateName || districts.length === 0}>
                    <SelectTrigger>
                      <SelectValue placeholder={districts.length === 0 ? "No districts available" : "Select district"} />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((d) => (
                        <SelectItem key={d._id} value={d.name}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredCrops">Preferred Crops (comma separated)</Label>
                <Input
                  id="preferredCrops"
                  type="text"
                  placeholder="Onion, Wheat, Soybean"
                  value={preferredCrops}
                  onChange={(e) => setPreferredCrops(e.target.value)}
                />
              </div>

              <div className="rounded-md border p-4 space-y-3 bg-muted/20">
                <p className="text-sm font-semibold">{ROLE_LABELS[role]} Access</p>
                <p className="text-xs text-muted-foreground">
                  Privileges: {roleAccess.capabilities.map((c) => CAPABILITY_LABELS[c]).join(" | ")}
                </p>
                <p className="text-xs text-muted-foreground">
                  Restrictions: {roleAccess.restrictions.join(" | ")}
                </p>
              </div>

              {role === "farmer" && (
                <div className="rounded-md border p-4 space-y-4">
                  <p className="text-sm font-semibold">Farmer Details</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="farmSize">Farm Size (acres)</Label>
                      <Input
                        id="farmSize"
                        type="number"
                        min={0}
                        step="0.1"
                        value={farmSize}
                        onChange={(e) => setFarmSize(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="primaryCrops">Primary Crops (comma separated)</Label>
                      <Input
                        id="primaryCrops"
                        type="text"
                        placeholder="Onion, Tomato"
                        value={primaryCrops}
                        onChange={(e) => setPrimaryCrops(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {role === "trader" && (
                <div className="rounded-md border p-4 space-y-4">
                  <p className="text-sm font-semibold">Trader Details</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        type="text"
                        placeholder="AgriTrade Pvt Ltd"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>GST Available?</Label>
                      <Select value={hasGst} onValueChange={(v) => setHasGst(v as "yes" | "no")}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no">No</SelectItem>
                          <SelectItem value="yes">Yes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {hasGst === "yes" && (
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="gstNumber">GST Number</Label>
                        <Input
                          id="gstNumber"
                          type="text"
                          placeholder="27ABCDE1234F1Z5"
                          value={gstNumber}
                          onChange={(e) => setGstNumber(e.target.value)}
                          required
                        />
                      </div>
                    )}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="tradingStates">Trading States (comma separated)</Label>
                      <Input
                        id="tradingStates"
                        type="text"
                        placeholder="Maharashtra, Gujarat"
                        value={tradingStates}
                        onChange={(e) => setTradingStates(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {role === "developer" && (
                <div className="rounded-md border p-4 space-y-4">
                  <p className="text-sm font-semibold">Developer Details</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="developerCompanyName">Company / Organization Name</Label>
                      <Input
                        id="developerCompanyName"
                        type="text"
                        placeholder="Tech Solutions Pvt Ltd"
                        value={developerCompanyName}
                        onChange={(e) => setDeveloperCompanyName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="developerUseCase">Intended API Use</Label>
                      <Input
                        id="developerUseCase"
                        type="text"
                        placeholder="Mobile app, Dashboard, Analytics"
                        value={developerApiKey}
                        onChange={(e) => setDeveloperApiKey(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="developerUseCaseDesc">Use Case Description</Label>
                      <Textarea
                        id="developerUseCaseDesc"
                        placeholder="Describe how you plan to use the API..."
                        value={developerUseCase}
                        onChange={(e) => setDeveloperUseCase(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {role === "admin" && (
                <div className="rounded-md border p-4 space-y-4">
                  <p className="text-sm font-semibold">Admin Details</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="adminEmployeeId">Employee ID</Label>
                      <Input
                        id="adminEmployeeId"
                        type="text"
                        placeholder="ADM001"
                        value={adminEmployeeId}
                        onChange={(e) => setAdminEmployeeId(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adminDepartment">Department</Label>
                      <Input
                        id="adminDepartment"
                        type="text"
                        placeholder="IT, Operations, Management"
                        value={adminDepartment}
                        onChange={(e) => setAdminDepartment(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {role === "apmc" && (
                <div className="rounded-md border p-4 space-y-4">
                  <p className="text-sm font-semibold">APMC Details</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="apmcMandiName">Mandi Name</Label>
                      <Input
                        id="apmcMandiName"
                        type="text"
                        placeholder="Lasalgaon APMC"
                        value={apmcMandiName}
                        onChange={(e) => setApmcMandiName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apmcLicenseNumber">License Number</Label>
                      <Input
                        id="apmcLicenseNumber"
                        type="text"
                        placeholder="APMC/LIC/2024/001"
                        value={apmcLicenseNumber}
                        onChange={(e) => setApmcLicenseNumber(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>State</Label>
                      <Select value={apmcState} onValueChange={setApmcState}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {states.map((s) => (
                            <SelectItem key={s.code} value={s.name}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Create Account"}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{" "}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  Sign In
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
