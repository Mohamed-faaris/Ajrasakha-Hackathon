import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useSession, signOut } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

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

export default function Profile() {
  const { data, isPending } = useSession();
  const { toast } = useToast();
  const navigate = useNavigate();

  const user = data?.user;

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch {
      toast({
        title: "Error",
        description: "Failed to sign out.",
        variant: "destructive",
      });
    }
  };

  if (isPending) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Loading your account details...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">My Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account information
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Overview</CardTitle>
          <CardDescription>
            Basic details linked to your session
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
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

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground mb-1">User ID</p>
              <p className="font-mono text-xs break-all">{user?.id ?? "-"}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground mb-1">Account Status</p>
              <p className="font-medium">{user ? "Active" : "Unavailable"}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
