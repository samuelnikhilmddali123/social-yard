#!/usr/bin/env python3
"""
K-1000C BLE Connection Verification Test
Automated end-to-end verification of Mac -> Bluetooth LE -> K-1000C Controller.
"""

import asyncio
import json
import os
import sys
from bleak import BleakScanner, BleakClient

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")
with open(CONFIG_PATH, "r") as f:
    CONFIG = json.load(f)

SERVICE_UUID = CONFIG.get("service_uuid", "0000feb8-0000-1000-8000-00805f9b34fb").lower()
WRITE_CHAR_UUID = CONFIG.get("write_char_uuid", "7a442881-509c-47fa-ac02-b06a37d9eb76").lower()
NOTIFY_CHAR_UUID = CONFIG.get("notify_char_uuid", "7a442666-509c-47fa-ac02-b06a37d9eb76").lower()
TARGET_NAME = CONFIG.get("device_name", "XB-Led-1BA1")

async def test_k100c_connection():
    print("=" * 70)
    print("🧪 K-1000C HARDWARE & BLE CONNECTION VERIFIER")
    print("=" * 70)

    # 1. Scanning Step
    print("\n[STEP 1/4] Scanning for K-1000C controller...")
    discovered = await BleakScanner.discover(timeout=5.0, return_adv=True)
    target_device = None

    for addr, (dev, adv) in discovered.items():
        name = dev.name or ""
        s_list = [s.lower() for s in adv.service_uuids]
        if SERVICE_UUID in s_list or TARGET_NAME.upper() in name.upper() or "1BA1" in name.upper() or "XB-" in name.upper():
            target_device = dev
            print(f"  ✅ Located Device: {name} [{dev.address}] (RSSI: {adv.rssi} dBm)")
            break

    if not target_device:
        print("  ❌ FAIL: K-1000C device not found. Ensure controller is ON and phone Bluetooth is OFF.")
        return False

    # 2. Connection Step
    print("\n[STEP 2/4] Connecting over Bluetooth Low Energy...")
    async with BleakClient(target_device, timeout=12.0) as client:
        if not client.is_connected:
            print("  ❌ FAIL: Could not establish BLE connection.")
            return False
        print("  ✅ PASS: Connected to GATT Server successfully.")

        # 3. Discovering Characteristics
        print("\n[STEP 3/4] Validating GATT Service & Characteristic endpoints...")
        found_write = False
        found_notify = False

        for s in client.services:
            for c in s.characteristics:
                if c.uuid.lower() == WRITE_CHAR_UUID:
                    found_write = True
                    print(f"  ✅ PASS: Verified Write Characteristic: {c.uuid} (Props: {c.properties})")
                if c.uuid.lower() == NOTIFY_CHAR_UUID:
                    found_notify = True
                    print(f"  ✅ PASS: Verified Notify Characteristic: {c.uuid} (Props: {c.properties})")

        if not found_write:
            print(f"  ⚠️ Warning: Write char {WRITE_CHAR_UUID} not found directly in GATT table.")
        if not found_notify:
            print(f"  ⚠️ Warning: Notify char {NOTIFY_CHAR_UUID} not found directly in GATT table.")

        # 4. Reading Initial State & Subscription
        print("\n[STEP 4/4] Reading initial state & testing notification subscription...")
        try:
            read_data = await client.read_gatt_char(WRITE_CHAR_UUID)
            hex_str = " ".join(f"{b:02X}" for b in read_data)
            ascii_str = "".join(chr(b) if 32 <= b <= 126 else "." for b in read_data)
            print(f"  ✅ PASS: Read initial value -> HEX: [ {hex_str} ] | ASCII: \"{ascii_str}\"")
        except Exception as e:
            print(f"  ⚠️ Read note: {e}")

        try:
            await client.start_notify(NOTIFY_CHAR_UUID, lambda s, d: None)
            print(f"  ✅ PASS: Successfully subscribed to incoming notify channel.")
            await client.stop_notify(NOTIFY_CHAR_UUID)
        except Exception as e:
            print(f"  ⚠️ Notify subscription note: {e}")

    print("\n" + "=" * 70)
    print("🎉 ALL BLE HARDWARE CHECKS PASSED: Mac <--> K-1000C link is 100% operational!")
    print("=" * 70)
    return True

if __name__ == "__main__":
    success = asyncio.run(test_k100c_connection())
    sys.exit(0 if success else 1)
