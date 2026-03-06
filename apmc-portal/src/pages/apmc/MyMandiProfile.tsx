import { useState } from "react";
import { format } from "date-fns";
import { Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMandiProfile } from "@/hooks/useAPMCHooks";

export default function MyMandiProfile() {
  const { data: profile, update, isUpdating } = useMandiProfile();
  const [form, setForm] = useState(profile);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    update(form);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">My Mandi Profile</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: {format(new Date(profile.lastUpdated), "PPP 'at' p")}
        </p>
      </div>

      <Card className="max-w-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-heading">Profile Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Mandi Name</Label>
                <Input value={form.mandiName} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input value={form.state} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>District</Label>
                <Input value={form.district} onChange={(e) => handleChange("district", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input value={form.latitude} onChange={(e) => handleChange("latitude", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input value={form.longitude} onChange={(e) => handleChange("longitude", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Contact Person</Label>
                <Input value={form.contactPerson} onChange={(e) => handleChange("contactPerson", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} />
              </div>
            </div>

            <Button type="submit" disabled={isUpdating} className="gap-2">
              <Save className="h-4 w-4" />
              {isUpdating ? "Saving…" : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
