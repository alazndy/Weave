# Weave - Sistem Bağlantı Tasarım Platformu

<div align="center">

![Weave Logo](https://via.placeholder.com/150?text=Weave)

**Fiziksel Ürün Bağlantı ve Sistem Tasarım Platformu**

[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)

[Demo](#) • [Dokümantasyon](#) • [Kurulum](#kurulum) • [Özellikler](#özellikler)

</div>

---

## 📖 Hakkında

Weave, **sistem seviyesinde bağlantı tasarım platformudur**. PCB veya devre tasarımı değil, fiziksel ürünlerin (kameralar, monitörler, sensörler, kontrol üniteleri) birbirine nasıl bağlanacağını tasarlamak için kullanılır.

### Neden Weave?

- 🔌 **75+ Konnektör Tipi**: Endüstri standardı bağlantı tipleri
- 📦 **Ürün Tarama**: ENV-I'den ürün çekme ve port tanımlama
- 🎨 **Görsel Tasarım**: Sürükle-bırak ile sistem şeması oluşturma
- 📄 **BOM Oluşturma**: Otomatik malzeme listesi
- 🔗 **Ekosistem Entegrasyonu**: ENV-I stok kontrolü, UPH dosya kaydetme

---

## 🎯 Ne Yapıyor?

```
┌─────────────────────────────────────────────────────────────┐
│  1. ÜRÜN TANIMLAMA                                          │
│     • Ürün görselini yükle veya ENV-I'den çek              │
│     • Port noktalarını işaretle (Video Out, Power In...)   │
│     • Konnektör tiplerini belirle (VBV, M12, FAKRA...)     │
│                                                             │
│  2. SİSTEM TASARIMI                                        │
│     • Ürünleri canvas'a yerleştir                          │
│     • Port'lar arası bağlantı çiz                          │
│     • Kablo tipleri ve renkleri seç                        │
│                                                             │
│  3. DOKÜMANTASYON                                          │
│     • Otomatik BOM (malzeme listesi)                       │
│     • Teknik şema PDF export                               │
│     • Müşteri sunumu için görsel                           │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ Özellikler

### Ürün Tarama ve Tanımlama

- ENV-I envanterinden ürün import
- Görsel yükleme ve boyutlandırma
- Port noktası işaretleme
- 75+ konnektör tipi seçimi
- Stok durumu senkronizasyonu

### Port Sistemi

- Input/Output/Bidirectional tipler
- Voltaj ve akım tanımlama
- Güç/toprak işaretleme
- Özel renk atama
- Konnektör tipi seçimi

### Bağlantı Yönetimi

- Curved/Straight/Orthogonal stiller
- Kablo renk seçimi
- Etiketleme
- Arrow head seçenekleri

### Çoklu Sayfa

- Karmaşık sistemler için sayfa sistemi
- Sayfa düzenleme ve sıralama
- Cross-reference

### Export

- PDF teknik şema
- BOM (malzeme listesi)
- PNG/SVG görsel
- KiCad/SPICE export

### Entegrasyonlar

- **ENV-I**: Ürün import, stok kontrolü
- **UPH**: Proje dosyası kaydetme
- **Renderci**: 3D görselleştirme

---

## 🔌 Desteklenen Konnektörler

| Kategori         | Örnekler                                |
| ---------------- | --------------------------------------- |
| **Araç Kamera**  | VBV 4-Pin, Elite 4-Pin, Backeye 360     |
| **Endüstriyel**  | M12 D-Coded, M12 A-Coded 5/8-Pin        |
| **Araç (FAKRA)** | GPS (Mavi), GSM (Mor), Video (Yeşil)    |
| **Heavy Duty**   | SP-7, MDR 15-Pin                        |
| **Sensör**       | Ultrasonic, Deutsch DT04 serisi         |
| **Güç**          | Flying Lead, Ring Terminal, Fuse Holder |
| **Veri**         | CAN Bus, OBD-II, USB                    |

---

## 🛠️ Teknoloji Yığını

| Kategori   | Teknoloji        |
| ---------- | ---------------- |
| Build Tool | Vite 5           |
| Framework  | React 19         |
| Dil        | TypeScript 5     |
| Canvas     | Custom 2D Canvas |
| State      | Zustand          |
| Stil       | Tailwind CSS 4   |
| Desktop    | Electron         |

---

## 📦 Kurulum

```bash
cd Weave-main
pnpm install
pnpm dev
```

**Port**: 5173

---

## 🎨 Örnek Kullanım

**Senaryo**: TIR için 360° kamera sistemi tasarımı

1. Ürünleri tanımla (4 kamera, 1 monitör, 1 kayıt ünitesi)
2. Her ürünün port'larını yapılandır
3. Canvas'a yerleştir ve bağlantıları çiz
4. BOM ve PDF export

---

## 🔗 T-Ecosystem Entegrasyonu

```
ENV-I (Stok) ──► Weave (Tasarım) ──► UPH (Proje)
     │                 │
     └──── Stok ◄──────┘
```

---

<div align="center">

**T-Ecosystem** tarafından ❤️ ile geliştirildi

</div>
