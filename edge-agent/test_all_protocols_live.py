#!/usr/bin/env python3
import asyncio
import sys
from bleak import BleakScanner, BleakClient

# Exact K-1000C GATT Handles
UUID_FFF2 = "0000fff2-0000-1000-8000-00805f9b34fb"
UUID_AE01 = "0000ae01-0000-1000-8000-00805f9b34fb"

async def test_live():
    print("=" * 65)
    print("🔬 K-1000C LIVE PROTOCOL IDENTIFIER")
    print("=" * 65)
    print("Scanning for XB-Led-1BA1...")
    
    target = None
    while not target:
        devices = await BleakScanner.discover(timeout=3.0)
        for d in devices:
            name = d.name or ""
            if "1BA1" in name or "XB" in name.upper() or "K100" in name.upper():
                target = d
                break
        if not target:
            print("... still scanning (ensure phone bluetooth is off) ...")
            await asyncio.sleep(0.5)

    print(f"🎯 Target Acquired: {target.name} [{target.address}]. Connecting...")

    async with BleakClient(target, timeout=12.0) as client:
        print(f"✅ Connected to {target.name}!")

        # Subscribe to any feedback notifications
        for s in client.services:
            for c in s.characteristics:
                if "notify" in c.properties:
                    try:
                        await client.start_notify(c.uuid, lambda s, d: print(f"  📥 [REPLY from {s}]: {[hex(x) for x in d]}"))
                        print(f"🔔 Subscribed to feedback on {c.uuid}")
                    except: pass

        async def send(pipe_uuid, pkt, label):
            data = bytearray(pkt)
            hex_str = " ".join(f"0x{b:02X}" for b in data)
            pipe_short = "FFF2" if "fff2" in pipe_uuid else "AE01"
            print(f"⚡ [{pipe_short}] {label:25}: [ {hex_str} ]")
            try:
                await client.write_gatt_char(pipe_uuid, data, response=False)
            except Exception as e:
                try: await client.write_gatt_char(pipe_uuid, data, response=True)
                except Exception as err: print(f"   ❌ Error: {err}")
            await asyncio.sleep(0.1)

        async def broadcast(pkt, label):
            await send(UUID_FFF2, pkt, label)
            await send(UUID_AE01, pkt, label)
            await asyncio.sleep(0.8)

        print("\n" + "=" * 65)
        print("🧪 RUNNING PROTOCOL PROBES (WATCH YOUR LIGHTS CAREFULLY!)")
        print("=" * 65)

        protocols = [
            # Protocol 1: DuoCo / Lotus 0x7E (RED)
            ([0x7e, 0x00, 0x05, 0x03, 0xff, 0x00, 0x00, 0x00, 0xef], "1. DuoCo 0x7E RED"),
            # Protocol 2: DuoCo Alt 0x7E (RED)
            ([0x7e, 0x04, 0x05, 0x03, 0xff, 0x00, 0x00, 0xff, 0x00, 0xef], "2. DuoCo-4 0x7E RED"),
            # Protocol 3: Triones 0x56 (RED)
            ([0x56, 0xff, 0x00, 0x00, 0x00, 0xf0, 0xaa], "3. Triones 0x56 RED"),
            # Protocol 4: Triones Alt 0x56 (RED)
            ([0x56, 0xff, 0x00, 0x00, 0x00, 0x0f, 0xaa], "4. Triones-Alt 0x56 RED"),
            # Protocol 5: SP105E 0x38 (RED)
            ([0x38, 0xff, 0x00, 0x00, 0xaa], "5. SP105E 0x38 RED"),
            # Protocol 6: K100C 0xAA (RED)
            ([0xaa, 0x01, 0xff, 0x00, 0x00, 0xff], "6. K100C 0xAA RED"),
            # Protocol 7: Xinboled 0xA5 (RED)
            ([0xa5, 0x04, 0xff, 0x00, 0x00, (0xa5+4+255)&0xff, 0x5a], "7. Xinboled 0xA5 RED"),
            # Protocol 8: Xinboled 0xAE (RED)
            ([0xae, 0x01, 0xff, 0x00, 0x00, 0x00, 0x55], "8. Xinboled 0xAE RED"),
            # Protocol 9: 55-AA Frame (RED)
            ([0x55, 0xaa, 0x03, 0x03, 0xff, 0x00, 0x00, (0x55+0xaa+3+3+255)&0xff], "9. 55-AA RED"),
            # Protocol 10: Built-In Program 1 (A5)
            ([0xa5, 0x01, 0x00, 0x00, 0x00, 0xa6, 0x5a], "10. Built-In Prog 1 (0xA5)"),
            # Protocol 11: Built-In Program 2 (A5)
            ([0xa5, 0x01, 0x01, 0x00, 0x00, 0xa7, 0x5a], "11. Built-In Prog 2 (0xA5)"),
            # Protocol 12: Play Command
            ([0x7e, 0x04, 0x04, 0xf0, 0x00, 0x01, 0xff, 0x00, 0xef], "12. 0x7E Play / ON"),
            ([0xcc, 0x23, 0x33], "13. 0xCC Play / ON"),
        ]

        for pkt, lbl in protocols:
            await broadcast(pkt, lbl)
            await asyncio.sleep(1.2)

        print("\n" + "=" * 65)
        print("🏁 PROBE FINISHED. Did any color or animation flash?")
        print("=" * 65)

if __name__ == "__main__":
    try:
        asyncio.run(test_live())
    except KeyboardInterrupt:
        print("\nCancelled.")
    except Exception as e:
        print(f"\n❌ Error: {e}")
