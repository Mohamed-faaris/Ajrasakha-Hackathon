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

### Actual Data (mongosh)



Once connected, switch to the database:

```javascript
db = db.getSiblingDB('mandi_insights')
```

#### Insert Actual Data

```javascript
db.predictions.insertMany([
  {
    _id: ObjectId("69a777360cadf6de30bf2ae5"),
    cropId: "beetroot",
    mandiId: "mh-pune-punemanjri-apmc",
    expiresAt: ISODate("2026-03-06T13:50:52.433Z"),
    generatedAt: ISODate("2026-03-05T13:50:52.433Z"),
    predictions: [
      { date: ISODate("2026-03-05T13:50:52.433Z"), predictedPrice: 1591.85, confidence: 71.8 },
      { date: ISODate("2026-03-06T13:50:52.433Z"), predictedPrice: 1583.7, confidence: 67.8 },
      { date: ISODate("2026-03-07T13:50:52.433Z"), predictedPrice: 1575.56, confidence: 63.8 },
      { date: ISODate("2026-03-08T13:50:52.433Z"), predictedPrice: 1567.41, confidence: 59.8 },
      { date: ISODate("2026-03-09T13:50:52.433Z"), predictedPrice: 1559.26, confidence: 55.8 },
      { date: ISODate("2026-03-10T13:50:52.433Z"), predictedPrice: 1551.11, confidence: 51.8 },
      { date: ISODate("2026-03-11T13:50:52.433Z"), predictedPrice: 1542.96, confidence: 47.8 }
    ],
    trend: "Bearish",
    updatedAt: ISODate("2026-03-05T13:50:52.433Z")
  },
  {
    _id: ObjectId("69a910f20cadf6de30bf2c9e"),
    mandiId: "gj-morbi-apmc-halvad",
    cropId: "wheat",
    expiresAt: ISODate("2026-03-07T11:30:44.818Z"),
    generatedAt: ISODate("2026-03-06T11:30:44.818Z"),
    predictions: [
      { date: ISODate("2026-03-06T11:30:44.818Z"), predictedPrice: 2195, confidence: 88.4 },
      { date: ISODate("2026-03-07T11:30:44.818Z"), predictedPrice: 2190, confidence: 84.4 },
      { date: ISODate("2026-03-08T11:30:44.818Z"), predictedPrice: 2185, confidence: 80.4 },
      { date: ISODate("2026-03-09T11:30:44.818Z"), predictedPrice: 2180, confidence: 76.4 },
      { date: ISODate("2026-03-10T11:30:44.818Z"), predictedPrice: 2175, confidence: 72.4 },
      { date: ISODate("2026-03-11T11:30:44.818Z"), predictedPrice: 2170, confidence: 68.4 },
      { date: ISODate("2026-03-12T11:30:44.818Z"), predictedPrice: 2165, confidence: 64.4 }
    ],
    trend: "Neutral",
    updatedAt: ISODate("2026-03-06T11:30:44.818Z")
  },
  {
    _id: ObjectId("69a910f20cadf6de30bf2c9f"),
    cropId: "wheat",
    mandiId: "mh-akola-akola-apmc",
    expiresAt: ISODate("2026-03-07T11:30:46.396Z"),
    generatedAt: ISODate("2026-03-06T11:30:46.396Z"),
    predictions: [
      { date: ISODate("2026-03-06T11:30:46.396Z"), predictedPrice: 2280.33, confidence: 89.7 },
      { date: ISODate("2026-03-07T11:30:46.396Z"), predictedPrice: 2280.67, confidence: 85.7 },
      { date: ISODate("2026-03-08T11:30:46.396Z"), predictedPrice: 2281, confidence: 81.7 },
      { date: ISODate("2026-03-09T11:30:46.396Z"), predictedPrice: 2281.33, confidence: 77.7 },
      { date: ISODate("2026-03-10T11:30:46.396Z"), predictedPrice: 2281.67, confidence: 73.7 },
      { date: ISODate("2026-03-11T11:30:46.396Z"), predictedPrice: 2282, confidence: 69.7 },
      { date: ISODate("2026-03-12T11:30:46.396Z"), predictedPrice: 2282.33, confidence: 65.7 }
    ],
    trend: "Neutral",
    updatedAt: ISODate("2026-03-06T11:30:46.396Z")
  },
  {
    _id: ObjectId("69a910f20cadf6de30bf2ca0"),
    cropId: "brinjal",
    mandiId: "mh-pune-punemanjri-apmc",
    expiresAt: ISODate("2026-03-07T11:30:44.305Z"),
    generatedAt: ISODate("2026-03-06T11:30:44.305Z"),
    predictions: [
      { date: ISODate("2026-03-06T11:30:44.305Z"), predictedPrice: 3500, confidence: 72.5 },
      { date: ISODate("2026-03-07T11:30:44.305Z"), predictedPrice: 3500, confidence: 68.5 },
      { date: ISODate("2026-03-08T11:30:44.305Z"), predictedPrice: 3500, confidence: 64.5 },
      { date: ISODate("2026-03-09T11:30:44.305Z"), predictedPrice: 3500, confidence: 60.5 },
      { date: ISODate("2026-03-10T11:30:44.305Z"), predictedPrice: 3500, confidence: 56.5 },
      { date: ISODate("2026-03-11T11:30:44.305Z"), predictedPrice: 3500, confidence: 52.5 },
      { date: ISODate("2026-03-12T11:30:44.305Z"), predictedPrice: 3500, confidence: 48.5 }
    ],
    trend: "Neutral",
    updatedAt: ISODate("2026-03-06T11:30:44.305Z")
  },
  {
    _id: ObjectId("69a910f20cadf6de30bf2ca1"),
    cropId: "bajrapearl-milletcumbu",
    mandiId: "gj-banaskanth-deesabhildi-apmc",
    expiresAt: ISODate("2026-03-07T11:30:46.316Z"),
    generatedAt: ISODate("2026-03-06T11:30:46.316Z"),
    predictions: [
      { date: ISODate("2026-03-06T11:30:46.315Z"), predictedPrice: 2741.78, confidence: 86.8 },
      { date: ISODate("2026-03-07T11:30:46.315Z"), predictedPrice: 2733.56, confidence: 82.8 },
      { date: ISODate("2026-03-08T11:30:46.315Z"), predictedPrice: 2725.33, confidence: 78.8 },
      { date: ISODate("2026-03-09T11:30:46.315Z"), predictedPrice: 2717.11, confidence: 74.8 },
      { date: ISODate("2026-03-10T11:30:46.315Z"), predictedPrice: 2708.89, confidence: 70.8 },
      { date: ISODate("2026-03-11T11:30:46.315Z"), predictedPrice: 2700.67, confidence: 66.8 },
      { date: ISODate("2026-03-12T11:30:46.315Z"), predictedPrice: 2692.44, confidence: 62.8 }
    ],
    trend: "Neutral",
    updatedAt: ISODate("2026-03-06T11:30:46.316Z")
  },
  {
    _id: ObjectId("69a910f20cadf6de30bf2ca3"),
    mandiId: "mh-raigad-alibagh-apmc",
    cropId: "rice",
    expiresAt: ISODate("2026-03-07T11:30:41.193Z"),
    generatedAt: ISODate("2026-03-06T11:30:41.193Z"),
    predictions: [
      { date: ISODate("2026-03-06T11:30:41.193Z"), predictedPrice: 2600, confidence: 90 },
      { date: ISODate("2026-03-07T11:30:41.193Z"), predictedPrice: 2600, confidence: 86 },
      { date: ISODate("2026-03-08T11:30:41.193Z"), predictedPrice: 2600, confidence: 82 },
      { date: ISODate("2026-03-09T11:30:41.193Z"), predictedPrice: 2600, confidence: 78 },
      { date: ISODate("2026-03-10T11:30:41.193Z"), predictedPrice: 2600, confidence: 74 },
      { date: ISODate("2026-03-11T11:30:41.193Z"), predictedPrice: 2600, confidence: 70 },
      { date: ISODate("2026-03-12T11:30:41.193Z"), predictedPrice: 2600, confidence: 66 }
    ],
    trend: "Neutral",
    updatedAt: ISODate("2026-03-06T11:30:41.193Z")
  },
  {
    _id: ObjectId("69a910f20cadf6de30bf2ca4"),
    cropId: "wheat",
    mandiId: "gj-gandhinagar-kalol-apmc",
    expiresAt: ISODate("2026-03-07T11:30:44.063Z"),
    generatedAt: ISODate("2026-03-06T11:30:44.063Z"),
    predictions: [
      { date: ISODate("2026-03-06T11:30:44.061Z"), predictedPrice: 2260, confidence: 87 },
      { date: ISODate("2026-03-07T11:30:44.061Z"), predictedPrice: 2270, confidence: 83 },
      { date: ISODate("2026-03-08T11:30:44.061Z"), predictedPrice: 2280, confidence: 79 },
      { date: ISODate("2026-03-09T11:30:44.061Z"), predictedPrice: 2290, confidence: 75 },
      { date: ISODate("2026-03-10T11:30:44.061Z"), predictedPrice: 2300, confidence: 71 },
      { date: ISODate("2026-03-11T11:30:44.061Z"), predictedPrice: 2310, confidence: 67 },
      { date: ISODate("2026-03-12T11:30:44.061Z"), predictedPrice: 2320, confidence: 63 }
    ],
    trend: "Bullish",
    updatedAt: ISODate("2026-03-06T11:30:44.063Z")
  }
])
```
