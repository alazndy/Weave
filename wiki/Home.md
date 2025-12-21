# T-Weave Wiki

Hoş geldiniz! Bu wiki, T-Weave şematik tasarım motorunun kapsamlı dokümantasyonunu içerir.

## 📚 İçindekiler

- [[Mimari|Architecture]]
- [[Kanvas Sistemi|Canvas-System]]
- [[AI Özellikleri|AI-Features]]
- [[Konnektör Tipleri|Connector-Types]]
- [[API Referansı|API-Reference]]
- [[Ekosistem|Ecosystem]]

---

## Hızlı Başlangıç

```bash
git clone https://github.com/alazndy/Weave.git
cd Weave-main
pnpm install
pnpm dev
```

Uygulama `http://localhost:3004` adresinde çalışacak.

---

## Mimari Genel Bakış

```
┌─────────────────────────────────────────────────────────────────┐
│                       T-Weave Frontend                           │
│                    Canvas (SVG Based)                            │
│     ProductNode │ ConnectionLine │ ZoneNode │ DRCOverlay        │
├─────────────────────────────────────────────────────────────────┤
│                       AI Services                                │
│      DRC Engine │ AutoWire │ Gemini Copilot │ Doc Generator     │
├─────────────────────────────────────────────────────────────────┤
│                       Utilities                                  │
│      Pathfinding (A*) │ BOM Export │ Image Compressor           │
├─────────────────────────────────────────────────────────────────┤
│                       State Layer                                │
│                  App.tsx (Main State)                            │
│     pages[] │ templates[] │ connections[] │ instances[]         │
└─────────────────────────────────────────────────────────────────┘
```

---

## AI Özellikleri

### 🔍 Gerçek Zamanlı DRC

- Voltaj uyumsuzluğu tespiti
- Konnektör tipi kontrolü
- AC/DC güç tipi doğrulama

### 🔌 Akıllı Oto-Kablolama

- I2C: SDA ↔ SDA, SCL ↔ SCL
- SPI: MOSI, MISO, SCLK, CS
- Power: VCC, GND, 3V3, 5V

### 🤖 Gemini Copilot

- Bağlam farkındalıklı soru-cevap
- AI destekli bağlantı önerisi
- Dekuplaj kapasitörü önerisi

### 📄 Otomatik Dokümantasyon

- BOM tablosu
- Bağlantı matrisi
- Teknik notlar

---

## Konnektör Türleri (74+)

| Kategori      | Örnekler                    |
| ------------- | --------------------------- |
| Analog Kamera | VBV, Elite, Backeye 360     |
| Endüstriyel   | M12, FAKRA, Deutsch         |
| Veri/İletişim | USB, D-Sub, CAN Bus         |
| Güç           | Flying Lead, Terminal Block |
| RF/Anten      | SMA, TNC                    |
