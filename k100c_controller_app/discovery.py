#!/usr/bin/env python3
"""
K-1000C BLE Discovery Script
Scans for the K-1000C controller by advertised service UUID and name.
"""

import asyncio
import json
import os
import sys
from bleak import BleakScanner

# Load configuration
CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")
with open(CONFIG_PATH, "r") as f:
    CONFIG = json.load(f)

TARGET_SERVICE = CONFIG.get("service_uuid", "0000feb8-0000-1000-8000-00805f9b34fb").lower()
TARGET_NAME = CONFIG.get("device_name", "XB-Led-1BA1")
FALLBACK_NAME = CONFIG.get("device_name_fallback", "XB-")

async def scan_for_k100c(timeout=6.0):
    print("=" * 70)
    print("🔍 K-1000C BLE CONTROLLER SCANNER")
    print("=" * 70)
    print(f"Target Service UUID : {TARGET_SERVICE}")
    print(f"Target Device Name  : {TARGET_NAME}")
    print(f"Scanning for {timeout} seconds...\n")

    discovered = await BleakScanner.discover(timeout=timeout, return_adv=True)
    
    target_match = None
    all_devices = []

    for addr, (device, adv) in discovered.items():
        name = device.name or "(Unnamed)"
        services = [s.lower() for s in adv.service_uuids]
        is_service_match = TARGET_SERVICE in services
        is_name_match = (TARGET_NAME.upper() in name.upper()) or (FALLBACK_NAME.upper() in name.upper())

        info = {
            "name": name,
            "mac_or_uuid": device.address,
            "rssi": adv.rssi,
            "services": adv.service_uuids,
            "service_data": {k: v.hex() for k, v in adv.service_data.items()},
            "manufacturer_data": {k: v.hex() for k, v in adv.manufacturer_data.items()},
            "is_target": is_service_match or is_name_match,
            "match_reason": "Service UUID Match" if is_service_match else ("Name Match" if is_name_match else "None")
        }
        all_devices.append((device, info))

        if (is_service_match or is_name_match) and not target_match:
            target_match = (device, info)

    # Print scan results
    for device, info in all_devices:
        prefix = "👉 [TARGET FOUND]" if info["is_target"] else "   "
        print(f"{prefix} {info['name']:<25} | RSSI: {info['rssi']:>4} dBm | Address: {info['mac_or_uuid']}")
        if info["services"]:
            print(f"       Services: {info['services']}")
        if info["manufacturer_data"]:
            print(f"       Mfg Data: {info['manufacturer_data']}")

    print("\n" + "=" * 70)
    if target_match:
        dev, inf = target_match
        print(f"✅ SUCCESS: Located K-1000C Controller!")
        print(f"   Name   : {inf['name']}")
        print(f"   Address: {inf['mac_or_uuid']}")
        print(f"   Reason : {inf['match_reason']}")
        return dev
    else:
        print("❌ K-1000C controller not found in this scan.")
        print("   Tips:")
        print("   1. Ensure K-1000C is powered ON.")
        print("   2. Ensure Bluetooth is OFF on your phone (controllers only allow 1 master).")
        print("   3. Ensure Mac Bluetooth is turned ON.")
        return None

if __name__ == "__main__":
    asyncio.run(scan_for_k100c())
