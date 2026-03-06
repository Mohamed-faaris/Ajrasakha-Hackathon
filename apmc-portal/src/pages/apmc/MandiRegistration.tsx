import { useState } from "react";
import { Wheat, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const states = [
  "Andhra Pradesh", "Bihar", "Chhattisgarh", "Delhi", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Odisha", "Punjab", "Rajasthan", "Tamil Nadu",
  "Telangana", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

const dataSourceOptions = [
  { value: "manual", label: "Manual Entry" },
  { value: "excel", label: "Excel Upload" },
  { value: "api", label: "API Integration" },
];

export default function MandiRegistration() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const fd = new FormData(e.currentTarget);
    const mandiName = (fd.get("mandiName") as string)?.trim();
    const state = fd.get("state") as string;
    const district = (fd.get("district") as string)?.trim();
    const contactPerson = (fd.get("contactPerson") as string)?.trim();
    const email = (fd.get("email") as string)?.trim();
    const phone = (fd.get("phone") as string)?.trim();

    if (!mandiName || !state || !district || !contactPerson || !email || !phone) {
      setError("Please fill in all required fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    const phoneRegex = /^[+]?[\d\s-]{10,15}$/;
    if (!phoneRegex.test(phone)) {
      setError("Please enter a valid phone number.");
      return;
    }

    // Placeholder — would call API
    console.log("Register mandi:", Object.fromEntries(fd));
    setSuccess(true);
  };

  return (
    <div className="flex min-h-screen items-start justify-center bg-background px-4 py-10 lg:py-16">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Wheat className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading">Mandi Registration</h1>
            <p className="text-sm text-muted-foreground">Register your APMC market on the integration portal</p>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-heading">Registration Form</CardTitle>
            <CardDescription>Fields marked with * are required</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Mandi Details */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Mandi Details</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="mandiName">Mandi Name *</Label>
                    <Input name="mandiName" placeholder="e.g. Azadpur Mandi" maxLength={100} />
                  </div>
                  <div className="space-y-2">
                    <Label>State *</Label>
                    <Select name="state">
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="district">District *</Label>
                    <Input name="district" placeholder="e.g. North Delhi" maxLength={100} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mandiCode">Mandi Code</Label>
                    <Input name="mandiCode" placeholder="e.g. DL-AZD-001" maxLength={20} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input name="latitude" type="number" step="any" placeholder="e.g. 28.7041" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input name="longitude" type="number" step="any" placeholder="e.g. 77.1025" />
                  </div>
                </div>
              </fieldset>

              {/* Contact Info */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Contact Information</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Contact Person *</Label>
                    <Input name="contactPerson" placeholder="Full name" maxLength={100} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="designation">Designation</Label>
                    <Input name="designation" placeholder="e.g. Secretary" maxLength={50} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input name="email" type="email" placeholder="apmc@example.gov.in" maxLength={255} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input name="phone" type="tel" placeholder="+91 98765 43210" maxLength={15} />
                  </div>
                </div>
              </fieldset>

              {/* Integration Preference */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Integration Preference</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Preferred Data Source</Label>
                    <Select name="dataSource" defaultValue="manual">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {dataSourceOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea name="remarks" placeholder="Any additional information…" maxLength={500} rows={3} />
                </div>
              </fieldset>

              {/* Messages */}
              {success && (
                <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Registration submitted successfully! Your application will be reviewed shortly.
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3">
                <Button type="submit">Submit Registration</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
