import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authClient } from "@/lib/auth";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authClient.forgetPassword({
        email,
        redirectTo: window.location.origin + "/reset-password",
      });
      setSent(true);
      toast({
        title: "Email sent",
        description: "Check your inbox for a reset link.",
      });
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(err, "Failed to send reset email."),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="h-14 w-14 rounded-xl bg-primary flex items-center justify-center">
            <TrendingUp className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Mandi-Insights
          </h1>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Reset Password</CardTitle>
            <CardDescription>
              {sent
                ? "We've sent a reset link to your email"
                : "Enter your email to receive a reset link"}
            </CardDescription>
          </CardHeader>
          {!sent ? (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
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
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              </CardFooter>
            </form>
          ) : (
            <CardContent className="text-center pb-6">
              <p className="text-sm text-muted-foreground mb-4">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <Button variant="outline" onClick={() => setSent(false)}>
                Try Again
              </Button>
            </CardContent>
          )}
          <div className="px-6 pb-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ArrowLeft className="h-3 w-3" /> Back to Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
