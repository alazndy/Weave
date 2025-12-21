# T-Weave Wiki

T-Weave, TEK Ekosistemi'nin görsel tasarım motorudur. Donanım bileşenlerini ve aralarındaki bağlantıları görselleştirmek, organize etmek ve yönetmek için kullanılır.

## 📚 İçindekiler

- [Mimari Genel Bakış](#mimari-genel-bakış)
- [Kanvas Sistemi](#kanvas-sistemi)
- [AI Özellikleri](#ai-özellikleri)
- [API Referansı](#api-referansı)
- [Ekosistem Entegrasyonu](#ekosistem-entegrasyonu)

---

## Mimari Genel Bakış

### Sistem Mimarisi

```
┌─────────────────────────────────────────────────────────────────┐
│                       T-Weave Frontend                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Canvas (SVG Based)                       │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │ │
│  │  │ProductNode│ │Connection│ │  Zone    │ │  Comments    │   │ │
│  │  │  (Devices)│ │  Lines   │ │ (Areas)  │ │  (Notes)     │   │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │ │
│  └────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                       AI Services                                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │
│  │  DRC Engine  │ │  AutoWire    │ │  Gemini Copilot          │ │
│  │  (Validation)│ │ (Smart Link) │ │  (Context-Aware AI)      │ │
│  └──────────────┘ └──────────────┘ └──────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                       Utilities                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │
│  │  Pathfinding │ │  BOM Export  │ │  Doc Generator           │ │
│  │  (A* Algo)   │ │  (jsPDF)     │ │  (Markdown)              │ │
│  └──────────────┘ └──────────────┘ └──────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                       State Layer                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  App.tsx (Main State)                     │   │
│  │   pages[] | templates[] | connections[] | instances[]     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Kanvas Sistemi

### Bileşen Türleri

| Bileşen        | Dosya                                  | Açıklama                     |
| -------------- | -------------------------------------- | ---------------------------- |
| ProductNode    | `components/canvas/ProductNode.tsx`    | Cihaz/bileşen görselleştirme |
| ConnectionLine | `components/canvas/ConnectionLine.tsx` | Kablo/bağlantı çizimi        |
| ZoneNode       | `components/canvas/ZoneNode.tsx`       | Bölge/alan tanımlama         |
| CommentMarker  | `components/canvas/CommentMarker.tsx`  | Not/yorum işaretleri         |
| DRCOverlay     | `components/canvas/DRCOverlay.tsx`     | DRC uyarı gösterimi          |
| AutoWirePanel  | `components/canvas/AutoWirePanel.tsx`  | Akıllı bağlantı önerileri    |

### Bağlantı Tipleri

```typescript
type ConnectionShape = "curved" | "straight" | "orthogonal";
type LineStyle = "solid" | "dashed" | "dotted";
```

### Konnektör Türleri (74+ tip)

- **Analog Kamera**: VBV, Elite, Backeye 360
- **Endüstriyel**: M12, FAKRA, Deutsch
- **Veri/İletişim**: USB, D-Sub, CAN Bus
- **Güç**: Flying Lead, Terminal Block
- **RF/Anten**: SMA, TNC

---

## AI Özellikleri

### 1. Gerçek Zamanlı DRC (Design Rule Check)

**Dosya:** `utils/drc.ts`

Kontrol Edilen Kurallar:

- ⚡ Voltaj uyumsuzluğu (3.3V ↔ 5V)
- 🔌 Konnektör tipi uyumsuzluğu
- 🔄 AC/DC güç tipi kontrolü
- ↔️ Yön çakışması (input↔input)

### 2. Akıllı Oto-Kablolama

**Dosya:** `utils/autoWire.ts`

Pin Grupları:

- I2C: SDA, SCL
- SPI: MOSI, MISO, SCLK, CS
- UART: TX, RX
- Power: VCC, GND, 3V3, 5V
- CAN: CANH, CANL

### 3. Gemini AI Copilot

**Dosya:** `services/geminiService.ts`

Fonksiyonlar:

- `analyzeSchematic()` - Şematik analizi
- `extractPartListFromImage()` - BOM görüntü çıkarma
- `askCopilot()` - Bağlam farkındalıklı soru-cevap
- `suggestConnectionsAI()` - AI bağlantı önerisi
- `suggestDecouplingCaps()` - Dekuplaj kapasitörü önerisi

### 4. Otomatik Dokümantasyon

**Dosya:** `utils/docGenerator.ts`

Oluşturulan İçerik:

- BOM tablosu
- Bağlantı matrisi
- Konnektör listesi
- Teknik notlar

---

## API Referansı

### Kanvas Yardımcıları

```typescript
// utils/canvasHelpers.ts
getPortPosition(instance, template, portId): Point
getPortNormal(instance, template, portId): Point
getRoutePath(start, end, shape, controlPoints): string
validatePortCompatibility(fromPort, toPort): string[]
```

### Pathfinding

```typescript
// utils/pathfinding.ts
findSmartPath(start, end, startNormal, endNormal, obstacles): Point[]
```

### DRC

```typescript
// utils/drc.ts
runDRC(connections, instances, templates): DRCResult
checkConnectionValidity(fromPort, toPort): { valid: boolean; issues: string[] }
```

### AutoWire

```typescript
// utils/autoWire.ts
suggestConnections(newInstanceId, instances, templates, connections): WiringSuggestion[]
suggestPowerConnections(instances, templates, connections): WiringSuggestion[]
```

---

## Ekosistem Entegrasyonu

### T-Weave → ENV-I

```
Weave Template → Firebase Storage → ENV-I Product
```

- Şablon görüntüsü yükleme
- Ürün kaydı oluşturma
- Stok bağlama

### T-Weave → T-HUB

```
Weave Design → Export BOM → UPH Project → Cost Calculation
```

- BOM otomatik oluşturma
- Proje dosyası olarak kaydetme
- Tasarım önizleme

---

## Geliştirici Kılavuzu

### Yeni Bileşen Ekleme

1. `types.ts`'de `ConnectorType`'a ekle
2. `CONNECTOR_LABELS`'a açıklama ekle
3. `getConnectorShapeClass()`'a stil ekle

### Yeni AI Özelliği Ekleme

1. `services/geminiService.ts`'e fonksiyon ekle
2. JSON schema ile yapılandırılmış çıktı tanımla
3. UI bileşeninden çağır

### Test

```bash
pnpm test          # Unit testleri çalıştır
pnpm dev           # Geliştirme sunucusu (localhost:3004)
pnpm build         # Production build
```
