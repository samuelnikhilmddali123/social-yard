"""
K-1000C BLE Controller Module
Manages resilient Bluetooth Low Energy connection, auto-reconnection,
command queueing, notification handling, and light program execution.
"""

import asyncio
import json
import logging
import os
import datetime
from typing import Dict, Any, Optional, Callable, List
from bleak import BleakScanner, BleakClient

logger = logging.getLogger("k100c_controller")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")

class K100CController:
    def __init__(self, config_path: str = CONFIG_PATH):
        self.config_path = config_path
        self.load_config()

        self.client: Optional[BleakClient] = None
        self.device = None
        self.is_connected = False
        self.is_connecting = False
        self.current_light: Optional[int] = None
        self.last_error: Optional[str] = None
        self.last_read_value: Optional[str] = None
        self.recent_logs: List[Dict[str, Any]] = []

        self._lock = asyncio.Lock()
        self._command_queue = asyncio.Queue()
        self._notification_callbacks: List[Callable[[Dict[str, Any]], None]] = []
        self._running = False
        self._loop_task: Optional[asyncio.Task] = None

    def load_config(self):
        with open(self.config_path, "r") as f:
            self.config = json.load(f)

        self.service_uuid = self.config.get("service_uuid", "0000feb8-0000-1000-8000-00805f9b34fb").lower()
        self.write_char_uuid = self.config.get("write_char_uuid", "7a442881-509c-47fa-ac02-b06a37d9eb76").lower()
        self.notify_char_uuid = self.config.get("notify_char_uuid", "7a442666-509c-47fa-ac02-b06a37d9eb76").lower()
        self.target_name = self.config.get("device_name", "XB-Led-1BA1")
        self.fallback_name = self.config.get("device_name_fallback", "XB-")
        self.reconnect_interval = self.config.get("reconnect_interval_sec", 5)
        self.command_delay_sec = self.config.get("command_delay_ms", 60) / 1000.0
        self.light_programs = self.config.get("light_programs", {})
        self.hardware_buttons = self.config.get("hardware_buttons", {})

    def save_config(self):
        self.config["light_programs"] = self.light_programs
        self.config["hardware_buttons"] = self.hardware_buttons
        with open(self.config_path, "w") as f:
            json.dump(self.config, f, indent=2)
        logger.info("Configuration saved successfully.")

    def add_notification_listener(self, cb: Callable[[Dict[str, Any]], None]):
        self._notification_callbacks.append(cb)

    def log(self, event_type: str, message: str, data_hex: str = "", extra: Dict[str, Any] = None):
        entry = {
            "timestamp": datetime.datetime.now().isoformat(),
            "time": datetime.datetime.now().strftime("%H:%M:%S"),
            "type": event_type,
            "message": message,
            "hex": data_hex,
            "extra": extra or {}
        }
        self.recent_logs.append(entry)
        if len(self.recent_logs) > 100:
            self.recent_logs.pop(0)

        for cb in self._notification_callbacks:
            try:
                cb(entry)
            except Exception as e:
                logger.error(f"Error in notification callback: {e}")

    async def start(self):
        self._running = True
        self._loop_task = asyncio.create_task(self._connection_manager_loop())
        logger.info("K100C Controller service started.")

    async def stop(self):
        self._running = False
        if self._loop_task:
            self._loop_task.cancel()
        if self.client and self.client.is_connected:
            await self.client.disconnect()
        self.is_connected = False
        logger.info("K100C Controller service stopped.")

    async def _connection_manager_loop(self):
        """Background worker that maintains continuous, resilient connection."""
        while self._running:
            if not self.is_connected and not self.is_connecting:
                try:
                    await self._connect()
                except Exception as e:
                    self.last_error = str(e)
                    self.log("ERROR", f"Connection error: {e}")
                    logger.error(f"Connection error: {e}")

            await asyncio.sleep(self.reconnect_interval)

    async def _connect(self):
        async with self._lock:
            self.is_connecting = True
            self.log("INFO", f"Scanning for K-1000C ({self.target_name} / Service: {self.service_uuid[:8]}...)...")

            try:
                discovered = await BleakScanner.discover(timeout=4.0, return_adv=True)
                target_device = None

                for addr, (dev, adv) in discovered.items():
                    name = dev.name or ""
                    services = [s.lower() for s in adv.service_uuids]
                    is_name = (self.target_name.upper() in name.upper()) or ("1BA1" in name.upper()) or (self.fallback_name.upper() in name.upper())
                    is_service = (self.service_uuid in services) or ("0000fff0" in str(services)) or ("0000ae00" in str(services))
                    if is_name or (is_service and "QUEST" not in name.upper() and "OCULUS" not in name.upper()):
                        target_device = dev
                        break

                if not target_device:
                    self.log("WARNING", "K-1000C device (XB-Led-1BA1) not found in air. Turn OFF phone Bluetooth and power-cycle controller.")
                    self.is_connecting = False
                    return False

                self.device = target_device
                self.log("INFO", f"Device located: {target_device.name} ({target_device.address}). Connecting...")

                def on_disconnected(client):
                    self.is_connected = False
                    self.log("WARNING", "⚠️ Bluetooth connection lost. Will auto-reconnect...")
                    logger.warning("BLE device disconnected.")

                client = BleakClient(target_device, timeout=12.0, disconnected_callback=on_disconnected)
                await client.connect()

                if not client.is_connected:
                    self.is_connecting = False
                    return False

                self.client = client
                self.is_connected = True
                self.is_connecting = False
                self.last_error = None
                self.log("SUCCESS", f"✅ Connected to {target_device.name or 'K-1000C'}!")

                # Discover active write pipe
                self.active_write_char = self.write_char_uuid
                for s in client.services:
                    for c in s.characteristics:
                        if "fff2" in c.uuid.lower() or "ae01" in c.uuid.lower() or "7a442881" in c.uuid.lower():
                            if "write" in c.properties or "write-without-response" in c.properties:
                                self.active_write_char = c.uuid
                                break

                # Subscribe to Notifications
                def handle_notify(sender, data: bytearray):
                    hex_str = " ".join(f"{b:02X}" for b in data)
                    dec_list = [int(b) for b in data]
                    try:
                        ascii_str = "".join(chr(b) if 32 <= b <= 126 else "." for b in data)
                    except: ascii_str = ""

                    self.log("NOTIFY", f"Received reply ({len(data)} bytes)", hex_str, {
                        "decimal": dec_list,
                        "ascii": ascii_str
                    })

                for s in client.services:
                    for c in s.characteristics:
                        if "notify" in c.properties or "indicate" in c.properties:
                            try:
                                await client.start_notify(c.uuid, handle_notify)
                                self.log("INFO", f"Subscribed to notify on {c.uuid[:8]}...")
                            except: pass

                return True

            except Exception as e:
                self.is_connecting = False
                self.is_connected = False
                self.last_error = str(e)
                raise e

    async def send_raw_bytes(self, data: bytes or bytearray, description: str = "Command") -> Dict[str, Any]:
        """Thread-safe and queue-safe BLE packet sender."""
        if not self.is_connected or not self.client:
            raise ConnectionError("Cannot send command: K-1000C is not connected via Bluetooth.")

        hex_str = " ".join(f"{b:02X}" for b in data)
        self.log("TX", f"Sending {description}", hex_str)

        async with self._lock:
            sent_count = 0
            for s in self.client.services:
                for c in s.characteristics:
                    if "write" in c.properties or "write-without-response" in c.properties:
                        try:
                            if "write-without-response" in c.properties:
                                await self.client.write_gatt_char(c.uuid, data, response=False)
                            else:
                                await self.client.write_gatt_char(c.uuid, data, response=True)
                            sent_count += 1
                        except Exception as e:
                            try:
                                await self.client.write_gatt_char(c.uuid, data, response=True)
                                sent_count += 1
                            except: pass

            await asyncio.sleep(self.command_delay_sec)
            if sent_count == 0:
                raise RuntimeError("No writable characteristic responded to write.")
            return {"success": True, "hex": hex_str, "description": description, "pipesWritten": sent_count}

    async def send_raw_hex(self, hex_string: str, description: str = "Raw Hex") -> Dict[str, Any]:
        parts = hex_string.replace("0x", "").replace(",", " ").split()
        b_list = [int(p, 16) for p in parts]
        return await self.send_raw_bytes(bytearray(b_list), description)

    async def send_light(self, light_id: int or str) -> Dict[str, Any]:
        str_id = str(light_id)
        if str_id not in self.light_programs:
            raise ValueError(f"Unknown Light ID '{light_id}'. Available: {list(self.light_programs.keys())}")

        program = self.light_programs[str_id]
        hex_seq = program.get("hex", "")
        name = program.get("name", f"Light {str_id}")

        if not hex_seq:
            raise ValueError(f"No hex command defined for {name}. Please discover and configure its bytes.")

        result = await self.send_raw_hex(hex_seq, f"Playing {name}")
        self.current_light = int(light_id)
        return {
            "success": True,
            "lightId": int(light_id),
            "name": name,
            "hexSent": result["hex"]
        }

    async def send_button(self, button_name: str) -> Dict[str, Any]:
        btn_key = button_name.lower().replace("-", "_").replace(" ", "_").replace("+", "up").replace("speed+", "speed_up").replace("speed-", "speed_down")
        if btn_key not in self.hardware_buttons:
            raise ValueError(f"Unknown button '{button_name}'. Available: {list(self.hardware_buttons.keys())}")

        btn_info = self.hardware_buttons[btn_key]
        hex_seq = btn_info.get("hex", "")
        name = btn_info.get("name", button_name.upper())

        if not hex_seq:
            raise ValueError(f"No hex sequence configured for button {name}.")

        result = await self.send_raw_hex(hex_seq, f"Triggering Button [{name}]")
        return {
            "success": True,
            "button": btn_key,
            "name": name,
            "hexSent": result["hex"]
        }

    def update_light_mapping(self, light_id: int or str, hex_seq: str, name: str = "", description: str = ""):
        str_id = str(light_id)
        if str_id not in self.light_programs:
            self.light_programs[str_id] = {}

        self.light_programs[str_id]["hex"] = hex_seq.strip()
        if name:
            self.light_programs[str_id]["name"] = name
        if description:
            self.light_programs[str_id]["description"] = description

        self.save_config()

    def update_button_mapping(self, button_key: str, hex_seq: str, name: str = "", description: str = ""):
        btn_key = button_key.lower().replace("-", "_").replace(" ", "_")
        if btn_key not in self.hardware_buttons:
            self.hardware_buttons[btn_key] = {}

        self.hardware_buttons[btn_key]["hex"] = hex_seq.strip()
        if name:
            self.hardware_buttons[btn_key]["name"] = name
        if description:
            self.hardware_buttons[btn_key]["description"] = description

        self.save_config()

    def get_status(self) -> Dict[str, Any]:
        return {
            "connected": self.is_connected,
            "connecting": self.is_connecting,
            "device": self.device.name if (self.device and self.is_connected) else self.target_name,
            "currentLight": self.current_light,
            "lastError": self.last_error,
            "lastReadValue": self.last_read_value,
            "programs": self.light_programs,
            "hardwareButtons": self.hardware_buttons
        }
