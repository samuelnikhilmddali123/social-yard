#!/usr/bin/env python3
import asyncio
import sys
from bleak import BleakScanner, BleakClient

async def auto_run():
    print("=" * 65)
    print("🔌 K-1000C BLUETOOTH AUTODETECT & TEST RUNNER")
    print("=" * 65)
    print("👉 ACTION NEEDED: Unplug power from K-1000C and plug it back in")
    print("   (This reboots the Bluetooth chip into pairing mode)")
    print("=" * 65)

    target = None
    seen_addresses = set()

    while not target:
        devices = await BleakScanner.discover(timeout=2.0)
        for d in devices:
            name = d.name or ""
            addr = d.address
            if addr not in seen_addresses:
                print(f"📡 Found: {name or '(Unnamed)'} [{addr}]")
                seen_addresses.add(addr)

            if "1BA1" in name.upper() or "XB" in name.upper() or "K100" in name.upper() or "XINBO" in name.upper() or "LED" in name.upper():
                target = d
                break
        await asyncio.sleep(0.2)

    print(f"\n🎉 TARGET ACQUIRED: {target.name} ({target.address})")
    print("📡 Connecting to K-1000C...")

    async with BleakClient(target.address, timeout=10.0) as client:
        print(f"✅ CONNECTED: {client.is_connected}")
        print("\n📋 SERVICES & CHARACTERISTICS FOUND:")
        
        all_tx = []
        for s in client.services:
            print(f"\n📂 Service: {s.uuid}")
            for c in s.characteristics:
                props = ", ".join(c.properties)
                print(f"   └── 📝 Char: {c.uuid} [{props}]")
                if "write" in c.properties or "write-without-response" in c.properties:
                    all_tx.append(c)

        if not all_tx:
            print("❌ No writable characteristic found!")
            return

        tx = all_tx[0]
        print(f"\n🎯 SELECTED TX CHARACTERISTIC: {tx.uuid}")

        async def send(pkt, name):
            data = bytearray(pkt)
            hex_str = " ".join(f"0x{b:02X}" for b in data)
            print(f"\n⚡ Sending [{name}]: [ {hex_str} ]")
            try:
                if "write-without-response" in tx.properties:
                    await client.write_gatt_char(tx.uuid, data, response=False)
                else:
                    await client.write_gatt_char(tx.uuid, data, response=True)
                print("   ✅ Packet sent successfully!")
            except Exception as e:
                try:
                    await client.write_gatt_char(tx.uuid, data, response=False)
                    print("   ✅ Packet sent with no-response mode!")
                except Exception as err:
                    print(f"   ❌ Failed: {err}")
            await asyncio.sleep(1.0)

        print("\n" + "=" * 65)
        print("🚀 EXECUTING TEST SUITE (WATCH YOUR LED STRIP NOW!)")
        print("=" * 65)

        # 1. Power ON / Play
        await send([0xA5, 0x05, 0x01, 0x00, 0x00, 0xAA, 0x5A], "Play / Power ON")
        await asyncio.sleep(1.0)

        # 2. Built-In Program 1
        await send([0xA5, 0x01, 0x00, 0x00, 0x00, 0xA6, 0x5A], "Built-In Program 1")
        await asyncio.sleep(2.0)

        # 3. Built-In Program 2
        await send([0xA5, 0x01, 0x01, 0x00, 0x00, 0xA7, 0x5A], "Built-In Program 2")
        await asyncio.sleep(2.0)

        # 4. Built-In Program 3
        await send([0xA5, 0x01, 0x02, 0x00, 0x00, 0xA8, 0x5A], "Built-In Program 3")
        await asyncio.sleep(2.0)

        # 5. Scene Solid RED
        await send([0xA5, 0x04, 255, 0, 0, (0xA5+4+255)&0xFF, 0x5A], "Scene RED")
        await asyncio.sleep(2.0)

        # 6. Scene Solid GREEN
        await send([0xA5, 0x04, 0, 255, 0, (0xA5+4+255)&0xFF, 0x5A], "Scene GREEN")
        await asyncio.sleep(2.0)

        # 7. Scene Solid BLUE
        await send([0xA5, 0x04, 0, 0, 255, (0xA5+4+255)&0xFF, 0x5A], "Scene BLUE")
        await asyncio.sleep(2.0)

        # 8. Alternate 55-AA Program 1
        await send([0x55, 0xAA, 0x01, 0x01, 0x00, 0x01], "55-AA Program 1")
        await asyncio.sleep(1.5)

        # 9. Alternate 7E Program 1
        await send([0x7E, 0x00, 0x03, 0x01, 0x64, 0x00, 0x00, 0x00, 0xEF], "7E Program 1")
        await asyncio.sleep(1.5)

        print("\n" + "=" * 65)
        print("🏁 AUTOMATED TEST CYCLE COMPLETE!")
        print("=" * 65)

if __name__ == "__main__":
    try:
        asyncio.run(auto_run())
    except KeyboardInterrupt:
        print("\nStopped.")
    except Exception as e:
        print(f"\n❌ Error: {e}")
