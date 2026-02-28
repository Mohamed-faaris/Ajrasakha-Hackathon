await fetch("https://api.agmarknet.gov.in/v1/daily-price-arrival/report?from_date=2026-02-01&to_date=2026-02-17&data_type=100006&group=4&commodity=16&state=%5B100000%5D&district=%5B100001%5D&market=%5B100002%5D&grade=%5B100003%5D&variety=%5B100007%5D&page=1&limit=10", {
"method": "GET"
});

---

## With Variables and Explanation

```javascript
// API Configuration
const baseUrl = "https://api.agmarknet.gov.in/v1/daily-price-arrival/report";

// Query Parameters
const params = {
  from_date: "2026-02-01", // Start date for price data
  to_date: "2026-02-17", // End date for price data
  data_type: "100006", // Data type code
  group: "4", // Commodity group
  commodity: "16", // Commodity code (e.g., 16 = wheat)
  state: "[100000]", // State code
  district: "[100001]", // District code
  market: "[100002]", // Market/APMC code
  grade: "[100003]", // Grade code
  variety: "[100007]", // Variety code
  page: "1", // Pagination page
  limit: "10", // Records per page
};

// Build URL with query parameters
const queryString = new URLSearchParams(params).toString();
const url = `${baseUrl}?${queryString}`;

// Fetch API call
const response = await fetch(url, {
  method: "GET",
});

const data = await response.json();
```
