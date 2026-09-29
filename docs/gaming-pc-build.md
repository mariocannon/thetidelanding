# Gaming PC Build Spec

Built around the parts already owned: an **NVIDIA GeForce RTX 3070 (8 GB)** and **4 × 16 GB DDR4 (64 GB)**.

## What the owned parts decide

- **DDR4 means an AM4 (AMD) or DDR4 Intel LGA1700 platform.** AM5 and Intel Core Ultra (LGA1851) are DDR5-only, so the RAM would have to be replaced. With DRAM prices high in 2026, keeping 64 GB of DDR4 is a real saving.
- **RTX 3070** is a 1440p card (or high-refresh 1080p). It draws about 220 W and uses PCIe 4.0 with 1–2 × 8-pin power, depending on the model. Its 8 GB of VRAM is the limit in newer games, not the CPU. Expect to lower texture settings in some 2024+ titles.
- **Four DIMMs** put more load on the memory controller. Expect DDR4-3200 to 3600 stable with all four slots filled. Enable XMP/DOCP. If it won't boot, drop one speed step.

## Recommended build (AM4, best value)

| Part | Pick | Why | Alternatives |
|---|---|---|---|
| CPU | **AMD Ryzen 7 5700X3D** | Its 3D V-Cache makes it the fastest DDR4 gaming CPU for the money, and it runs cool | Ryzen 7 5800X3D (used), Ryzen 7 5700X (cheaper, about 10–15% slower in games) |
| CPU cooler | **Thermalright Peerless Assassin 120 SE** | Quiet dual-tower air cooler, more than enough for a 105 W part | Arctic Freezer 36, DeepCool AK400 |
| Motherboard | **MSI MAG B550 Tomahawk (MAX)** | Strong VRMs, 4 DIMM slots, 2 × M.2, 2.5 GbE, BIOS Flashback | ASUS TUF B550-Plus WiFi II, Gigabyte B550 Aorus Elite AX V2 |
| RAM | **Owned: 4 × 16 GB DDR4** | 64 GB is plenty | — |
| GPU | **Owned: RTX 3070** | — | — |
| Boot / game SSD | **2 TB NVMe PCIe 4.0**, e.g. WD Black SN850X, Samsung 990 EVO Plus, or Crucial T500 | Fast loads. Games take 100–150 GB each | Add a 2nd 2 TB NVMe later |
| Power supply | **750 W 80+ Gold, ATX 3.x, fully modular**, e.g. Corsair RM750e, MSI MAG A750GL, or be quiet! Pure Power 12 | About 2× the system's ~400 W draw, quiet, and leaves room for a GPU upgrade | 850 W if a 4080/5080-class GPU is planned |
| Case | **Lian Li Lancool 216** | Good airflow, 2 × 160 mm front fans included, fits large GPUs and coolers | Fractal Design Pop Air, Phanteks XT Pro, Corsair 4000D Airflow |
| OS | Windows 11 Home | Needs TPM, which the board's fTPM provides. Windows is required: iRacing's anti-cheat doesn't run on Linux | — |
| Wi-Fi (optional) | Onboard if the board has it. Otherwise a PCIe AX210 card | — | — |

**Estimated system power:** about 400 W under gaming load (3070 ~220 W plus CPU ~100 W plus the rest).

## Alternative: Intel with DDR4

Choose this for more multi-core performance (streaming or productivity) while keeping the RAM.

| Part | Pick |
|---|---|
| CPU | Intel Core i5-14600K (or 13600K) |
| Motherboard | **DDR4** B760 or Z790 board, e.g. MSI PRO Z790-P WiFi **DDR4**. Check that "DDR4" is in the model name |
| Cooler | Thermalright Peerless Assassin 120 SE or a 240 mm AIO |

Notes: update the BIOS right away to get Intel's 0x12B+ microcode fix for 13th/14th-gen stability. Gaming performance is about the same as the 5700X3D, with higher power draw and a higher platform cost.

## Intel budget option: i5-12400F + B760M

A cheaper build that also keeps the owned RAM and GPU.

| Part | Pick | Notes |
|---|---|---|
| CPU | **Intel Core i5-12400F** (BX8071512400F) | 6 cores / 12 threads. The F model has **no integrated graphics**, so plug the monitor into the RTX 3070. 12th gen, so the 13th/14th-gen degradation issue doesn't apply |
| Motherboard | **MSI B760M GAMING PLUS WIFI DDR4** | Micro-ATX, 4 × DDR4 slots, 2 × M.2, Wi-Fi 6E, 2.5 GbE. Supports 12th gen out of the box. Make sure the model name includes **DDR4** |
| CPU cooler | **Thermalright Assassin X 120 Refined SE** | The included Intel cooler works but gets loud. Get the Peerless Assassin 120 SE instead if a 14600K upgrade is planned |
| RAM / GPU | Owned | Enable XMP |
| SSD, PSU, case, OS | Same as the recommended build | 650 W Gold is enough for this build (~350 W load). Keep 750 W for GPU upgrade headroom. Every case listed fits micro-ATX |

**How it compares to the 5700X3D build:**

| | i5-12400F + B760M | Ryzen 7 5700X3D + B550 |
|---|---|---|
| WoW raids and cities | Good | Noticeably better (roughly 20–40% more fps in the busiest scenes) |
| iRacing, one monitor | Great | Great, higher fps floor |
| iRacing, triples or VR | Limited by the 3070 either way | Same |
| Upgrade path | Better: 13th/14th-gen CPUs (e.g. i5-14600K) drop in after a BIOS update | AM4 has no faster CPUs coming |

## NZD price estimate (September 2026)

Prices are the best listed NZ prices found (incl. GST) and move weekly. Check PriceSpy NZ or PB Tech before buying.

| Part | AMD build | NZD | Intel build | NZD |
|---|---|---|---|---|
| CPU | Ryzen 7 5700X3D | ~$460 ¹ | Core i5-12400F | ~$220–270 |
| Motherboard | MSI MAG B550 Tomahawk MAX WiFi | ~$300–360 | MSI B760M Gaming Plus WiFi DDR4 | ~$235 |
| CPU cooler | Peerless Assassin 120 SE | ~$65–80 | Assassin X 120 Refined SE | ~$49 |
| SSD | Samsung 990 EVO Plus 2 TB | ~$369 | Same | ~$369 |
| PSU | Corsair RM750e | ~$160–205 | Same | ~$160–205 |
| Case | Lian Li Lancool 216 | ~$155–185 | Same | ~$155–185 |
| RAM + GPU | Owned | $0 | Owned | $0 |
| **Subtotal (hardware)** | | **~$1,510–1,660** | | **~$1,190–1,310** |
| Windows 11 Home (OEM) | | ~$250 | | ~$250 |
| **Total** | | **~$1,760–1,910** | | **~$1,440–1,560** |

¹ The 5700X3D is scarce in NZ (seen at about $459 at VRC; many stores are out of stock). The 5800X3D costs more (about $690 at PB Tech in mid-2026) and isn't worth the extra over the Intel build.

Ways to save on either build: skip the aftermarket cooler on the Intel build (−$49, louder), use a 650 W PSU (about −$30), or start with a 1 TB SSD (about −$150).

## Budget tiers (CPU + board + cooler + SSD + PSU + case)

| Tier | Changes |
|---|---|
| Budget | Ryzen 5 5600 or 5700X, B550M board (MSI B550M PRO-VDH), 1 TB NVMe, 650 W Gold, Montech AIR 903 or Phanteks XT Pro |
| **Recommended** | Table above |
| Future-proof | Skip AM4. Sell the DDR4, then go AM5 + Ryzen 7 9800X3D + 32 GB DDR5-6000. Only worth it with a GPU upgrade too |

Prices move quickly (DRAM and SSD prices especially in 2026). Check PCPartPicker for current prices and compatibility before buying.

## Build and setup checklist

1. Update the motherboard BIOS first. B550 boards need a recent BIOS for 5700X3D support, and the Tomahawk MAX has BIOS Flashback, so no CPU is needed for the update.
2. Install RAM in all four slots. Enable **XMP/DOCP** and test stability (MemTest86 or TestMem5).
3. Mount the NVMe in the top M.2 slot, which is CPU-connected PCIe 4.0.
4. Power the GPU with **separate** PCIe cables from the PSU, not one daisy-chained cable.
5. Enable **Resizable BAR** (Above 4G Decoding + ReBAR) in the BIOS.
6. Install the AMD chipset drivers and the latest NVIDIA driver. Turn on DLSS in supported games.
7. Set a fan curve. Front fans are intake, rear/top fans are exhaust.

## Upgrade path

- **GPU is the next upgrade.** A 5700X3D can drive up to about an RTX 5070 Ti / RX 9070 XT-class card at 1440p without a major bottleneck. The 750 W PSU covers that.
- After that, move to AM5 and DDR5 when the platform as a whole is due.
