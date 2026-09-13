#!/usr/bin/env python3
"""
K-1000C BLE Diagnostic & Protocol Discovery Logger
Safe diagnostic mode: connects, subscribes to notifications, reads initial state,
and allows manual input / replay of byte sequences with real-time feedback logging.
"""

import asyncio
import json
import os
import sys
import datetime
from bleak import BleakScanner, BleakClient

# Load config
CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")
with open(CONFIG_PATH, "r") as f:
    CONFIG = json.load(f)

SERVICE_UUID = CONFIG.get("service_uuid", "0000feb8-0000-1000-8000-00805f9b34fb").lower()
WRITE_CHAR_UUID = CONFIG.get("write_char_uuid", "7a442881-509c-47fa-ac02-b06a37d9eb76").lower()
NOTIFY_CHAR_UUID = CONFIG.get("notify_char_uuid", "7a442666-509c-47fa-ac02-b06a37d9eb76").lower()
TARGET_NAME = CONFIG.get("device_name", "XB-Led-1BA1")

def format_data(data: bytearray or bytes):
    hex_str = " ".join(f"{b:02X}" for b in data)
    dec_list = [int(b) for b in data]
    try:
        # printable ascii representation
        ascii_str = "".join(chr(b) if 32 <= b <= 126 else "." for b in data)
    except Exception:
        ascii_str = "<non-ascii>"
    return hex_str, dec_list, ascii_str

def log_event(event_type: str, char_uuid: str, data: bytes or bytearray, note: str = ""):
    now = datetime.datetime.now().strftime("%H:%M:%S.%f")[:-3]
    hex_str, dec_list, ascii_str = format_data(data)
    print(f"\n[{now}] 📥 [{event_type}] Char: {char_uuid[:8]}... | Length: {len(data)} bytes {('(' + note + ')') if note else ''}")
    print(f"       HEX    : [ {hex_str} ]")
    print(f"       DECIMAL: {dec_list}")
    print(f"       ASCII  : \"{ascii_str}\"")

async def run_diagnostics():
    print("=" * 75)
    print("🔬 K-1000C SAFE PROTOCOL DIAGNOSTIC & DISCOVERY TOOL")
    print("=" * 75)
    print(f"Looking for Service : {SERVICE_UUID}")
    print(f"Target Write Char   : {WRITE_CHAR_UUID}")
    print(f"Target Notify Char  : {NOTIFY_CHAR_UUID}")
    print("=" * 75)

    print("\n🔍 Scanning for K-1000C device...")
    devices = await BleakScanner.discover(timeout=5.0, return_adv=True)
    target_device = None

    for addr, (dev, adv) in devices.items():
        name = dev.name or ""
        s_list = [s.lower() for s in adv.service_uuids]
        if SERVICE_UUID in s_list or TARGET_NAME.upper() in name.upper() or "1BA1" in name.upper() or "XB-" in name.upper():
            target_device = dev
            print(f"🎯 Target Matched: {name} [{dev.address}]")
            break

    if not target_device:
        print("\n❌ Could not find K-1000C in initial scan.")
        if not devices:
            print("   No Bluetooth devices found. Please verify Mac Bluetooth is ON.")
            return
        print("   Nearby devices found:")
        for idx, (addr, (d, adv)) in enumerate(devices.items()):
            print(f"   [{idx}] {d.name or 'Unknown':25} [{d.address}]")
        sel = int(input("\nSelect device index to connect: "))
        target_device = list(devices.values())[sel][0]

    print(f"\n📡 Connecting to {target_device.name or 'K-1000C'} ({target_device.address})...")
    
    async with BleakClient(target_device, timeout=12.0) as client:
        print(f"✅ CONNECTED: {client.is_connected}")

        print("\n" + "-" * 75)
        print("📋 GATT PROFILE & CHARACTERISTIC DISCOVERY:")
        print("-" * 75)

        found_write = None
        found_notify = None

        for s in client.services:
            print(f"\n📂 SERVICE: {s.uuid} ({s.description})")
            for c in s.characteristics:
                props = ", ".join(c.properties)
                print(f"   └── 📝 CHAR: {c.uuid} [{props}] ({c.description})")
                if c.uuid.lower() == WRITE_CHAR_UUID:
                    found_write = c
                if c.uuid.lower() == NOTIFY_CHAR_UUID:
                    found_notify = c

        print("\n" + "-" * 75)

        # 1. Read readable characteristic
        print("\n📖 READING INITIAL CHARACTERISTIC STATE...")
        target_read_uuid = found_write.uuid if found_write else WRITE_CHAR_UUID
        try:
            initial_val = await client.read_gatt_char(target_read_uuid)
            log_event("INITIAL READ", str(target_read_uuid), initial_val, "Read successfully")
        except Exception as e:
            print(f"⚠️ Could not read {target_read_uuid}: {e}")

        # 2. Subscribe to Notify characteristic
        target_notify_uuid = found_notify.uuid if found_notify else NOTIFY_CHAR_UUID
        def on_notification(sender, data):
            log_event("NOTIFICATION", str(sender), data)

        try:
            await client.start_notify(target_notify_uuid, on_notification)
            print(f"🔔 SUBSCRIBED to notifications on {target_notify_uuid}!")
        except Exception as e:
            print(f"⚠️ Notification subscription failed on {target_notify_uuid}: {e}")

        # 3. Interactive Protocol Discovery Menu
        print("\n" + "=" * 75)
        print("🛠️ INTERACTIVE PROTOCOL DISCOVERY CONSOLE")
        print("=" * 75)
        print("Type hex bytes to send (e.g. 'A5 01 00 00 00 A6 5A' or '7E 00 05 03 FF 00 00 00 EF')")
        print("Commands are logged in real-time. Incoming controller replies appear automatically.")
        print("-" * 75)

        while True:
            try:
                cmd = await asyncio.to_thread(input, "\n[TX Command] Enter Hex (or 'q' to quit, 'r' to re-read): ")
                cmd = cmd.strip()
                if not cmd:
                    continue
                if cmd.lower() == 'q':
                    break
                if cmd.lower() == 'r':
                    val = await client.read_gatt_char(target_read_uuid)
                    log_event("MANUAL READ", str(target_read_uuid), val)
                    continue

                # Parse hex
                parts = cmd.replace("0x", "").replace(",", " ").split()
                byte_list = [int(p, 16) for p in parts]
                data = bytearray(byte_list)

                now = datetime.datetime.now().strftime("%H:%M:%S.%f")[:-3]
                hex_str, dec_list, ascii_str = format_data(data)
                print(f"[{now}] ⚡ [TX WRITE] Sending {len(data)} bytes to {target_read_uuid[:8]}...")
                print(f"       HEX    : [ {hex_str} ]")
                print(f"       DECIMAL: {dec_list}")

                # Send write
                try:
                    await client.write_gatt_char(target_read_uuid, data, response=False)
                    print(f"       Status : ✅ Sent (No-Response Mode)")
                except Exception as e:
                    try:
                        await client.write_gatt_char(target_read_uuid, data, response=True)
                        print(f"       Status : ✅ Sent (With-Response Mode)")
                    except Exception as err:
                        print(f"       Status : ❌ Write Failed: {err}")

            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"❌ Error parsing input: {e}")

        print("\nStopping diagnostics & disconnecting cleanly...")
        try:
            await client.stop_notify(target_notify_uuid)
        except: pass

if __name__ == "__main__":
    try:
        asyncio.run(run_diagnostics())
    except KeyboardInterrupt:
        print("\nDiagnostics closed.")
