# Weave - Schematik Tasarım Editörü

<div align="center">

![Weave Logo](https://via.placeholder.com/150?text=Weave)

**Profesyonel Elektrik Şemaları ve PCB Tasarım Platformu**

[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)

[Demo](#) • [Dokümantasyon](#) • [Kurulum](#kurulum) • [Özellikler](#özellikler)

</div>

---

## 📖 Hakkında

Weave, elektrik şemaları ve devre tasarımı için geliştirilmiş profesyonel bir CAD uygulamasıdır. T-Ecosystem ailesinin tasarım uygulamasıdır.

### Neden Weave?

- 🎨 **Sezgisel Arayüz**: Modern ve kullanıcı dostu tasarım
- 🔌 **75+ Konnektör Tipi**: Endüstri standardı bağlantılar
- 📄 **Çoklu Sayfa**: Karmaşık projeler için sayfa sistemi
- 🔄 **Versiyon Kontrolü**: Tasarım geçmişi ve karşılaştırma
- 🔗 **Ekosistem Entegrasyonu**: UPH, ENV-I, Renderci, T-SA ile bağlantı

---

## ✨ Özellikler

### Şematik Çizim

- Drag & drop komponent yerleştirme
- Akıllı bağlantı çizimi
- Otomatik wire routing
- Grid ve snap sistemi

### Komponent Kütüphanesi

- 75+ konnektör tipi
- Özel komponent oluşturma
- Template import/export
- ENV-I stok entegrasyonu

### Sayfa Sistemi

- Çoklu sayfa desteği
- Sayfa düzenleme
- Cross-reference

### Bağlantı Stilleri

- Curved (eğri)
- Straight (düz)
- Orthogonal (dik açılı)
- Arrow head seçenekleri

### Port Sistemi

- Input/Output/Bidirectional
- Voltaj ve akım tanımlama
- Güç ve toprak işaretleme
- Özel renk atama

### Text ve Zone

- Serbest metin ekleme
- Bölge tanımlama
- Yorum ekleme

### Export Seçenekleri

- PDF export
- DXF export
- Netlist export
- BOM export
- KiCad export
- SPICE export

### Versiyon Kontrolü

- Otomatik kaydetme
- Versiyon geçmişi
- Versiyon karşılaştırma
- Geri yükleme

### Bulut Senkronizasyon

- Google Drive entegrasyonu
- Otomatik yedekleme
- Paylaşım

### Entegrasyonlar

- **UPH**: Proje dosyaları
- **ENV-I**: Komponent stok durumu
- **Renderci**: 3D görselleştirme
- **T-SA**: Şematik analiz

---

## 🛠️ Teknoloji Yığını

| Kategori   | Teknoloji               |
| ---------- | ----------------------- |
| Build Tool | Vite 5                  |
| Framework  | React 19                |
| Dil        | TypeScript 5            |
| Canvas     | Custom 2D Canvas        |
| State      | Zustand                 |
| Stil       | Tailwind CSS 4          |
| Animasyon  | Framer Motion           |
| Desktop    | Electron                |
| Cloud      | Firebase / Google Drive |

---

## 📦 Kurulum

### Gereksinimler

- Node.js 18+
- pnpm

### Adımlar

```bash
# Repo'yu klonla
git clone https://github.com/your-repo/Weave.git
cd Weave-main

# Bağımlılıkları yükle
pnpm install

# Geliştirme sunucusunu başlat
pnpm dev
```

### Electron (Desktop)

```bash
# Electron build
pnpm electron:build
```

---

## 📁 Proje Yapısı

```
Weave-main/
├── components/
│   ├── Canvas.tsx              # Ana çizim yüzeyi
│   ├── ProductEditor.tsx       # Komponent editörü
│   ├── LibraryBrowser.tsx      # Kütüphane gezgini
│   ├── PartLookupPanel.tsx     # Parça arama
│   ├── WelcomeScreen.tsx       # Karşılama ekranı
│   ├── canvas/                 # Canvas bileşenleri
│   ├── modals/                 # Modal bileşenleri
│   └── layout/                 # Layout bileşenleri
├── hooks/
│   ├── useAppShortcuts.ts      # Klavye kısayolları
│   ├── useCanvasView.ts        # Canvas kontrolü
│   ├── useHistory.ts           # Undo/Redo
│   ├── useCloudSync.ts         # Bulut senkron
│   └── useVersionControl.ts    # Versiyon kontrolü
├── services/
│   ├── cloudSyncService.ts     # Bulut servisi
│   ├── kicadExporter.ts        # KiCad export
│   ├── spiceExporter.ts        # SPICE export
│   └── versionService.ts       # Versiyon servisi
├── types/
│   ├── types.ts                # Ana tip tanımları
│   ├── library.ts              # Kütüphane tipleri
│   └── netlist.ts              # Netlist tipleri
├── utils/
│   ├── autoWire.ts             # Otomatik bağlantı
│   ├── bom-exporter.ts         # BOM export
│   ├── drc.ts                  # Design Rule Check
│   └── pathfinding.ts          # Yol bulma
├── electron/                   # Electron dosyaları
└── App.tsx                     # Ana uygulama
```

---

## 🔌 Konnektör Tipleri (75+)

### Analog Kamera

- Brigade VBV 4-Pin, 5-Pin
- Brigade Elite 4-Pin
- Backeye 360

### Endüstriyel

- M12 D-Coded (Ethernet)
- M12 A-Coded (Power)
- FAKRA (GPS, GSM, Video)

### Ağır Hizmet

- SP-7 Heavy Duty
- MDR 15-Pin

### Legacy / AV

- RCA, BNC

### Sensör

- Ultrasonic 2/3-Pin
- Deutsch DT04 serisi
- AMP Superseal

### Veri / CAN

- CAN Bus J1939
- OBD-II 16-Pin
- USB Type-A, Mini-B

### RF / Anten

- SMA, RP-SMA, TNC

### ECU / Panel

- Molex Mini-Fit, Micro-Fit
- JST XH, PH

---

## 🎨 Ekran Görünümü

```
┌─────────────────────────────────────────────────────────────┐
│ [Dosya▼] [Düzenle▼] [Görünüm▼] [Araçlar▼]   [Zoom] [Grid]   │
├───────────┬─────────────────────────────────────┬───────────┤
│           │                                     │           │
│ Komponent │          CANVAS                     │ Özellik   │
│ Paleti    │          (Çizim Alanı)              │ Paneli    │
│           │                                     │           │
│ ▼ Pasif   │     ┌─────┐      ┌─────┐           │ Seçili:   │
│   Direnç  │     │ U1  │──────│ R1  │           │ R1        │
│   Kond.   │     │     │      │10kΩ │           │           │
│ ▼ Yarıi.  │     └─────┘      └─────┘           │ Değer:    │
│   Diyot   │         │                          │ [10kΩ]    │
│   Trans.  │         │                          │           │
│ ▼ Konek.  │     ┌───┴───┐                      │ Stok: 45  │
│   Header  │     │  C1   │                      │           │
│   Term.   │     │100nF  │                      │           │
│           │     └───────┘                      │           │
├───────────┴─────────────────────────────────────┴───────────┤
│ X: 245, Y: 180 | Zoom: 100% | Grid: 10px | Sayfa 1/3        │
└─────────────────────────────────────────────────────────────┘
```

---

## ⌨️ Klavye Kısayolları

| Kısayol    | İşlev        |
| ---------- | ------------ |
| `Ctrl + S` | Kaydet       |
| `Ctrl + Z` | Geri al      |
| `Ctrl + Y` | İleri al     |
| `Ctrl + C` | Kopyala      |
| `Ctrl + V` | Yapıştır     |
| `Delete`   | Sil          |
| `Space`    | Pan modu     |
| `+` / `-`  | Zoom         |
| `G`        | Grid toggle  |
| `Esc`      | Seçimi iptal |

---

## 🔗 T-Ecosystem Entegrasyonu

```
┌─────────┐
│   UPH   │◄───── Proje dosyaları
└────┬────┘
     │
┌────▼────┐
│  Weave  │ ─────► Schematik tasarım (Merkez)
└────┬────┘
     │
┌────▼────┐
│  ENV-I  │◄───── Komponent stok
└─────────┘
     │
┌────▼────┐
│Renderci │◄───── 3D görselleştirme
└─────────┘
```

---

## 📄 Lisans

Bu proje özel lisans altındadır.

---

<div align="center">

**T-Ecosystem** tarafından ❤️ ile geliştirildi

</div>
