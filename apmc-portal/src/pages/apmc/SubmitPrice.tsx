import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useSubmitPrice } from "@/hooks/useAPMCHooks";

const crops = ["Wheat", "Rice", "Soybean", "Cotton", "Maize", "Chickpea", "Mustard", "Sugarcane"];
const units = ["Quintal", "Tonne", "Kg"];

export default function SubmitPrice() {
  const { mutate, isPending } = useSubmitPrice();
  const [date, setDate] = useState<Date>();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const crop = formData.get("crop") as string;
    const minPrice = formData.get("minPrice") as string;
    const maxPrice = formData.get("maxPrice") as string;
    const modalPrice = formData.get("modalPrice") as string;

    if (!crop || !date || !minPrice || !maxPrice || !modalPrice) {
      setError("Please fill in all required fields.");
      return;
    }

    if (Number(minPrice) > Number(maxPrice)) {
      setError("Min price cannot be greater than max price.");
      return;
    }

    mutate({
      crop,
      date: date.toISOString(),
      minPrice: Number(minPrice),
      maxPrice: Number(maxPrice),
      modalPrice: Number(modalPrice),
      arrival: formData.get("arrival"),
      unit: formData.get("unit"),
    });
    setSuccess(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Submit Price</h1>
        <p className="text-sm text-muted-foreground">Enter daily commodity price data</p>
      </div>

      <Card className="max-w-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-heading">Price Entry Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="crop">Crop *</Label>
                <Select name="crop">
                  <SelectTrigger>
                    <SelectValue placeholder="Select crop" />
                  </SelectTrigger>
                  <SelectContent>
                    {crops.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minPrice">Min Price (₹) *</Label>
                <Input name="minPrice" type="number" placeholder="e.g. 2100" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxPrice">Max Price (₹) *</Label>
                <Input name="maxPrice" type="number" placeholder="e.g. 2450" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modalPrice">Modal Price (₹) *</Label>
                <Input name="modalPrice" type="number" placeholder="e.g. 2280" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="arrival">Arrival Quantity</Label>
                <Input name="arrival" type="number" placeholder="e.g. 500" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select name="unit" defaultValue="Quintal">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {success && (
              <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
                <CheckCircle2 className="h-4 w-4" />
                Price submitted successfully!
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {isPending ? "Submitting…" : "Submit Price"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
