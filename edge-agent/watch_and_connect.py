#!/usr/bin/env python3
import asyncio
import sys
from bleak import BleakScanner, BleakClient

async def watch():
    print("=" * 65)
    print("👀 WAITING FOR 'XB-Led-1BA1' TO BECOME AVAILABLE...")
    print("=" * 65)
    print("⚠️ PLEASE GO TO IPHONE SETTINGS -> BLUETOOTH -> TURN OFF")
    print("   (Also close/disconnect the Chrome tester tab)")
    print("=" * 65)

    target_device = None
    
    while not target_device:
        print("\r🔍 Scanning for XB-Led...", end="", flush=True)
        devices = await BleakScanner.discover(timeout=2.0)
        for d in devices:
            name = d.name or ""
            if "1BA1" in name.upper() or "XB-LED" in name.upper() or "XINBO" in name.upper():
                target_device = d
                break
        await asyncio.sleep(0.5)

    print(f"\n\n🎉 FOUND IT! Device: {target_device.name} [{target_device.address}]")
    print("📡 Connecting to K-1000C controller...")

    async with BleakClient(target_device.address) as client:
        print(f"✅ CONNECTED: {client.is_connected}")
        print("\n📋 GATT TABLE DUMP:")
        for s in client.services:
            print(f"\n📂 Service: {s.uuid}")
            for c in s.characteristics:
                print(f"   └── 📝 Char: {c.uuid} [{', '.join(c.properties)}]")

        # Find RX/TX pipe
        tx_char = None
        for s in client.services:
            for c in s.characteristics:
                if "write" in c.properties or "write-without-response" in c.properties:
                    tx_char = c
                    break

        if not tx_char:
            print("❌ No writable characteristic found!")
            return

        print(f"\n🎯 Active TX Characteristic: {tx_char.uuid}")

        # Send Handshake / Initialization if needed
        print("\n⚡ Sending K-1000C Initialization & Test Frames...")
        
        # Test 1: Program 2 (Built-In 2)
        print("▶️ Test 1: Switching to Built-In 2...")
        await client.write_gatt_char(tx_char.uuid, bytearray([0xA5, 0x01, 0x01, 0x00, 0x00, 0xA7, 0x5A]), response=False)
        await asyncio.sleep(1.5)

        # Test 2: Solid Red Scene
        print("▶️ Test 2: Setting Red Color...")
        await client.write_gatt_char(tx_char.uuid, bytearray([0xA5, 0x04, 255, 0, 0, (0xA5+4+255)&0xFF, 0x5A]), response=False)
        await asyncio.sleep(1.5)

        # Test 3: Solid Green Scene
        print("▶️ Test 3: Setting Green Color...")
        await client.write_gatt_char(tx_char.uuid, bytearray([0xA5, 0x04, 0, 255, 0, (0xA5+4+255)&0xFF, 0x5A]), response=False)
        await asyncio.sleep(1.5)

        # Test 4: Solid Blue Scene
        print("▶️ Test 4: Setting Blue Color...")
        await client.write_gatt_char(tx_char.uuid, bytearray([0xA5, 0x04, 0, 0, 255, (0xA5+4+255)&0xFF, 0x5A]), response=False)
        await asyncio.sleep(1.5)

        print("\n✅ Tests sent! Keep this script open to interact:")
        while True:
            cmd = input("\nEnter '1' for Red, '2' for Green, '3' for Blue, 'p' for Prog 1, 'q' to quit: ").strip().lower()
            if cmd == "1":
                await client.write_gatt_char(tx_char.uuid, bytearray([0xA5, 0x04, 255, 0, 0, (0xA5+4+255)&0xFF, 0x5A]), response=False)
                print("⚡ Sent Red")
            elif cmd == "2":
                await client.write_gatt_char(tx_char.uuid, bytearray([0xA5, 0x04, 0, 255, 0, (0xA5+4+255)&0xFF, 0x5A]), response=False)
                print("⚡ Sent Green")
            elif cmd == "3":
                await client.write_gatt_char(tx_char.uuid, bytearray([0xA5, 0x04, 0, 0, 255, (0xA5+4+255)&0xFF, 0x5A]), response=False)
                print("⚡ Sent Blue")
            elif cmd == "p":
                await client.write_gatt_char(tx_char.uuid, bytearray([0xA5, 0x01, 0x00, 0x00, 0x00, 0xA6, 0x5A]), response=False)
                print("⚡ Sent Built-In 1")
            elif cmd == "q":
                break

if __name__ == "__main__":
    asyncio.run(watch())
