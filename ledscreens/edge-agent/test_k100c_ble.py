#!/usr/bin/env python3
"""
K100C / SP105E Bluetooth LE Direct Controller Test Script (Laptop direct over BLE)
Requires: pip install bleak
"""

import asyncio
import sys
from bleak import BleakScanner, BleakClient

SERVICE_UUID = "0000ffe0-0000-1000-8000-00805f9b34fb"
CHAR_UUID    = "0000ffe1-0000-1000-8000-00805f9b34fb"

async def scan_and_connect():
    print("🔍 Scanning for nearby Bluetooth devices (looking for K100C / SP105E / LED)...")
    devices = await BleakScanner.discover(timeout=5.0)
    
    target_device = None
    for d in devices:
        name = d.name or ""
        print(f"   Found: {name:30} [{d.address}]")
        if any(k in name.upper() for k in ["K100", "SP105", "LED", "RGB", "MAGIC"]):
            target_device = d
    
    if not target_device:
        print("\n⚠️ No obvious K100C device name auto-detected in scan.")
        if not devices:
            print("❌ No BLE devices found. Check if Bluetooth is turned ON on your Mac.")
            return
        print("Please pick the device number from above list or press Ctrl+C:")
        for idx, d in enumerate(devices):
            print(f" [{idx}] {d.name or 'Unknown'} ({d.address})")
        choice = int(input("Select device index: "))
        target_device = devices[choice]

    print(f"\n📡 Connecting to {target_device.name} ({target_device.address})...")
    async with BleakClient(target_device.address) as client:
        print(f"✅ Connected: {client.is_connected}")

        async def send_cmd(data: bytearray, label: str):
            try:
                await client.write_gatt_char(CHAR_UUID, data, response=False)
                print(f"⚡ [SENT] {label}: {[hex(b) for b in data]}")
            except Exception as e:
                # Try finding any writable characteristic
                print(f"❌ Failed writing with default UUID: {e}")

        # Menu loop
        while True:
            print("\n--- K100C Controller Menu ---")
            print("1. Power ON")
            print("2. Power OFF")
            print("3. Brightness (0 - 100%)")
            print("4. Mode: Rainbow (0x55)")
            print("5. Mode: Red Emergency Strobe (0xEE)")
            print("6. Mode: Amber Warning (0xAA)")
            print("7. Mode: White Test (0xFF)")
            print("q. Quit")
            choice = input("Select option: ").strip()

            if choice == "1":
                await send_cmd(bytearray([0xAA, 0x02, 0x01, 0xFF]), "POWER ON")
            elif choice == "2":
                await send_cmd(bytearray([0xAA, 0x02, 0x00, 0xFF]), "POWER OFF")
            elif choice == "3":
                pct = int(input("Enter brightness 0-100: "))
                b_val = int((max(0, min(100, pct)) / 100.0) * 255)
                await send_cmd(bytearray([0xAA, 0x04, b_val, 0xFF]), f"BRIGHTNESS {pct}%")
            elif choice == "4":
                await send_cmd(bytearray([0xAA, 0x02, 0x01, 0xFF]), "POWER ON")
                await asyncio.sleep(0.05)
                await send_cmd(bytearray([0xAA, 0x05, 0x55, 0xFF]), "MODE RAINBOW")
            elif choice == "5":
                await send_cmd(bytearray([0xAA, 0x02, 0x01, 0xFF]), "POWER ON")
                await asyncio.sleep(0.05)
                await send_cmd(bytearray([0xAA, 0x05, 0xEE, 0xFF]), "MODE EMERGENCY RED")
            elif choice == "6":
                await send_cmd(bytearray([0xAA, 0x02, 0x01, 0xFF]), "POWER ON")
                await asyncio.sleep(0.05)
                await send_cmd(bytearray([0xAA, 0x05, 0xAA, 0xFF]), "MODE AMBER WARNING")
            elif choice == "7":
                await send_cmd(bytearray([0xAA, 0x02, 0x01, 0xFF]), "POWER ON")
                await asyncio.sleep(0.05)
                await send_cmd(bytearray([0xAA, 0x05, 0xFF, 0xFF]), "MODE WHITE TEST")
            elif choice.lower() == "q":
                break

if __name__ == "__main__":
    try:
        asyncio.run(scan_and_connect())
    except KeyboardInterrupt:
        print("\nExiting.")
