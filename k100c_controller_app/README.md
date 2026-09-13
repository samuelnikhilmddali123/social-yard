# K-1000C Mac Bluetooth LE Web Controller

A Mac-based web control system and Bluetooth Low Energy (BLE) bridge for the **K-1000C LED Controller** (`XB-Led-1BA1`).

---

## 🏛️ Architecture

```text
Browser Website (http://127.0.0.1:8765)
       │
       ▼ (REST / WebSocket)
Local Python API Server (server.py)
       │
       ▼ (Async Bleak Client)
Python BLE Bridge Engine (k100c_controller.py)
       │
       ▼ (Bluetooth Low Energy / CoreBluetooth)
K-1000C LED Controller (XB-Led-1BA1)
       │
       ▼ (UCS1903 / SPI Signals)
LED Panels / Strips
```

---

## 📋 Hardware & BLE Profile

* **Device Name**: `XB-Led-1BA1`
* **Controller MAC**: `48:5D:CE:60:1B:A1`
* **Primary Service UUID**: `0000feb8-0000-1000-8000-00805f9b34fb`
* **WRITE Characteristic**: `7a442881-509c-47fa-ac02-b06a37d9eb76`
* **READ / NOTIFY Characteristic**: `7a442666-509c-47fa-ac02-b06a37d9eb76`
* **Initial Read State**: `HEX: 2d2d2d2d` (`TEXT: ----`)

---

## 🚀 Quick Start on macOS

### 1. Activate Environment
The Python 3.14 virtual environment with `bleak` and `aiohttp` is located at `~/k100c-env`:

```bash
source ~/k100c-env/bin/activate
cd /Users/sharmilakonapala/Desktop/projects/led/k100c_controller_app
```

### 2. Verify BLE Connection
Run the hardware connection verification test:

```bash
python3 test_connection.py
```

### 3. Start Local Web Controller & BLE Bridge
Launch the API server and web interface:

```bash
python3 server.py
```

Now open Google Chrome or Safari to:
👉 **[http://127.0.0.1:8765](http://127.0.0.1:8765)**

---

## 🔬 Protocol Discovery & Capture Guide

To safely discover the exact command bytes sent by your official phone app:

### Method 1: Using the Web Discovery Studio
1. Open **[http://127.0.0.1:8765](http://127.0.0.1:8765)** in your browser.
2. Expand the **🔬 Protocol Discovery & Replay Studio** panel at the bottom.
3. Enter test hex bytes (e.g. `A5 01 00 00 00 A6 5A`) and click **⚡ Send Hex**.
4. Observe real-time responses in the **Live BLE Traffic Stream**.
5. Once a command works, select **Save as Light 1/2/3/4** and click **💾 Save** to instantly map the button.

### Method 2: Interactive Terminal Diagnostic Tool
Run the standalone diagnostic utility:

```bash
python3 diagnostics.py
```

* Logs all incoming notify packets in **HEX**, **Decimal Byte Array**, and **ASCII**.
* Allows manual command typing (e.g. `A5 01 01 00 00 A7 5A`).
* Safe mode: does not send arbitrary automatic commands.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/status` | Returns connection status, active light, and GATT state |
| `POST` | `/api/light/1` | Triggers configured command for **Light 1** |
| `POST` | `/api/light/2` | Triggers configured command for **Light 2** |
| `POST` | `/api/light/3` | Triggers configured command for **Light 3** |
| `POST` | `/api/light/4` | Triggers configured command for **Light 4** |
| `POST` | `/api/send-raw` | Sends raw hex string: `{"hex": "A5 01 00..."}` |
| `POST` | `/api/config/light/{id}` | Maps verified hex sequence to Light button |
| `GET` | `/api/logs` | Returns recent log entries |
| `WS` | `/ws` | Real-time WebSocket event stream |

---

## 🔒 Security & Reliability

* **Localhost-Only**: Listens exclusively on `127.0.0.1` to prevent unauthorized network access.
* **Auto-Reconnect**: The background connection manager automatically reconnects if the K-1000C drops out of range or powers cycles.
* **Concurrency Lock**: Prevents conflicting simultaneous BLE writes.
