# Project Demo

A visual showcase of the Ajrasakha platform features, including consumer portal, APMC portal, prediction engine, and scraper engine.

---

## Two Frontend Portals

### Mandi Insights

**3 Login Methods:**

**OTP Login**

![Login](https://github.com/user-attachments/assets/9da4dd60-e8b8-46ae-aedc-ac8bb0cac6ec)

<img width="1920" height="1080" alt="OTP Screen" src="https://github.com/user-attachments/assets/e0fb41cc-f6bc-4cf0-a1cc-a3bb019bc776" />

![Dashboard](https://github.com/user-attachments/assets/0cc49cba-d2bd-4954-a1a2-b50699ace7be)

<img width="1920" height="1080" alt="Dashboard View" src="https://github.com/user-attachments/assets/35479530-b83a-4fe9-8a17-aaee36dcba8a" />

**Magic Link Login**

<img width="1920" height="1080" alt="Magic Link" src="https://github.com/user-attachments/assets/d77bff0d-ad1a-4f8a-bdc9-652c5b69aa3a" />

<img width="1920" height="1080" alt="Magic Link Email" src="https://github.com/user-attachments/assets/64ba55f7-b63c-4982-a493-73f5adc6de9c" />

**Sign Up Page**

<img width="925" height="1080" alt="Sign Up" src="https://github.com/user-attachments/assets/db90ed58-e357-4384-bb72-44d8b5141b45" />

**Stats Dashboard**

<img width="1920" height="1079" alt="Stats" src="https://github.com/user-attachments/assets/38ba62c1-b1c1-42f4-af53-abbbeac109af" />

**Interactive Price Dashboard**

<img width="1919" height="1079" alt="Price Dashboard" src="https://github.com/user-attachments/assets/876d8300-3081-477e-b41d-75fc91aae62f" />

**Prediction Dashboard**

<img width="1918" height="1078" alt="Predictions" src="https://github.com/user-attachments/assets/900969ce-e6d3-4e64-be43-672cd0a14a24" />

**Interstate Comparison**

<img width="1557" height="456" alt="Interstate" src="https://github.com/user-attachments/assets/4c82dd2b-33cf-4e99-a6c1-270b50c4db66" />

**Developer API with Rate Limits**

<img width="1636" height="784" alt="API" src="https://github.com/user-attachments/assets/8df34ab5-82d2-4471-ad6a-000f00a78706" />

<img width="1623" height="472" alt="Rate Limits" src="https://github.com/user-attachments/assets/fc2d3f5f-f231-457e-a74d-1826b24ffefc" />

**Price Alerts**

<img width="1151" height="991" alt="Price Alert" src="https://github.com/user-attachments/assets/5329ba3e-6b93-417a-bae0-817f77b3dabd" />

**Push Notifications**

<img width="1920" height="1072" alt="Push Notification" src="https://github.com/user-attachments/assets/a0501ff8-1d17-43a6-b11d-3d83ae4aa0ef" />

**Email Notifications**

<img width="1660" height="967" alt="Email" src="https://github.com/user-attachments/assets/52fb20a2-4e29-48e6-9368-e84b23535b36" />

---

## APMC Portal

<img width="1915" height="964" alt="APMC 1" src="https://github.com/user-attachments/assets/92dab476-25b4-486a-91f5-f05f80166d87" />

<img width="1920" height="974" alt="APMC 2" src="https://github.com/user-attachments/assets/6f7f6c7e-efae-48c9-9e61-fef231104b29" />

<img width="1920" height="959" alt="APMC 3" src="https://github.com/user-attachments/assets/fd1f95c5-b430-48a9-9559-1fd65ae71457" />

<img width="1917" height="947" alt="APMC 4" src="https://github.com/user-attachments/assets/ce1e1829-0d83-4c35-900c-d91b946623a1" />

<img width="1920" height="964" alt="APMC 5" src="https://github.com/user-attachments/assets/013e669d-f3f3-48b7-91b6-56722fa717b3" />

---

## Prediction Engine Admin

`http://localhost:8000/admin/ui`

<img width="1913" height="943" alt="Prediction Admin" src="https://github.com/user-attachments/assets/87552964-710e-46b5-b730-9a5feb3c4969" />

---

## Scraper Engine

**Raw Data**

<img width="1915" height="1037" alt="Raw Data" src="https://github.com/user-attachments/assets/636e13a1-bc0c-4289-b605-0afbdf4f96ab" />

**APMC Maps**

<img width="1920" height="1076" alt="APMC Maps" src="https://github.com/user-attachments/assets/199c8d53-f923-4f30-a439-69eeb8e3140b" />

**Crops Map**

<img width="1920" height="1069" alt="Crops Map" src="https://github.com/user-attachments/assets/691daf3a-e95e-4778-acd6-4a1cee82d22d" />

---

## Database

<img width="1920" height="1080" alt="Database 1" src="https://github.com/user-attachments/assets/d8404bfe-75be-4002-87ca-8842aa8c98db" />

<img width="1624" height="968" alt="Database 2" src="https://github.com/user-attachments/assets/c8d5abfe-3be0-479d-b12b-4cea7ccfb6f9" />

### Actual Data from MongoDB (JSON)

#### Database: mandi_insights

---

## 1. Prices Collection

```json
[
  {
    "_id": "69943b8f0fb4723b3ff735f1",
    "cropId": "maize",
    "cropName": "MAIZE",
    "mandiId": "py-pondicherry-thattanchavady-apmc",
    "mandiName": "THATTANCHAVADY APMC",
    "stateId": "PY",
    "stateName": "PONDICHERRY",
    "districtId": "pondicherry",
    "districtName": "PONDICHERRY",
    "date": "2026-02-11T00:00:00.000Z",
    "minPrice": 1929,
    "maxPrice": 1929,
    "modalPrice": 1929,
    "unit": "Qui",
    "arrival": 36,
    "source": "enam",
    "sourceId": "34529995"
  },
  {
    "_id": "69943b8f0fb4723b3ff735f2",
    "cropId": "millets",
    "cropName": "MILLETS",
    "mandiId": "py-pondicherry-thattanchavady-apmc",
    "mandiName": "THATTANCHAVADY APMC",
    "stateId": "PY",
    "stateName": "PONDICHERRY",
    "districtId": "pondicherry",
    "districtName": "PONDICHERRY",
    "date": "2026-02-10T00:00:00.000Z",
    "minPrice": 3600,
    "maxPrice": 3600,
    "modalPrice": 3600,
    "unit": "Qui",
    "arrival": 1,
    "source": "enam",
    "sourceId": "34529993"
  }
]
```

---

## 2. Mandis Collection

```json
[
  {
    "_id": "mh-hingoli-adarsh-krushi-bazar-apmc",
    "name": "ADARSH KRUSHI BAZAR APMC",
    "stateId": "MH",
    "stateName": "MAHARASHTRA",
    "districtId": "hingoli",
    "districtName": "HINGOLI",
    "sourceMandiId": "3992"
  },
  {
    "_id": "tn-thanjavur-adirampattinam-apmc",
    "name": "ADIRAMPATTINAM APMC",
    "stateId": "TN",
    "stateName": "TAMIL NADU",
    "districtId": "thanjavur",
    "districtName": "THANJAVUR",
    "sourceMandiId": "4680"
  }
]
```

---

## 3. Crops Collection

```json
[
  {
    "_id": "barnyard-millet",
    "name": "BARNYARD MILLET",
    "commodityGroup": "Cereals"
  },
  {
    "_id": "black-gramurd-beanswhole",
    "name": "BLACK GRAM(URD BEANS)(WHOLE)",
    "commodityGroup": "Pulses"
  }
]
```

---

## 4. Alerts Collection

```json
[
  {
    "_id": "69a93a3500d15f64733cb89b",
    "userId": "5397a1bb-e056-49f9-8ef1-dd28bb9c606e",
    "cropId": "ambat-chuka",
    "cropName": "AMBAT CHUKA",
    "alertType": "price",
    "thresholdPrice": 3232,
    "cooldownHours": 24,
    "isActive": true
  },
  {
    "_id": "69aaaa53b24a6d7ab39eb75f",
    "userId": "1e21b738-02fe-4d77-98fb-55d94835f54b",
    "cropId": "ambat-chuka",
    "cropName": "AMBAT CHUKA",
    "alertType": "price",
    "thresholdPrice": 2000,
    "cooldownHours": 24,
    "isActive": true
  }
]
```

---

## 5. UserProfiles Collection

```json
[
  {
    "_id": "699a26dd82a1c9674b893413",
    "userId": "699431bdf67e62f3e98df31d",
    "preferredCrops": [],
    "preferredMandis": [],
    "notificationSettings": {
      "email": { "enabled": true, "priceAlerts": true, "dailyDigest": false, "weeklyReport": true },
      "sms": { "enabled": false, "priceAlerts": false },
      "push": { "enabled": true, "priceAlerts": true }
    },
    "language": "en",
    "farmerDetails": { "isFarmer": false, "primaryCrops": [] },
    "traderDetails": { "isTrader": false, "tradingStates": [] }
  },
  {
    "_id": "69a92c1694ef303bcd803578",
    "userId": "1e21b738-02fe-4d77-98fb-55d94835f54b",
    "role": "farmer",
    "preferredCrops": [],
    "preferredMandis": [],
    "notificationSettings": {
      "email": { "enabled": true, "priceAlerts": true, "dailyDigest": false, "weeklyReport": true },
      "sms": { "enabled": false, "priceAlerts": false },
      "push": { "enabled": true, "priceAlerts": true }
    },
    "language": "en",
    "farmerDetails": { "isFarmer": true, "farmSize": 10, "primaryCrops": ["jblb"] },
    "traderDetails": { "isTrader": false, "tradingStates": [] }
  }
]
```

---

## 6. Sources Collection

```json
[
  {
    "_id": "698fb3cfd954acef4db65c0a",
    "entryUrl": "https://enam.gov.in/web/",
    "baseUrl": "https://enam.gov.in",
    "extractionType": "html_table",
    "htmlPageUrl": "https://enam.gov.in/web/dashboard/agmarknet",
    "htmlSelector": "table.table",
    "healthStatus": "STALE"
  },
  {
    "_id": "698fba82d954acef4db65c0e",
    "entryUrl": "https://agmarknet.gov.in",
    "baseUrl": "https://agmarknet.gov.in",
    "endpoint": "https://api.agmarknet.gov.in/v1/dashboard-filters/?dashboard_name=marketwise_price_arrival",
    "endpointMethod": "GET",
    "extractionType": "api",
    "healthStatus": "STALE"
  }
]
```

---

## 7. States Collection

```json
[
  {
    "_id": "TN",
    "name": "tamil nadu",
    "districts": [
      { "_id": "ARIYALUR", "name": "ariyalur" },
      { "_id": "CHENNAI", "name": "chennai" },
      { "_id": "COIMBATORE", "name": "coimbatore" },
      { "_id": "MADURAI", "name": "madurai" },
      { "_id": "SALEM", "name": "salem" }
    ]
  },
  {
    "_id": "WB",
    "name": "west bengal",
    "districts": [
      { "_id": "KOLKATA", "name": "kolkata" },
      { "_id": "DARJEELING", "name": "darjeeling" },
      { "_id": "HOOGHLY", "name": "hooghly" }
    ]
  }
]
```

---

## 8. Coverage Collection

```json
{
  "_id": "current",
  "computedAt": "2026-03-04T03:30:00.068Z",
  "coveragePercent": 9.35,
  "coveredApmcs": 405,
  "totalApmcs": 4330,
  "totalPrices": 1608,
  "statesCovered": 19,
  "latestDate": "2026-03-01T00:00:00.000Z"
}
```

---

## 9. Predictions Collection (227 records)

```json
[
  {
    "_id": "69a777360cadf6de30bf2ae5",
    "cropId": "beetroot",
    "mandiId": "mh-pune-punemanjri-apmc",
    "expiresAt": "2026-03-06T13:50:52.433Z",
    "generatedAt": "2026-03-05T13:50:52.433Z",
    "predictions": [
      { "date": "2026-03-05T13:50:52.433Z", "predictedPrice": 1591.85, "confidence": 71.8 },
      { "date": "2026-03-06T13:50:52.433Z", "predictedPrice": 1583.7, "confidence": 67.8 },
      { "date": "2026-03-07T13:50:52.433Z", "predictedPrice": 1575.56, "confidence": 63.8 }
    ],
    "trend": "Bearish"
  },
  {
    "_id": "69a910f20cadf6de30bf2c9e",
    "mandiId": "gj-morbi-apmc-halvad",
    "cropId": "wheat",
    "expiresAt": "2026-03-07T11:30:44.818Z",
    "generatedAt": "2026-03-06T11:30:44.818Z",
    "predictions": [
      { "date": "2026-03-06T11:30:44.818Z", "predictedPrice": 2195, "confidence": 88.4 },
      { "date": "2026-03-07T11:30:44.818Z", "predictedPrice": 2190, "confidence": 84.4 },
      { "date": "2026-03-08T11:30:44.818Z", "predictedPrice": 2185, "confidence": 80.4 }
    ],
    "trend": "Neutral"
  },
  {
    "_id": "69a910f20cadf6de30bf2ca4",
    "cropId": "wheat",
    "mandiId": "gj-gandhinagar-kalol-apmc",
    "expiresAt": "2026-03-07T11:30:44.063Z",
    "generatedAt": "2026-03-06T11:30:44.063Z",
    "predictions": [
      { "date": "2026-03-06T11:30:44.061Z", "predictedPrice": 2260, "confidence": 87 },
      { "date": "2026-03-07T11:30:44.061Z", "predictedPrice": 2270, "confidence": 83 },
      { "date": "2026-03-08T11:30:44.061Z", "predictedPrice": 2280, "confidence": 79 }
    ],
    "trend": "Bullish"
  }
]
```
