#!/usr/bin/env python3
import asyncio
import sys
from bleak import BleakClient, BleakScanner

UUID_FFF2 = "0000fff2-0000-1000-8000-00805f9b34fb"
UUID_AE01 = "0000ae01-0000-1000-8000-00805f9b34fb"

async def fuzz():
    print("=" * 65)
    print("🚀 K-1000C (XB-Led-1BA1) MASTER PROTOCOL FUZZER")
    print("=" * 65)

    target = None
    while not target:
        print("🔍 Searching for XB-Led-1BA1 in the air...")
        devices = await BleakScanner.discover(timeout=4.0)
        for d in devices:
            name = d.name or ""
            if "1BA1" in name.upper() or "XB" in name.upper():
                target = d
                break
        if not target:
            await asyncio.sleep(0.5)

    print(f"🎯 Acquired: {target.name} [{target.address}]. Connecting...")
    async with BleakClient(target, timeout=12.0) as client:
        print(f"✅ Connected: {client.is_connected}")

        # Listen for any reply packets
        for s in client.services:
            for c in s.characteristics:
                if "notify" in c.properties or "indicate" in c.properties:
                    try:
                        await client.start_notify(c.uuid, lambda s, d: print(f"  📥 [REPLY from {s.uuid[:8]}]: {[hex(x) for x in d]}"))
                    except: pass

        async def send_pkt(pkt, desc):
            data = bytearray(pkt)
            hex_str = " ".join(f"0x{b:02X}" for b in data)
            print(f"⚡ Testing [{desc:28}]: [ {hex_str} ]")
            try:
                await client.write_gatt_char(UUID_FFF2, data, response=False)
            except: pass
            try:
                await client.write_gatt_char(UUID_AE01, data, response=False)
            except: pass
            await asyncio.sleep(0.5)

        # 1. Standard Program selection frames
        for p in range(1, 4):
            await send_pkt([0xA5, 0x01, p, 0x00, 0x00, (0xA5+1+p)&0xFF, 0x5A], f"A5 Prog {p}")
            await send_pkt([0x55, 0xAA, 0x01, 0x01, p, (0x55+0xAA+1+1+p)&0xFF], f"55AA Prog {p}")
            await send_pkt([0xAA, 0x01, p, 0x00, 0xFF], f"AA Prog {p}")
            await send_pkt([0x7E, 0x00, 0x03, p, 0x64, 0x00, 0x00, 0x00, 0xEF], f"7E Prog {p}")
            await send_pkt([0xBB, p, 0x14, 0x44], f"BB Prog {p}")

        # 2. RGB Direct frames
        await send_pkt([0xA5, 0x04, 0xFF, 0x00, 0x00, (0xA5+4+255)&0xFF, 0x5A], "A5 Red")
        await send_pkt([0xA5, 0x04, 0x00, 0xFF, 0x00, (0xA5+4+255)&0xFF, 0x5A], "A5 Green")
        await send_pkt([0xA5, 0x04, 0x00, 0x00, 0xFF, (0xA5+4+255)&0xFF, 0x5A], "A5 Blue")
        
        await send_pkt([0x7E, 0x00, 0x05, 0x03, 0xFF, 0x00, 0x00, 0x00, 0xEF], "7E Type A Red")
        await send_pkt([0x7E, 0x04, 0x05, 0x03, 0xFF, 0x00, 0x00, 0xFF, 0x00, 0xEF], "7E Type B Red")
        await send_pkt([0x7E, 0x07, 0x05, 0x03, 0xFF, 0x00, 0x00, 0x00, 0xEF], "7E Type C Red")

        await send_pkt([0x56, 0xFF, 0x00, 0x00, 0x00, 0xF0, 0xAA], "56 Type A Red")
        await send_pkt([0x56, 0xFF, 0x00, 0x00, 0x00, 0x0F, 0xAA], "56 Type B Red")
        await send_pkt([0x38, 0xFF, 0x00, 0x00, 0xAA], "38 Red")
        await send_pkt([0xAA, 0x01, 0xFF, 0x00, 0x00, 0xFF], "AA Red")

        # 3. Mode / Power / Chip Frames
        await send_pkt([0xA5, 0x05, 0x01, 0x00, 0x00, 0xAB, 0x5A], "A5 Play")
        await send_pkt([0x7E, 0x04, 0x04, 0xF0, 0x00, 0x01, 0xFF, 0x00, 0xEF], "7E Play")
        await send_pkt([0xCC, 0x23, 0x33], "CC Play")

        print("\n" + "=" * 65)
        print("✅ ALL PACKET PATTERNS SENT.")
        print("=" * 65)

if __name__ == "__main__":
    asyncio.run(fuzz())
