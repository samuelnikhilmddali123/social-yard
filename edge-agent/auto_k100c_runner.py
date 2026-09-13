#!/usr/bin/env python3
import asyncio
import sys
from bleak import BleakScanner, BleakClient

async def auto_run():
    print("=" * 65)
    print("🔌 K-1000C BLUETOOTH DIRECT CONNECT & TEST RUNNER")
    print("=" * 65)

    target = None
    while not target:
        print("🔍 Scanning for XB-Led-1BA1...")
        devices = await BleakScanner.discover(timeout=3.0)
        for d in devices:
            name = d.name or ""
            if "1BA1" in name.upper() or "XB" in name.upper():
                target = d
                print(f"🎯 FOUND: {d.name} [{d.address}]")
                break
        if not target:
            await asyncio.sleep(0.5)

    print(f"\n📡 Initiating Connection to {target.name}...")
    
    # Retry connection up to 3 times
    client = None
    for attempt in range(1, 4):
        try:
            print(f"   Connection attempt {attempt}...")
            client = BleakClient(target, timeout=12.0)
            await client.connect()
            if client.is_connected:
                print("   ✅ CONNECTED!")
                break
        except Exception as e:
            print(f"   ⚠️ Connection attempt {attempt} failed: {e}")
            await asyncio.sleep(1.0)

    if not client or not client.is_connected:
        print("❌ Could not establish connection.")
        return

    try:
        print("\n" + "=" * 65)
        print("📋 DISCOVERED SERVICES & CHARACTERISTICS:")
        print("=" * 65)

        writable_chars = []
        for s in client.services:
            print(f"\n📂 SERVICE: {s.uuid} ({s.description})")
            for c in s.characteristics:
                props = ", ".join(c.properties)
                print(f"   └── 📝 CHAR: {c.uuid} [{props}] ({c.description})")
                if "write" in c.properties or "write-without-response" in c.properties:
                    writable_chars.append(c)

        print("-" * 65)
        print(f"✨ Found {len(writable_chars)} Writable Characteristic(s):")
        for i, c in enumerate(writable_chars):
            print(f"   [{i}] {c.uuid}")
        print("-" * 65)

        if not writable_chars:
            print("❌ No writable characteristic found!")
            return

        tx = writable_chars[0]
        print(f"👉 Selected Active TX Characteristic: {tx.uuid}")

        async def send(pkt, name):
            data = bytearray(pkt)
            hex_str = " ".join(f"0x{b:02X}" for b in data)
            print(f"\n⚡ Sending [{name}]: [ {hex_str} ]")
            try:
                if "write-without-response" in tx.properties:
                    await client.write_gatt_char(tx.uuid, data, response=False)
                else:
                    await client.write_gatt_char(tx.uuid, data, response=True)
                print("   ✅ Sent successfully!")
            except Exception as e:
                try:
                    await client.write_gatt_char(tx.uuid, data, response=False)
                    print("   ✅ Sent with no-response!")
                except Exception as err:
                    print(f"   ❌ Write error: {err}")
            await asyncio.sleep(0.8)

        print("\n" + "=" * 65)
        print("🚀 RUNNING K-1000C TEST SEQUENCES (WATCH YOUR LIGHTS!)")
        print("=" * 65)

        # Test Sequence:
        print("\n--- PHASE 1: Built-In Programs ---")
        await send([0xA5, 0x05, 0x01, 0x00, 0x00, 0xAA, 0x5A], "Power ON / Play")
        await asyncio.sleep(1.0)

        await send([0xA5, 0x01, 0x00, 0x00, 0x00, 0xA6, 0x5A], "Built-In Program 1")
        await asyncio.sleep(2.0)

        await send([0xA5, 0x01, 0x01, 0x00, 0x00, 0xA7, 0x5A], "Built-In Program 2")
        await asyncio.sleep(2.0)

        await send([0xA5, 0x01, 0x02, 0x00, 0x00, 0xA8, 0x5A], "Built-In Program 3")
        await asyncio.sleep(2.0)

        print("\n--- PHASE 2: Direct RGB Scene Colors ---")
        await send([0xA5, 0x04, 255, 0, 0, (0xA5+4+255)&0xFF, 0x5A], "Scene RED (0xA5)")
        await asyncio.sleep(2.0)

        await send([0xA5, 0x04, 0, 255, 0, (0xA5+4+255)&0xFF, 0x5A], "Scene GREEN (0xA5)")
        await asyncio.sleep(2.0)

        await send([0xA5, 0x04, 0, 0, 255, (0xA5+4+255)&0xFF, 0x5A], "Scene BLUE (0xA5)")
        await asyncio.sleep(2.0)

        print("\n--- PHASE 3: Speed Tests ---")
        await send([0xA5, 0x02, 0x14, 0x00, 0x00, (0xA5+2+0x14)&0xFF, 0x5A], "Speed 20 (Fast)")
        await asyncio.sleep(1.5)

        await send([0xA5, 0x02, 0x04, 0x00, 0x00, (0xA5+2+0x04)&0xFF, 0x5A], "Speed 4 (Normal)")
        await asyncio.sleep(1.5)

        print("\n" + "=" * 65)
        print("🎉 TEST COMPLETED! Entering Interactive Control Mode...")
        print("=" * 65)

        while True:
            cmd = input("\nEnter [1: Red, 2: Green, 3: Blue, p: Next Prog, q: Quit]: ").strip().lower()
            if cmd == "1":
                await send([0xA5, 0x04, 255, 0, 0, (0xA5+4+255)&0xFF, 0x5A], "Scene RED")
            elif cmd == "2":
                await send([0xA5, 0x04, 0, 255, 0, (0xA5+4+255)&0xFF, 0x5A], "Scene GREEN")
            elif cmd == "3":
                await send([0xA5, 0x04, 0, 0, 255, (0xA5+4+255)&0xFF, 0x5A], "Scene BLUE")
            elif cmd == "p":
                await send([0xA5, 0x01, 0x01, 0x00, 0x00, 0xA7, 0x5A], "Built-In Prog 2")
            elif cmd == "q":
                break

    finally:
        await client.disconnect()
        print("Disconnected cleanly.")

if __name__ == "__main__":
    try:
        asyncio.run(auto_run())
    except KeyboardInterrupt:
        print("\nExited.")
    except Exception as e:
        print(f"\n❌ Error: {e}")
