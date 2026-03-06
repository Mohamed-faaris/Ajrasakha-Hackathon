# Consumer Portal Workflow Documentation

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Page Workflows](#2-page-workflows)
3. [Data Fetching Patterns](#3-data-fetching-patterns)
4. [Authentication Flow](#4-authentication-flow)
5. [Push Notifications](#5-push-notifications)
6. [State Management](#6-state-management)
7. [Component Patterns](#7-component-patterns)
8. [Development Workflow](#8-development-workflow)

---

## 1. Architecture Overview

### 1.1 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | React 18 | UI library with hooks and concurrent features |
| Build Tool | Vite | Fast development and optimized production builds |
| Language | TypeScript | Type-safe development |
| Styling | Tailwind CSS | Utility-first CSS framework |
| Components | shadcn/ui | Headless UI components built on Radix UI |
| Data Fetching | TanStack Query | Server state management with caching |
| Forms | React Hook Form | Performant form handling with validation |
| Validation | Zod | Runtime type validation |
| Charts | Recharts | Composable charting library |
| Auth | Better Auth | Authentication with multiple providers |
| Icons | Lucide React | Consistent iconography |

### 1.2 Project Structure

```
src/
├── components/           # React components
│   ├── ui/              # shadcn/ui components (auto-generated)
│   ├── AppLayout.tsx    # Main app layout with sidebar
│   ├── AppSidebar.tsx   # Navigation sidebar
│   ├── ProtectedRoute.tsx # Auth route guards
│   └── ...
├── pages/               # Route-level page components
│   ├── Dashboard.tsx
│   ├── Analytics.tsx
│   ├── PriceAlerts.tsx
│   ├── MapInsights.tsx
│   ├── Profile.tsx
│   └── ...
├── hooks/               # Custom React hooks
│   ├── use-api.ts       # TanStack Query utilities
│   ├── use-alerts.ts    # Alert management hooks
│   ├── use-profile.ts   # Profile data hooks
│   ├── use-fcm.ts       # Firebase Cloud Messaging
│   └── ...
├── lib/                 # Utility libraries
│   ├── api-client.ts    # API client with Zod validation
│   ├── api-errors.ts    # Error handling utilities
│   ├── auth.ts          # Auth exports
│   ├── auth-client.ts   # Better Auth client setup
│   ├── types.ts         # TypeScript type definitions
│   └── utils.ts         # General utilities
└── test/                # Test files
    ├── setup.ts         # Vitest setup
    └── *.test.ts        # Test files
```

### 1.3 Routing Setup

Routes are defined in `App.tsx` using React Router v6:

```tsx
// Public routes (accessible without auth)
<Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
<Route path="/signup" element={<PublicOnlyRoute><Signup /></PublicOnlyRoute>} />

// Protected routes (require authentication)
<Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/analytics" element={<Analytics />} />
  <Route path="/price-alerts" element={<PriceAlerts />} />
  <Route path="/map" element={<MapInsights />} />
  <Route path="/profile" element={<Profile />} />
  <Route path="/profile/:role" element={<Profile />} />
</Route>
```

Route guards:
- `ProtectedRoute`: Redirects to `/login` if not authenticated
- `PublicOnlyRoute`: Redirects to `/dashboard` if already authenticated
- `RoleRoute`: (optional) Role-based access control

---

## 2. Page Workflows

### 2.1 Dashboard

**Purpose**: Display real-time market prices with filtering and export capabilities.

**Key Features**:
- Price table with sorting (crop, min/max/modal price)
- Filters by state, crop, and data source
- CSV export functionality
- Role-based feature hints (trader tools, policy analytics)

**Data Flow**:
```
User selects filters
    ↓
usePrices(filters) → API call with filters
    ↓
Client-side search filtering
    ↓
Display in sortable table
```

**Code Example**:
```tsx
const Dashboard = () => {
  const [filters, setFilters] = useState<PriceFilters>({});
  const { data: prices = [], isLoading } = usePrices(filters);
  
  // Local filtering for search
  const filtered = useMemo(() => {
    return prices.filter(p => 
      p.crop.toLowerCase().includes(searchQ.toLowerCase())
    );
  }, [prices, searchQ]);
};
```

### 2.2 Analytics

**Purpose**: Price predictions and trend analysis with drill-down capabilities.

**Key Features**:
- Hierarchical drill-down: States → APMCs → Crops → Predictions
- Price prediction charts with confidence intervals
- Cache-first data loading with on-demand generation
- Refresh capability for stale predictions

**Data Flow**:
```
Select State
    ↓
Fetch APMCs for state
    ↓
Select APMC
    ↓
Fetch crops for APMC
    ↓
Select Crop
    ↓
Fetch/display prediction
```

**State Management**:
```tsx
const [selectedState, setSelectedState] = useState("");
const [selectedMandi, setSelectedMandi] = useState("");
const [selectedCrop, setSelectedCrop] = useState("");

// Cascading queries with dependent fetching
const statesQuery = useAnalyticsPredictions({});
const apmcsQuery = useAnalyticsPredictions(
  { stateId: selectedState }, 
  Boolean(selectedState)
);
const predictionQuery = useAnalyticsPredictions(
  { stateId: selectedState, mandiId: selectedMandi, cropId: selectedCrop },
  Boolean(selectedState && selectedMandi && selectedCrop)
);
```

### 2.3 Price Alerts

**Purpose**: Create and manage price threshold and trend alerts.

**Key Features**:
- Three alert types: Price, Trend, or Both
- Price alerts: Trigger when price crosses threshold
- Trend alerts: Trigger on percentage change over days
- Cooldown period configuration
- FCM push notification integration
- Email notification support
- Test notification sending

**Alert Types**:
```tsx
type AlertType = "price" | "trend" | "both";

// Price Alert
{
  crop: string;
  threshold: number;      // Price threshold
  type: "above" | "below"; // Direction
  mandiId?: string;       // Optional specific mandi
}

// Trend Alert
{
  percentage: number;     // % change to trigger
  days: number;          // Period to compare
  trendDirection: "increase" | "decrease";
}
```

**Creating an Alert**:
```tsx
const createAlert = useCreateAlert();

await createAlert.mutateAsync({
  crop: "wheat",
  threshold: 2500,
  type: "above",
  alertType: "price",
  cooldownHours: 24,
});
```

### 2.4 Map Insights

**Purpose**: Geographic visualization of APMC coverage and price distribution.

**Key Features**:
- Interactive India map with state coverage heatmap
- Coverage statistics (eNAM, State Portal, Total APMCs)
- Interstate price comparison charts
- Role-based coverage gap watchlist

**Components**:
- `IndiaCoverageHeatmap`: SVG-based interactive map
- Progress indicators for integration coverage
- Bar charts for price comparisons

### 2.5 Profile

**Purpose**: User settings and role-specific profile management.

**Key Features**:
- Role selection (Farmer, Trader, Developer, Admin, APMC)
- Role-specific form fields with validation
- Contact information management
- Preferred crops and mandis selection
- Session management

**Role-Specific Fields**:
```tsx
// Farmer
{ farmSize: number; primaryCrops: string[] }

// Trader
{ companyName: string; gstNumber: string; tradingStates: string[] }

// Developer
{ companyName: string; intendedApiKey: string; useCase: string }

// Admin
{ employeeId: string; department: string }

// APMC
{ mandiName: string; licenseNumber: string; state: string }
```

**Validation**:
```tsx
const ProfileRequiredFieldsSchema = z.object({
  role: z.enum(["farmer", "trader", "developer", "admin", "apmc"]),
}).superRefine((value, ctx) => {
  if (value.role === "farmer") {
    if (!value.farmSize?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Farm Size is mandatory for Farmer.",
        path: ["farmSize"],
      });
    }
  }
  // ... other role validations
});
```

---

## 3. Data Fetching Patterns

### 3.1 TanStack Query Setup

All queries use a centralized configuration in `use-api.ts`:

```tsx
export function useTypedQuery<TData, TError = Error>(
  key: QueryKey,
  fetcher: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: key,
    queryFn: fetcher,
    staleTime: 5 * 60 * 1000,    // 5 minutes
    gcTime: 10 * 60 * 1000,      // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    ...options,
  });
}
```

### 3.2 Query Keys

Centralized query key factory for cache management:

```tsx
export const queryKeys = {
  prices: (filters?: PriceFilters) => ["prices", filters] as const,
  priceTrend: (crop: string, months?: number) => ["priceTrend", crop, months] as const,
  topMovers: () => ["topMovers"] as const,
  crops: () => ["crops"] as const,
  states: () => ["states"] as const,
  mandis: (stateCode?: string) => ["mandis", stateCode] as const,
  alerts: () => ["alerts"] as const,
  // ... more keys
};
```

### 3.3 API Client Pattern

Type-safe API client with Zod validation:

```tsx
// Define interface
export interface QuickStats {
  totalApmcs: number;
  cropsTracked: number;
  // ...
}

// Define Zod schema
export const QuickStatsSchema = z.object({
  totalApmcs: z.number(),
  cropsTracked: z.number(),
  // ...
});

// API method
export const apiClient = {
  getQuickStats: (): Promise<QuickStats> =>
    request("/quick-stats", QuickStatsSchema),
};
```

### 3.4 Hook Implementation

Standard pattern for data fetching hooks:

```tsx
export function usePrices(filters?: PriceFilters) {
  return useTypedQuery(
    queryKeys.prices(filters),
    () => apiClient.getPrices(filters),
    {
      enabled: true,
    }
  );
}

export function usePriceTrend(crop: string, months?: number) {
  return useTypedQuery(
    queryKeys.priceTrend(crop, months),
    () => apiClient.getPriceTrend(crop, months),
    {
      enabled: !!crop && crop.length > 0, // Conditional fetching
    }
  );
}
```

### 3.5 Error Handling

Centralized error handling with custom error classes:

```tsx
// In component
const { data, isLoading, error } = usePrices(filters);

if (error) {
  return (
    <div className="text-destructive">
      Failed to load prices: {getErrorMessage(error)}
    </div>
  );
}

// Error class hierarchy
class ApiError extends Error {
  status: number;
  statusText: string;
  details: unknown;
  
  isUnauthorized() { return this.status === 401; }
  isForbidden() { return this.status === 403; }
  isNotFound() { return this.status === 404; }
}

class ValidationError extends Error {
  zodError: z.ZodError;
}
```

### 3.6 Caching Strategies

| Data Type | Stale Time | Cache Time | Strategy |
|-----------|-----------|------------|----------|
| Prices | 5 min | 10 min | Background refresh |
| Crops/States | 30 min | 60 min | Static reference data |
| Top Movers | 2 min | 5 min | Frequent refresh |
| User Profile | 5 min | 10 min | Invalidate on update |
| Predictions | 5 min | 10 min | Manual refresh available |

---

## 4. Authentication Flow

### 4.1 Better Auth Setup

Authentication client configuration:

```tsx
// lib/auth-client.ts
import { createAuthClient } from 'better-auth/react';
import { emailOTPClient, magicLinkClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: AUTH_BASE_URL,
  fetchOptions: {
    credentials: 'include', // Important for cookies
  },
  plugins: [
    emailOTPClient(),
    magicLinkClient(),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

### 4.2 Protected Routes

Route guards handle authentication state:

```tsx
// components/ProtectedRoute.tsx
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { data, isPending } = useSession();

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (!data?.user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public-only routes (login, signup)
export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { data, isPending } = useSession();

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (data?.user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
```

### 4.3 Session Management

Using the `useSession` hook throughout the app:

```tsx
function MyComponent() {
  const { data: session, isPending } = useSession();
  
  if (isPending) return <Spinner />;
  
  const userRole = session?.user?.role as UserRole;
  
  return (
    <div>
      Welcome, {session?.user?.name}
      {userRole === 'trader' && <TraderTools />}
    </div>
  );
}
```

### 4.4 Sign In/Sign Up

```tsx
// Sign in with email/password
const result = await signIn.email({
  email: "user@example.com",
  password: "password",
});

// Sign in with OTP
const result = await signIn.emailOtp({
  email: "user@example.com",
  otp: "123456",
});

// Sign up
const result = await signUp.email({
  email: "user@example.com",
  password: "password",
  name: "User Name",
});

// Sign out
await signOut();
```

### 4.5 Role-Based Access

Role capabilities are checked using helper functions:

```tsx
// lib/role-access.ts
export function hasRoleCapability(
  role: UserRole | undefined,
  capability: RoleCapability
): boolean {
  const capabilities: Record<UserRole, RoleCapability[]> = {
    farmer: ["basic_alerts", "price_tracking"],
    trader: ["basic_alerts", "price_tracking", "arbitrage_detection", "bulk_export"],
    developer: ["api_access", "webhook_alerts", "data_quality_indicators"],
    admin: [/* all capabilities */],
    apmc: ["apmc_data_access", "mandi_management"],
  };
  
  return role ? capabilities[role]?.includes(capability) : false;
}
```

---

## 5. Push Notifications

### 5.1 Firebase Cloud Messaging Setup

FCM integration for web push notifications:

```tsx
// hooks/use-fcm.ts
export function useFCM(autoRequest = false): UseFCMReturn {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>("default");
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  
  const isSupported = isNotificationSupported() && isPushSupported();
  
  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) return false;
    
    const granted = await Notification.requestPermission();
    setPermissionStatus(granted as PermissionStatus);
    return granted === "granted";
  };
  
  const registerFCM = async (token: string): Promise<void> => {
    await registerFCMToken(token);
    setFcmToken(token);
  };
  
  return {
    registerFCM,
    unregisterFCM,
    isSupported,
    permissionStatus,
    requestPermission,
    fcmToken,
    setFcmToken,
  };
}
```

### 5.2 Token Registration

Register FCM token with backend for targeted notifications:

```tsx
export async function registerFCMToken(fcmToken: string): Promise<void> {
  const deviceInfo = {
    browser: getBrowserName(),
    os: getOSName(),
    userAgent: navigator.userAgent,
  };

  await apiClient.request(
    "/alerts/fcm-token",
    z.void(),
    undefined,
    {
      method: "POST",
      body: { token: fcmToken, deviceInfo },
    }
  );
}
```

### 5.3 Handling Notifications

Listen for incoming FCM messages:

```tsx
export function onMessageListener(
  messaging: unknown,
  callbacks?: OnMessageCallbacks
): () => void {
  const setupListener = async () => {
    const { onMessage } = await import("firebase/messaging");
    
    unsubscribe = onMessage(messaging, (payload: FCMMessage) => {
      const { notification, data } = payload;
      
      // Show toast notification
      toast({
        title: notification?.title || "New Notification",
        description: notification?.body || "",
        duration: 5000,
      });
      
      // Or create native notification
      if (Notification.permission === "granted") {
        const notif = new Notification(notification?.title, {
          body: notification?.body,
          icon: notification?.image || "/favicon.ico",
          data: data || {},
        });
        
        notif.onclick = () => {
          window.focus();
          if (data?.url) {
            window.location.href = data.url;
          }
        };
      }
    });
  };
  
  setupListener();
  return () => unsubscribe();
}
```

### 5.4 Usage in Components

```tsx
function NotificationSettings() {
  const { 
    permissionStatus, 
    requestPermission, 
    registerFCM,
    isSupported 
  } = useFCM();
  
  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      // Get FCM token from Firebase and register
      const token = await getFCMToken(messaging, vapidKey);
      if (token) {
        await registerFCM(token);
      }
    }
  };
  
  return (
    <div>
      {isSupported && permissionStatus !== "granted" && (
        <Button onClick={handleEnableNotifications}>
          Enable Push Notifications
        </Button>
      )}
    </div>
  );
}
```

---

## 6. State Management

### 6.1 Server State vs Local State

| Type | Tool | Use Case |
|------|------|----------|
| Server State | TanStack Query | API data, caching, synchronization |
| Local State | useState/useReducer | Form inputs, UI toggles, ephemeral state |
| Global State | Context (minimal) | Theme, auth session (via Better Auth) |

### 6.2 Server State Pattern

```tsx
// Fetch data with caching
const { data: prices } = usePrices(filters);

// Mutation with cache invalidation
const createAlert = useCreateAlert();

// Prefetch on hover
const queryClient = useQueryClient();
const prefetchPrices = () => {
  queryClient.prefetchQuery({
    queryKey: queryKeys.prices(),
    queryFn: () => apiClient.getPrices(),
  });
};
```

### 6.3 Optimistic Updates

Update UI immediately before API confirmation:

```tsx
export function useCreateAlert() {
  const queryClient = useQueryClient();

  return useTypedMutation<PriceAlert, Error, CreateAlertInput>(
    (input) => apiClient.createAlert(input),
    {
      onMutate: async (newAlert) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey: queryKeys.alerts() });
        
        // Snapshot previous value
        const previousAlerts = queryClient.getQueryData<PriceAlert[]>(
          queryKeys.alerts()
        );
        
        // Optimistically update
        const optimisticAlert: PriceAlert = {
          id: `temp-${Date.now()}`,
          cropId: newAlert.crop,
          // ... other fields
          isActive: true,
        };
        
        queryClient.setQueryData<PriceAlert[]>(
          queryKeys.alerts(),
          [...(previousAlerts || []), optimisticAlert]
        );
        
        return { previousAlerts };
      },
      onError: (err, newAlert, context) => {
        // Rollback on error
        if (context?.previousAlerts) {
          queryClient.setQueryData(queryKeys.alerts(), context.previousAlerts);
        }
      },
      onSettled: () => {
        // Always refetch after error or success
        queryClient.invalidateQueries({ queryKey: queryKeys.alerts() });
      },
    }
  );
}
```

### 6.4 Local State Patterns

```tsx
// Form state
const [formData, setFormData] = useState({
  crop: "",
  threshold: "",
});

// Derived state with useMemo
const filteredPrices = useMemo(() => {
  return prices.filter(p => 
    p.crop.toLowerCase().includes(searchQ.toLowerCase())
  );
}, [prices, searchQ]);

// Multiple related state -> useReducer for complex forms
const [state, dispatch] = useReducer(formReducer, initialState);
```

---

## 7. Component Patterns

### 7.1 shadcn/ui Components

All UI components are from shadcn/ui, installed via CLI:

```bash
bunx shadcn add button
bunx shadcn add card
bunx shadcn add dialog
# etc.
```

**Usage Pattern**:
```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <Button variant="default" size="sm">
      Action
    </Button>
  </CardContent>
</Card>
```

### 7.2 Form Handling with React Hook Form

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  crop: z.string().min(1, "Crop is required"),
  threshold: z.number().min(0, "Threshold must be positive"),
});

type FormValues = z.infer<typeof formSchema>;

function AlertForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      crop: "",
      threshold: 0,
    },
  });

  const onSubmit = (values: FormValues) => {
    console.log(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="crop"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Crop</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

### 7.3 Reusable Component Patterns

**Data Table Pattern**:
```tsx
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({ data, columns, isLoading }: DataTableProps<T>) {
  // Implementation
}
```

**Card with Stats Pattern**:
```tsx
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
}

export function StatCard({ title, value, subtitle, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-3xl font-bold font-display">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground/70">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
```

### 7.4 Toast Notifications

```tsx
import { useToast } from "@/hooks/use-toast";

function MyComponent() {
  const { toast } = useToast();

  const handleAction = async () => {
    try {
      await apiCall();
      toast({
        title: "Success",
        description: "Operation completed successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };
}
```

---

## 8. Development Workflow

### 8.1 Adding New Pages

1. **Create page component** in `src/pages/`:
```tsx
// src/pages/NewFeature.tsx
export default function NewFeature() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold">New Feature</h1>
      {/* Content */}
    </div>
  );
}
```

2. **Add route** in `App.tsx`:
```tsx
import NewFeature from "./pages/NewFeature";

<Route path="/new-feature" element={<NewFeature />} />
```

3. **Add navigation link** in `AppSidebar.tsx`:
```tsx
{
  title: "New Feature",
  url: "/new-feature",
  icon: SomeIcon,
}
```

### 8.2 Adding New API Hooks

1. **Add API method** in `api-client.ts`:
```tsx
export const apiClient = {
  getNewData: (params: Params): Promise<Data> =>
    request("/new-endpoint", DataSchema, params),
};
```

2. **Add query key** in `use-api.ts`:
```tsx
export const queryKeys = {
  newData: (params?: Params) => ["newData", params] as const,
};
```

3. **Create hook** in `hooks/use-new-data.ts`:
```tsx
export function useNewData(params?: Params) {
  return useTypedQuery(
    queryKeys.newData(params),
    () => apiClient.getNewData(params),
    {
      enabled: !!params,
    }
  );
}

export function useCreateNewData() {
  const queryClient = useQueryClient();
  
  return useTypedMutation(
    (payload) => apiClient.createNewData(payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.newData() });
        toast({ title: "Success", description: "Created successfully." });
      },
    }
  );
}
```

### 8.3 Testing with Vitest

**Test Setup** (`src/test/setup.ts`):
```typescript
import "@testing-library/jest-dom";

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
```

**Writing Tests**:
```tsx
// src/hooks/use-alerts.test.ts
import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAlerts } from "./use-alerts";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useAlerts", () => {
  it("should fetch alerts", async () => {
    const { result } = renderHook(() => useAlerts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });
});
```

**Running Tests**:
```bash
# Run all tests
bun test

# Run in watch mode
bun test --watch

# Run with coverage
bun test --coverage
```

### 8.4 Environment Variables

Required environment variables in `.env`:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api/consumer-portal
VITE_AUTH_BASE_URL=http://localhost:5000/api

# Firebase Configuration (for FCM)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_VAPID_KEY=your-vapid-key
```

**Access in code**:
```typescript
const apiUrl = import.meta.env.VITE_API_BASE_URL;
if (!apiUrl) {
  throw new Error("VITE_API_BASE_URL environment variable is required");
}
```

### 8.5 Build and Deploy

```bash
# Development
bun dev

# Build for production
bun run build

# Preview production build
bun run preview

# Lint
bun run lint
```

### 8.6 Code Style Guidelines

- **TypeScript**: Strict mode enabled, explicit return types on exported functions
- **Imports**: Use `@/` path alias for project imports
- **Components**: Default exports for pages, named exports for reusable components
- **Styling**: Tailwind classes, use `cn()` utility for conditional classes
- **Error Handling**: Always use `getErrorMessage()` for user-facing errors
- **Loading States**: Show skeletons or spinners, never leave blank
- **Accessibility**: Use Radix UI primitives, ensure keyboard navigation

---

## Quick Reference

### Common Imports

```tsx
// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Hooks
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth";

// Utilities
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/api-errors";

// Icons
import { Loader2, Search, Filter, Download } from "lucide-react";
```

### File Templates

**New Page**:
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PageName() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Page Title</h1>
        <p className="text-sm text-muted-foreground">Description</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Section</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Content */}
        </CardContent>
      </Card>
    </div>
  );
}
```

**New Hook**:
```tsx
import { useTypedQuery, queryKeys, useTypedMutation, useQueryClient } from "./use-api";
import { apiClient } from "@/lib/api-client";
import { toast } from "./use-toast";

export function useEntity() {
  return useTypedQuery(
    queryKeys.entity(),
    () => apiClient.getEntity(),
    { staleTime: 5 * 60 * 1000 }
  );
}

export function useCreateEntity() {
  const queryClient = useQueryClient();
  
  return useTypedMutation(
    (payload) => apiClient.createEntity(payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.entity() });
        toast({ title: "Success", description: "Created successfully." });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      },
    }
  );
}
```
