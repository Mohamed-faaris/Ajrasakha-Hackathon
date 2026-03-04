// Placeholder hooks for APMC portal — no real API calls

export function useAPMCStats() {
  return {
    data: {
      integrationStatus: "Active" as const,
      lastSubmission: "2026-03-02",
      totalRecords: 1247,
      dataHealth: "Active" as const,
      coverageContribution: 78,
      submissionTrend: [
        { month: "Oct", count: 180 },
        { month: "Nov", count: 210 },
        { month: "Dec", count: 195 },
        { month: "Jan", count: 230 },
        { month: "Feb", count: 220 },
        { month: "Mar", count: 212 },
      ],
    },
    isLoading: false,
  };
}

export function useSubmitPrice() {
  return {
    mutate: (data: Record<string, unknown>) => {
      console.log("Submit price:", data);
    },
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    reset: () => {},
  };
}

export function useBulkUpload() {
  return {
    upload: (file: File) => {
      console.log("Upload:", file.name);
    },
    progress: 0,
    status: "idle" as "idle" | "processing" | "success" | "failed",
    error: null as string | null,
    reset: () => {},
  };
}

export function useSubmissionHistory() {
  return {
    data: [
      { id: "1", date: "2026-03-02", crop: "Wheat", minPrice: 2100, maxPrice: 2450, modalPrice: 2280, status: "Approved", source: "Manual" },
      { id: "2", date: "2026-03-01", crop: "Rice", minPrice: 1850, maxPrice: 2200, modalPrice: 2050, status: "Approved", source: "Excel" },
      { id: "3", date: "2026-02-28", crop: "Soybean", minPrice: 3800, maxPrice: 4200, modalPrice: 4000, status: "Pending", source: "API" },
      { id: "4", date: "2026-02-27", crop: "Cotton", minPrice: 5600, maxPrice: 6100, modalPrice: 5850, status: "Approved", source: "Manual" },
      { id: "5", date: "2026-02-26", crop: "Maize", minPrice: 1700, maxPrice: 2000, modalPrice: 1850, status: "Rejected", source: "Excel" },
      { id: "6", date: "2026-02-25", crop: "Wheat", minPrice: 2050, maxPrice: 2400, modalPrice: 2230, status: "Approved", source: "Manual" },
      { id: "7", date: "2026-02-24", crop: "Chickpea", minPrice: 4200, maxPrice: 4800, modalPrice: 4500, status: "Approved", source: "API" },
      { id: "8", date: "2026-02-23", crop: "Mustard", minPrice: 4500, maxPrice: 5000, modalPrice: 4750, status: "Pending", source: "Manual" },
    ],
    isLoading: false,
    totalPages: 3,
    currentPage: 1,
  };
}

export function useMandiProfile() {
  return {
    data: {
      mandiName: "Azadpur Mandi",
      state: "Delhi",
      district: "North Delhi",
      latitude: "28.7041",
      longitude: "77.1025",
      contactPerson: "Rajesh Kumar",
      email: "azadpur@apmc.gov.in",
      phone: "+91 98765 43210",
      lastUpdated: "2026-02-28T10:30:00Z",
    },
    update: (data: Record<string, unknown>) => {
      console.log("Update profile:", data);
    },
    isUpdating: false,
  };
}

export function useIntegrationSettings() {
  return {
    data: {
      dataSourceType: "manual" as "manual" | "excel" | "api",
      apiKey: "sk-apmc-****-****-****-abcd1234",
      webhookUrl: "https://api.agrimarket.gov.in/webhook/apmc/azadpur",
      integrationStatus: "Approved" as "Approved" | "Pending" | "Rejected",
      lastVerified: "2026-02-28T14:00:00Z",
    },
    updateSource: (type: string) => {
      console.log("Update source:", type);
    },
    regenerateKey: () => {
      console.log("Regenerate API key");
    },
  };
}
