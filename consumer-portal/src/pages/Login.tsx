import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp, Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { signIn, authClient } from "@/lib/auth";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

export default function Login() {
  const [searchParams] = useSearchParams();
  const magicToken = searchParams.get("token");
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState(magicToken ? "magic" : "password");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [otpEmail, setOtpEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const [magicLinkEmail, setMagicLinkEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn.email({ email, password });
      toast({ title: "Welcome back!", description: "Logged in successfully." });
      navigate("/dashboard");
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(err, "Login failed."),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpEmail || !otpEmail.includes("@")) {
      toast({ title: "Error", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    setOtpLoading(true);
    try {
      await authClient.emailOtp.sendVerificationOtp({ email: otpEmail, type: "sign-in" });
      setOtpSent(true);
      toast({ title: "OTP Sent", description: "Check your email for the verification code." });
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(err, "Failed to send OTP."),
        variant: "destructive",
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      toast({ title: "Error", description: "Please enter the complete OTP.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await authClient.signIn.emailOtp({ email: otpEmail, otp });
      toast({ title: "Welcome back!", description: "Logged in successfully." });
      navigate("/dashboard");
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(err, "Invalid OTP."),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magicLinkEmail) {
      toast({ title: "Error", description: "Please enter your email address.", variant: "destructive" });
      return;
    }
    setMagicLinkLoading(true);
    try {
      await signIn.magicLink({
        email: magicLinkEmail,
        callbackURL: "/dashboard",
      });
      setMagicLinkSent(true);
      toast({ title: "Magic Link Sent", description: "Check your email for the sign-in link." });
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(err, "Failed to send magic link."),
        variant: "destructive",
      });
    } finally {
      setMagicLinkLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpLoading(true);
    try {
      await authClient.emailOtp.sendVerificationOtp({ email: otpEmail, type: "sign-in" });
      toast({ title: "OTP Resent", description: "Check your email for the new verification code." });
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(err, "Failed to resend OTP."),
        variant: "destructive",
      });
    } finally {
      setOtpLoading(false);
    }
  };

  if (magicToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Authenticating...</CardTitle>
              <CardDescription>Please wait while we verify your magic link.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="h-14 w-14 rounded-xl bg-primary flex items-center justify-center">
            <TrendingUp className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            mandi-insights
          </h1>
          <p className="text-sm text-muted-foreground">
            Agricultural Market Intelligence
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="password" className="flex items-center gap-1">
              <Lock className="h-3 w-3" /> Password
            </TabsTrigger>
            <TabsTrigger value="otp" className="flex items-center gap-1">
              <Mail className="h-3 w-3" /> Email OTP
            </TabsTrigger>
            <TabsTrigger value="magic" className="flex items-center gap-1">
              <Mail className="h-3 w-3" /> Magic Link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="password">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Sign In</CardTitle>
                <CardDescription>
                  Enter your credentials to access the platform
                </CardDescription>
              </CardHeader>
              <form onSubmit={handlePasswordLogin}>
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
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link
                        to="/forgot-password"
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
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
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="otp">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Sign In with Email OTP</CardTitle>
                <CardDescription>
                  {otpSent ? "Enter the code sent to your email" : "Enter your email to get verification code"}
                </CardDescription>
              </CardHeader>
              {!otpSent ? (
                <form onSubmit={handleSendOtp}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otpEmail">Email</Label>
                      <Input
                        id="otpEmail"
                        type="email"
                        placeholder="farmer@example.com"
                        value={otpEmail}
                        onChange={(e) => setOtpEmail(e.target.value)}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-3">
                    <Button type="submit" className="w-full" disabled={otpLoading}>
                      {otpLoading ? "Sending..." : "Send OTP"}
                    </Button>
                  </CardFooter>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Verification Code</Label>
                      <div className="flex justify-center">
                        <InputOTP
                          maxLength={6}
                          value={otp}
                          onChange={(value) => setOtp(value)}
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        Enter the 6-digit code sent to {otpEmail}
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-3">
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Verifying..." : "Verify & Sign In"}
                    </Button>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => setOtpSent(false)}
                        disabled={otpLoading}
                      >
                        Change Email
                      </Button>
                      <span className="text-muted-foreground">|</span>
                      <Button
                        type="button"
                        variant="link"
                        onClick={handleResendOtp}
                        disabled={otpLoading}
                      >
                        Resend OTP
                      </Button>
                    </div>
                  </CardFooter>
                </form>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="magic">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Sign In with Magic Link</CardTitle>
                <CardDescription>
                  {magicLinkSent
                    ? "Check your email for the sign-in link"
                    : "Enter your email to receive a magic sign-in link"}
                </CardDescription>
              </CardHeader>
              {!magicLinkSent ? (
                <form onSubmit={handleSendMagicLink}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="magicEmail">Email</Label>
                      <Input
                        id="magicEmail"
                        type="email"
                        placeholder="farmer@example.com"
                        value={magicLinkEmail}
                        onChange={(e) => setMagicLinkEmail(e.target.value)}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-3">
                    <Button type="submit" className="w-full" disabled={magicLinkLoading}>
                      {magicLinkLoading ? "Sending..." : "Send Magic Link"}
                    </Button>
                  </CardFooter>
                </form>
              ) : (
                <CardContent className="space-y-4 text-center py-6">
                  <p className="text-sm text-muted-foreground mb-4">
                    We've sent a magic link to <strong>{magicLinkEmail}</strong>.
                    Click the link in your email to sign in.
                  </p>
                  <Button variant="outline" onClick={() => setMagicLinkSent(false)}>
                    Send Again
                  </Button>
                </CardContent>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        <p className="text-sm text-muted-foreground text-center">Don't have an account? <Link to="/signup" className="text-primary font-medium hover:underline">Sign Up</Link></p>

      </div>
    </div>
  );
}
