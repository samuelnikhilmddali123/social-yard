#!/usr/bin/env python3
import asyncio
import sys
from bleak import BleakScanner, BleakClient

async def run_diagnostics():
    print("="*60)
    print("🔍 SCANNING FOR XB-Led / BLUETOOTH CONTROLLER...")
    print("="*60)
    
    devices = await BleakScanner.discover(timeout=5.0)
    target = None
    
    for d in devices:
        name = d.name or "Unknown"
        print(f"  Found: {name:30} [{d.address}]")
        if "XB-LED" in name.upper() or "K100" in name.upper() or "SP105" in name.upper():
            target = d

    if not target:
        # Check if any device has 1BA1 or LED
        for d in devices:
            name = d.name or ""
            if "1BA1" in name.upper() or "LED" in name.upper():
                target = d
                break

    if not target:
        if not devices:
            print("\n❌ No Bluetooth devices detected. Is Bluetooth enabled?")
            return
        print("\nPick device number from above list:")
        for idx, d in enumerate(devices):
            print(f"  [{idx}] {d.name or 'Unnamed'} ({d.address})")
        sel = int(input("Enter number: "))
        target = devices[sel]

    print(f"\n🎯 Selected: {target.name} ({target.address})")
    print("📡 Connecting to device...")
    
    async with BleakClient(target.address) as client:
        print(f"✅ Connected: {client.is_connected}")
        print("\n📋 GATT SERVICE & CHARACTERISTIC HIERARCHY:")
        print("-" * 60)
        
        writable_chars = []
        for service in client.services:
            print(f"\n📂 Service: {service.uuid} ({service.description})")
            for char in service.characteristics:
                props = ", ".join(char.properties)
                print(f"   └── 📝 Char: {char.uuid} [{props}]")
                if "write" in char.properties or "write-without-response" in char.properties:
                    writable_chars.append(char)

        print("-" * 60)
        print(f"✨ Found {len(writable_chars)} writable characteristic(s).")
        
        if not writable_chars:
            print("❌ No writable characteristic found!")
            return

        async def send_to_all(packet_bytes, name):
            data = bytearray(packet_bytes)
            hex_str = " ".join(f"{b:02X}" for b in data)
            print(f"⚡ Testing [{name}]: {hex_str}")
            for char in writable_chars:
                try:
                    no_resp = "write-without-response" in char.properties
                    await client.write_gatt_char(char.uuid, data, response=not no_resp)
                except Exception as e:
                    try:
                        await client.write_gatt_char(char.uuid, data, response=False)
                    except Exception as err:
                        pass
            await asyncio.sleep(0.8)

        print("\n" + "="*60)
        print("🧪 RUNNING PROTOCOL FUZZER (Watch your LED Strip!)")
        print("="*60)

        tests = [
            # 1. DuoCo / ELK / Lotus (0x7E)
            ([0x7e, 0x04, 0x04, 0xf0, 0x00, 0x01, 0xff, 0x00, 0xef], "1. DuoCo Power ON"),
            ([0x7e, 0x00, 0x04, 0xf0, 0x00, 0x01, 0xff, 0x00, 0xef], "1b. Lotus Power ON"),
            ([0x7e, 0x00, 0x05, 0x03, 0xff, 0x00, 0x00, 0x00, 0xef], "1c. DuoCo RED (0x7E)"),
            ([0x7e, 0x07, 0x05, 0x03, 0x00, 0xff, 0x00, 0x00, 0xef], "1d. Lotus GREEN (0x7E)"),
            ([0x7e, 0x04, 0x05, 0x03, 0x00, 0x00, 0xff, 0xff, 0xef], "1e. ELK BLUE (0x7E)"),

            # 2. Triones / HappyLighting (0x56 / 0xCC)
            ([0xcc, 0x23, 0x33], "2. Triones Power ON"),
            ([0x56, 0xff, 0x00, 0x00, 0x00, 0xf0, 0xaa], "2b. Triones RED (0x56)"),
            ([0x56, 0x00, 0xff, 0x00, 0x00, 0xf0, 0xaa], "2c. Triones GREEN (0x56)"),
            ([0x56, 0x00, 0x00, 0xff, 0x00, 0x0f, 0xaa], "2d. Triones BLUE (0x56)"),

            # 3. K100C / SP105E (0xAA / 0x38)
            ([0xaa, 0x02, 0x01, 0xff], "3. K100C Power ON"),
            ([0xaa, 0x01, 0xff, 0x00, 0x00, 0xff], "3b. K100C RED (0xAA)"),
            ([0xaa, 0x01, 0x00, 0xff, 0x00, 0xff], "3c. K100C GREEN (0xAA)"),
            ([0xaa, 0x01, 0x00, 0x00, 0xff, 0xff], "3d. K100C BLUE (0xAA)"),
            ([0x38, 0xff, 0x00, 0x00, 0xaa], "3e. SP105E RED (0x38)"),
            ([0x38, 0x00, 0xff, 0x00, 0xaa], "3f. SP105E GREEN (0x38)"),
            ([0x38, 0x00, 0x00, 0xff, 0xaa], "3g. SP105E BLUE (0x38)"),

            # 4. Zengge / Magic Home (0x31)
            ([0x71, 0x23, 0x0f, 0xa3], "4. Zengge Power ON"),
            ([0x31, 0xff, 0x00, 0x00, 0x00, 0xf0, 0x0f, (0x31+255+0+0+0+0xf0+0x0f)&0xff], "4b. Zengge RED (0x31)"),
            ([0x31, 0x00, 0xff, 0x00, 0x00, 0xf0, 0x0f, (0x31+0+255+0+0+0xf0+0x0f)&0xff], "4c. Zengge GREEN (0x31)"),

            # 5. Broadlink / BLE Strip (0x55)
            ([0x55, 0x06, 0x01, 0xff, 0x00, 0x00, 0xaa], "5. iLED RED (0x55)"),
            ([0x55, 0x06, 0x01, 0x00, 0xff, 0x00, 0xaa], "5b. iLED GREEN (0x55)"),
            ([0x55, 0x06, 0x01, 0x00, 0x00, 0xff, 0xaa], "5c. iLED BLUE (0x55)"),
            
            # 6. Marvel Light / Fox-LED / QHM (0xBE / 0xFA / 0x00)
            ([0xfa, 0x23, 0x00, 0x00, 0x00, 0x23], "6. QHM Power ON"),
            ([0xfa, 0x01, 0xff, 0x00, 0x00, 0x00], "6b. QHM RED"),
            ([0xbe, 0x01, 0xff, 0x00, 0x00, 0x55], "6c. Fox-LED RED"),
            ([0x00, 0x04, 0x01, 0xff, 0x00, 0x00], "6d. Generic RED"),
        ]

        for packet, label in tests:
            await send_to_all(packet, label)

        print("\n" + "="*60)
        print("✅ Diagnostic cycle finished.")
        print("="*60)

if __name__ == "__main__":
    try:
        asyncio.run(run_diagnostics())
    except KeyboardInterrupt:
        print("\nCancelled.")
    except Exception as e:
        print(f"\n❌ Error: {e}")
