#!/usr/bin/env python3
import asyncio
import sys
from bleak import BleakScanner, BleakClient

async def main():
    print("🔍 Looking for XB-Led...")
    devices = await BleakScanner.discover(timeout=4.0)
    target = None
    for d in devices:
        name = d.name or ""
        if "1BA1" in name or "XB" in name or "LED" in name.upper() or "K100" in name:
            target = d
            break
            
    if not target:
        if not devices:
            print("❌ No devices found. Make sure phone bluetooth is disconnected and Mac bluetooth is ON.")
            return
        print("Devices found:")
        for idx, d in enumerate(devices):
            print(f"  [{idx}] {d.name or 'Unknown'} ({d.address})")
        idx = int(input("Select device number: "))
        target = devices[idx]

    print(f"Connecting to {target.name} ({target.address})...")
    async with BleakClient(target.address) as client:
        print(f"✅ Connected to {target.name}!")
        
        # Collect writable characteristics
        chars = []
        for s in client.services:
            for c in s.characteristics:
                if "write" in c.properties or "write-without-response" in c.properties:
                    chars.append(c)
                    print(f"   Writable Char: {c.uuid} ({c.properties})")

        async def send(data, name):
            b = bytearray(data)
            print(f"⚡ Sending [{name}]: {[hex(x) for x in b]}")
            for c in chars:
                try:
                    no_resp = "write-without-response" in c.properties
                    await client.write_gatt_char(c.uuid, b, response=not no_resp)
                except Exception:
                    try: await client.write_gatt_char(c.uuid, b, response=False)
                    except: pass
                await asyncio.sleep(0.05)

        while True:
            print("\n" + "="*40)
            print("1. DuoCo/Lotus RED (0x7E 0x00 ...)")
            print("2. DuoCo/ELK RED   (0x7E 0x04 ...)")
            print("3. Triones RED     (0x56 ...)")
            print("4. K100C RED       (0xAA ...)")
            print("5. SP105E RED      (0x38 ...)")
            print("6. DuoCo GREEN")
            print("7. DuoCo BLUE")
            print("8. Power ON (DuoCo)")
            print("9. Power OFF (DuoCo)")
            print("r. Send Raw Hex")
            print("q. Quit")
            print("="*40)
            opt = input("Choice: ").strip().lower()
            if opt == "1":
                await send([0x7e, 0x00, 0x04, 0xf0, 0x00, 0x01, 0xff, 0x00, 0xef], "Power ON")
                await send([0x7e, 0x00, 0x05, 0x03, 0xff, 0x00, 0x00, 0x00, 0xef], "DuoCo Type A RED")
            elif opt == "2":
                await send([0x7e, 0x04, 0x04, 0xf0, 0x00, 0x01, 0xff, 0x00, 0xef], "Power ON")
                await send([0x7e, 0x04, 0x05, 0x03, 0xff, 0x00, 0x00, 0xff, 0x00, 0xef], "DuoCo Type B RED")
            elif opt == "3":
                await send([0xcc, 0x23, 0x33], "Power ON")
                await send([0x56, 0xff, 0x00, 0x00, 0x00, 0xf0, 0xaa], "Triones RED")
            elif opt == "4":
                await send([0xaa, 0x02, 0x01, 0xff], "Power ON")
                await send([0xaa, 0x01, 0xff, 0x00, 0x00, 0xff], "K100C RED")
            elif opt == "5":
                await send([0x38, 0xff, 0x00, 0x00, 0xaa], "SP105E RED")
            elif opt == "6":
                await send([0x7e, 0x00, 0x05, 0x03, 0x00, 0xff, 0x00, 0x00, 0xef], "DuoCo GREEN")
            elif opt == "7":
                await send([0x7e, 0x00, 0x05, 0x03, 0x00, 0x00, 0xff, 0x00, 0xef], "DuoCo BLUE")
            elif opt == "8":
                await send([0x7e, 0x04, 0x04, 0xf0, 0x00, 0x01, 0xff, 0x00, 0xef], "Power ON")
            elif opt == "9":
                await send([0x7e, 0x04, 0x04, 0x00, 0x00, 0x00, 0xff, 0x00, 0xef], "Power OFF")
            elif opt == "r":
                h = input("Enter hex (e.g. 7e 00 05 03 ff 00 00 00 ef): ").strip()
                b_arr = [int(x, 16) for x in h.split()]
                await send(b_arr, "Custom RAW")
            elif opt == "q":
                break

if __name__ == "__main__":
    asyncio.run(main())
