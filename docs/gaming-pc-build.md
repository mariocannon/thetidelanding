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
| OS | Windows 11 Home | Needs TPM, which the board's fTPM provides | Linux (SteamOS-like distros, e.g. Bazzite) |
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
