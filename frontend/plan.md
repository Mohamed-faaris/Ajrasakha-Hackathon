

# Mandi-Insights — React Frontend Plan

## Overview
A beautiful, responsive agricultural market data platform frontend covering all 7,021 APMCs across India. Built with React + TypeScript + Tailwind + Recharts + mock data. You'll connect your own MERN backend later.

---

## Pages & Features

### 1. Landing / Home Page
- Hero section with search bar (search by crop, mandi, state, district)
- Quick stats cards: Total APMCs covered, crops tracked, today's updates
- "Top Gainers / Losers" ticker showing price movers
- Coverage summary: eNAM vs state portals breakdown

### 2. Market Prices Dashboard (Core Page)
- **Searchable/filterable table** of today's prices across all APMCs
  - Filters: State, District, Mandi, Crop, Variety, Date range
  - Source indicator badge (eNAM / Agmarknet / State Portal)
  - Sortable columns: Crop, Min Price, Max Price, Modal Price
- **Coverage tracker** showing data freshness per APMC
- Export buttons: CSV / Excel / PDF download
- Summary cards: "Average potato price up 12% this month across 450 APMCs"

### 3. Analytics & Trends Page
- **Price trend charts** (line graphs): 7 days / 1 month / 6 months / 1 year
- **Seasonal pattern visualization** showing harvest dips and festival spikes
- **Volatility index** highlighting high-fluctuation crops
- **MSP comparison**: Minimum Support Price vs actual market price chart
- Crop and region selectors to customize views

### 4. Geographic Insights / Map Page
- **India heatmap**: State-wise price distribution for selected crop (using a simple SVG map or color-coded state cards)
- **APMC Coverage Map**: Visual showing 7,021 APMCs — color-coded by data source (eNAM-integrated vs non-integrated)
- **Interstate comparison** bar charts showing price gaps between regions
- District-level drill-down

### 5. Arbitrage & Alerts Page
- **Arbitrage opportunities table**: "Tomatoes: ₹40/kg in Mandi A, ₹65/kg in Mandi B (150km away)"
- **Price alert configuration** form (set crop, threshold, notification preference)
- **Data completeness score** per crop showing % of APMCs reporting

### 6. Reports Page
- Generate downloadable PDF reports with charts and insights
- Date range and crop/state filters
- Summary statistics and embedded charts

### 7. Sidebar Navigation
- Clean sidebar with icons for: Dashboard, Analytics, Map, Arbitrage, Reports
- Mobile-responsive hamburger menu
- Collapsible design

---

## Design Approach
- **Clean, modern UI** with a green/earth-tone agricultural theme
- **Farmer-friendly**: Large text, clear labels, Hindi/English ready structure
- **Responsive**: Works well on mobile for farmers in the field
- **Data-dense but organized**: Cards, tabs, and collapsible sections to manage complexity

## Mock Data
- Realistic sample data for ~50 crops across major states
- 20+ APMCs with varied prices to demonstrate all features
- Historical price data for trend charts (6 months)

## Backend-Ready Architecture
- All data fetching through a centralized API service layer (`/lib/api/`)
- Easy to swap mock data for real API calls to your Express backend
- Type-safe interfaces for all data models (Crop, Mandi, Price, Alert)

