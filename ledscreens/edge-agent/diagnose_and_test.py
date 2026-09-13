#!/usr/bin/env python3
import asyncio
import sys
from bleak import BleakScanner, BleakClient

async def main():
    print("=" * 65)
    print("🔍 K-1000C (XB-Led) Bluetooth Deep Inspector & Protocol Tester")
    print("=" * 65)
    print("👉 Make sure 'Disconnect' was clicked in Chrome so Python can connect.\n")

    print("Scanning for BLE devices (5 seconds)...")
    devices = await BleakScanner.discover(timeout=5.0)

    target = None
    print(f"\nDiscovered {len(devices)} device(s):")
    for idx, d in enumerate(devices):
        name = d.name or "Unknown"
        print(f"  [{idx}] {name:30} [{d.address}]")
        if "1BA1" in name or "XB" in name.upper() or "K100" in name.upper():
            target = d

    if not target:
        if not devices:
            print("\n❌ No devices found. Check if Bluetooth is turned ON on your Mac.")
            return
        sel = int(input("\nEnter device index to connect: "))
        target = devices[sel]

    print(f"\n🎯 Connecting to target: {target.name or 'Unknown'} ({target.address})...")
    
    async with BleakClient(target.address) as client:
        print(f"✅ Connected: {client.is_connected}")
        print("\n" + "=" * 65)
        print("📋 COMPLETE GATT TABLE (Services & Characteristics):")
        print("=" * 65)

        tx_rx_chars = []

        def notification_handler(sender, data):
            hex_str = " ".join(f"{b:02X}" for b in data)
            print(f"  📥 [REPLY/NOTIFY from {sender}]: {hex_str}")

        for service in client.services:
            print(f"\n📂 SERVICE: {service.uuid} ({service.description})")
            for char in service.characteristics:
                props = ", ".join(char.properties)
                print(f"   └── 📝 CHAR: {char.uuid} [{props}] ({char.description})")
                
                # Subscribe to notifications if supported
                if "notify" in char.properties or "indicate" in char.properties:
                    try:
                        await client.start_notify(char.uuid, notification_handler)
                        print(f"       🔔 Subscribed to notifications on {char.uuid}!")
                    except Exception as e:
                        print(f"       ⚠️ Could not subscribe to notify: {e}")

                if "write" in char.properties or "write-without-response" in char.properties:
                    tx_rx_chars.append(char)

        print("\n" + "=" * 65)
        print(f"✨ Found {len(tx_rx_chars)} Writable Characteristic(s):")
        for idx, c in enumerate(tx_rx_chars):
            print(f"  [{idx}] {c.uuid} ({', '.join(c.properties)})")
        print("=" * 65)

        if not tx_rx_chars:
            print("❌ No writable characteristic found on this device!")
            return

        async def send(char, packet, label):
            data = bytearray(packet)
            hex_str = " ".join(f"{b:02X}" for b in data)
            no_resp = "write-without-response" in char.properties
            print(f"\n⚡ Sending [{label}] to {char.uuid[:8]}...: [ {hex_str} ]")
            try:
                await client.write_gatt_char(char.uuid, data, response=not no_resp)
                print(f"   ✅ Write succeeded!")
            except Exception as e:
                try:
                    await client.write_gatt_char(char.uuid, data, response=False)
                    print(f"   ✅ Fallback write-without-response succeeded!")
                except Exception as err:
                    print(f"   ❌ Write failed: {err}")
            await asyncio.sleep(0.3)

        # Interactive loop
        active_char_idx = 0
        while True:
            active_char = tx_rx_chars[active_char_idx]
            print("\n" + "-" * 50)
            print(f"🎯 Target Char: [{active_char_idx}] {active_char.uuid}")
            print("1. Next Built-In Program (Program 1..22)")
            print("2. Set RED Color (Scene / Solid)")
            print("3. Set GREEN Color")
            print("4. Set BLUE Color")
            print("5. Speed + (Fast)")
            print("6. Play / Start")
            print("7. Pause")
            print("8. Run Automated Fuzzer on this Char")
            print("c. Switch Target Characteristic")
            print("r. Send Custom Hex Bytes")
            print("q. Quit")
            print("-" * 50)
            
            cmd = input("Choice: ").strip().lower()
            
            if cmd == "1":
                prog = int(input("Enter Program # (1-22): ")) - 1
                # Format A: [0xA5, 0x01, prog, 0x00, 0x00, sum, 0x5A]
                await send(active_char, [0xa5, 0x01, prog, 0x00, 0x00, (0xa5+1+prog)&0xff, 0x5a], f"A5 Prog {prog+1}")
                # Format B: [0x55, 0xAA, 0x01, 0x01, prog, (0x55+0xaa+1+1+prog)&0xff]
                await send(active_char, [0x55, 0xaa, 0x01, 0x01, prog, (0x55+0xaa+1+1+prog)&0xff], f"55AA Prog {prog+1}")
                # Format C: [0xAA, 0x01, prog, 0x00, 0xFF]
                await send(active_char, [0xaa, 0x01, prog, 0x00, 0xff], f"AA Prog {prog+1}")
                # Format D: [0x7E, 0x00, 0x03, prog+1, 0x64, 0x00, 0x00, 0x00, 0xEF]
                await send(active_char, [0x7e, 0x00, 0x03, prog+1, 0x64, 0x00, 0x00, 0x00, 0xef], f"7E Prog {prog+1}")

            elif cmd == "2": # RED
                await send(active_char, [0xa5, 0x04, 255, 0, 0, (0xa5+4+255)&0xff, 0x5a], "A5 RED")
                await send(active_char, [0x55, 0xaa, 0x03, 0x03, 255, 0, 0, (0x55+0xaa+3+3+255)&0xff], "55AA RED")
                await send(active_char, [0x7e, 0x00, 0x05, 0x03, 255, 0, 0, 0x00, 0xef], "7E Type A RED")
                await send(active_char, [0x7e, 0x04, 0x05, 0x03, 255, 0, 0, 0xff, 0x00, 0xef], "7E Type B RED")
                await send(active_char, [0x56, 255, 0, 0, 0x00, 0xf0, 0xaa], "56 RED")
                await send(active_char, [0xaa, 0x01, 255, 0, 0, 0xff], "AA RED")

            elif cmd == "3": # GREEN
                await send(active_char, [0xa5, 0x04, 0, 255, 0, (0xa5+4+255)&0xff, 0x5a], "A5 GREEN")
                await send(active_char, [0x55, 0xaa, 0x03, 0x03, 0, 255, 0, (0x55+0xaa+3+3+255)&0xff], "55AA GREEN")
                await send(active_char, [0x7e, 0x00, 0x05, 0x03, 0, 255, 0, 0x00, 0xef], "7E GREEN")
                await send(active_char, [0x56, 0, 255, 0, 0x00, 0xf0, 0xaa], "56 GREEN")

            elif cmd == "4": # BLUE
                await send(active_char, [0xa5, 0x04, 0, 0, 255, (0xa5+4+255)&0xff, 0x5a], "A5 BLUE")
                await send(active_char, [0x55, 0xaa, 0x03, 0x03, 0, 0, 255, (0x55+0xaa+3+3+255)&0xff], "55AA BLUE")
                await send(active_char, [0x7e, 0x00, 0x05, 0x03, 0, 0, 255, 0x00, 0xef], "7E BLUE")
                await send(active_char, [0x56, 0, 0, 255, 0x00, 0xf0, 0xaa], "56 BLUE")

            elif cmd == "5": # SPEED
                spd = int(input("Enter Speed (1-30): "))
                await send(active_char, [0xa5, 0x02, spd, 0x00, 0x00, (0xa5+2+spd)&0xff, 0x5a], f"A5 Speed {spd}")
                await send(active_char, [0x55, 0xaa, 0x02, 0x01, spd, (0x55+0xaa+2+1+spd)&0xff], f"55AA Speed {spd}")

            elif cmd == "6": # PLAY
                await send(active_char, [0xa5, 0x05, 0x01, 0x00, 0x00, (0xa5+5+1)&0xff, 0x5a], "A5 PLAY")
                await send(active_char, [0x7e, 0x04, 0x04, 0xf0, 0x00, 0x01, 0xff, 0x00, 0xef], "7E PLAY")

            elif cmd == "7": # PAUSE
                await send(active_char, [0xa5, 0x05, 0x00, 0x00, 0x00, (0xa5+5)&0xff, 0x5a], "A5 PAUSE")
                await send(active_char, [0x7e, 0x04, 0x04, 0x00, 0x00, 0x00, 0xff, 0x00, 0xef], "7E PAUSE")

            elif cmd == "8": # FUZZER
                print("🚀 Running complete fuzzer cycle on this characteristic...")
                fuzz = [
                    ([0xa5, 0x01, 0x01, 0x00, 0x00, 0xa7, 0x5a], "A5 Prog 2"),
                    ([0x55, 0xaa, 0x01, 0x01, 0x01, 0x02], "55AA Prog 2"),
                    ([0x7e, 0x00, 0x05, 0x03, 255, 0, 0, 0x00, 0xef], "7E RED"),
                    ([0x7e, 0x04, 0x05, 0x03, 0, 255, 0, 0xff, 0x00, 0xef], "7E GREEN"),
                    ([0x56, 255, 0, 0, 0x00, 0xf0, 0xaa], "56 RED"),
                    ([0x38, 255, 0, 0, 0xaa], "38 RED"),
                    ([0xaa, 0x01, 255, 0, 0, 0xff], "AA RED"),
                    ([0x7e, 0x00, 0x04, 0xf0, 0x00, 0x01, 0xff, 0x00, 0xef], "7E ON"),
                    ([0xcc, 0x23, 0x33], "CC ON"),
                ]
                for pkt, lbl in fuzz:
                    await send(active_char, pkt, lbl)
                    await asyncio.sleep(1.0)
                print("✅ Fuzzer finished.")

            elif cmd == "c":
                print("Available Characteristics:")
                for i, c in enumerate(tx_rx_chars):
                    print(f"  [{i}] {c.uuid}")
                active_char_idx = int(input("Select index: "))

            elif cmd == "r":
                h = input("Enter hex bytes: ").strip()
                bytes_list = [int(x, 16) for x in h.split()]
                await send(active_char, bytes_list, "Custom Hex")

            elif cmd == "q":
                break

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nExiting.")
    except Exception as e:
        print(f"\n❌ Error: {e}")
