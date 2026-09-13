#!/usr/bin/env python3
"""
K-1000C Local BLE Bridge & Web API Server
Runs on localhost:8765 and provides REST API + WebSocket real-time events.
"""

import asyncio
import json
import logging
import os
import sys
from aiohttp import web, WSMsgType

from k100c_controller import K100CController, CONFIG_PATH

logger = logging.getLogger("server")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# Directory paths
BASE_DIR = os.path.dirname(__file__)
WEB_DIR = os.path.join(BASE_DIR, "web")

controller = K100CController(CONFIG_PATH)
connected_websockets = set()

async def broadcast_ws(payload: dict):
    if not connected_websockets:
        return
    msg = json.dumps(payload)
    for ws in list(connected_websockets):
        try:
            await ws.send_str(msg)
        except Exception:
            connected_websockets.discard(ws)

def on_controller_event(event_data: dict):
    asyncio.create_task(broadcast_ws({
        "type": "event",
        "data": event_data,
        "status": controller.get_status()
    }))

controller.add_notification_listener(on_controller_event)

# ----------------- HTTP API ROUTES -----------------

async def handle_get_status(request):
    """GET /api/status"""
    return web.json_response(controller.get_status())

async def handle_post_light(request):
    """POST /api/light/{id}"""
    light_id = request.match_info.get("id")
    try:
        res = await controller.send_light(light_id)
        await broadcast_ws({"type": "status_update", "status": controller.get_status()})
        return web.json_response(res)
    except ConnectionError as ce:
        return web.json_response({"error": str(ce), "connected": False}, status=503)
    except ValueError as ve:
        return web.json_response({"error": str(ve)}, status=400)
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)

async def handle_post_button(request):
    """POST /api/button/{name} (e.g. chip, mode, speed_up, speed_down)"""
    btn_name = request.match_info.get("name")
    try:
        res = await controller.send_button(btn_name)
        await broadcast_ws({"type": "status_update", "status": controller.get_status()})
        return web.json_response(res)
    except ConnectionError as ce:
        return web.json_response({"error": str(ce), "connected": False}, status=503)
    except ValueError as ve:
        return web.json_response({"error": str(ve)}, status=400)
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)

async def handle_send_raw(request):
    """POST /api/send-raw {"hex": "A5 01 00 00 00 A6 5A", "description": "..."}"""
    try:
        body = await request.json()
        hex_str = body.get("hex", "").strip()
        desc = body.get("description", "Manual Web Command")
        if not hex_str:
            return web.json_response({"error": "Missing 'hex' byte string."}, status=400)

        res = await controller.send_raw_hex(hex_str, desc)
        return web.json_response(res)
    except ConnectionError as ce:
        return web.json_response({"error": str(ce), "connected": False}, status=503)
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)

async def handle_save_button_config(request):
    """POST /api/config/button/{name} {"hex": "...", "name": "...", "description": "..."}"""
    btn_name = request.match_info.get("name")
    try:
        body = await request.json()
        hex_str = body.get("hex", "").strip()
        name = body.get("name", "")
        desc = body.get("description", "")
        if not hex_str:
            return web.json_response({"error": "Missing 'hex' byte string."}, status=400)

        controller.update_button_mapping(btn_name, hex_str, name, desc)
        await broadcast_ws({"type": "status_update", "status": controller.get_status()})
        return web.json_response({"success": True, "button": btn_name, "hardwareButtons": controller.hardware_buttons})
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)

async def handle_save_light_config(request):
    """POST /api/config/light/{id} {"hex": "...", "name": "...", "description": "..."}"""
    light_id = request.match_info.get("id")
    try:
        body = await request.json()
        hex_str = body.get("hex", "").strip()
        name = body.get("name", "")
        desc = body.get("description", "")
        if not hex_str:
            return web.json_response({"error": "Missing 'hex' byte string."}, status=400)

        controller.update_light_mapping(light_id, hex_str, name, desc)
        await broadcast_ws({"type": "status_update", "status": controller.get_status()})
        return web.json_response({"success": True, "lightId": light_id, "programs": controller.light_programs})
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)

async def handle_get_logs(request):
    """GET /api/logs"""
    return web.json_response({"logs": controller.recent_logs})

# ----------------- WEBSOCKET HANDLER -----------------

async def handle_websocket(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    connected_websockets.add(ws)

    # Send initial snapshot
    await ws.send_str(json.dumps({
        "type": "init",
        "status": controller.get_status(),
        "logs": controller.recent_logs
    }))

    try:
        async for msg in ws:
            if msg.type == WSMsgType.TEXT:
                try:
                    data = json.loads(msg.data)
                    action = data.get("action")
                    if action == "ping":
                        await ws.send_str(json.dumps({"type": "pong"}))
                    elif action == "trigger_light":
                        lid = data.get("lightId")
                        await controller.send_light(lid)
                except Exception as e:
                    await ws.send_str(json.dumps({"type": "error", "message": str(e)}))
            elif msg.type == WSMsgType.ERROR:
                logger.error(f"WebSocket closed with error {ws.exception()}")
    finally:
        connected_websockets.discard(ws)

    return ws

# ----------------- SERVER INITIALIZATION -----------------

async def init_app():
    app = web.Application()

    # API routes
    app.router.add_get("/api/status", handle_get_status)
    app.router.add_post("/api/light/{id}", handle_post_light)
    app.router.add_post("/api/button/{name}", handle_post_button)
    app.router.add_post("/api/send-raw", handle_send_raw)
    app.router.add_post("/api/config/light/{id}", handle_save_light_config)
    app.router.add_post("/api/config/button/{name}", handle_save_button_config)
    app.router.add_get("/api/logs", handle_get_logs)
    app.router.add_get("/ws", handle_websocket)

    async def index_handler(request):
        return web.FileResponse(os.path.join(WEB_DIR, "index.html"))

    async def css_handler(request):
        return web.FileResponse(os.path.join(WEB_DIR, "style.css"))

    async def js_handler(request):
        return web.FileResponse(os.path.join(WEB_DIR, "app.js"))

    app.router.add_get("/", index_handler)
    app.router.add_get("/index.html", index_handler)
    app.router.add_get("/style.css", css_handler)
    app.router.add_get("/app.js", js_handler)

    return app

async def main():
    host = controller.config.get("api_host", "127.0.0.1")
    port = controller.config.get("api_port", 8765)

    print("=" * 75)
    print("🚀 STARTING K-1000C BLE LOCAL BRIDGE & WEB SERVER")
    print("=" * 75)
    print(f"📍 Web UI URL    : http://{host}:{port}")
    print(f"📡 API Endpoint  : http://{host}:{port}/api/status")
    print(f"🔒 Security      : Listening on {host} (Localhost Only)")
    print("=" * 75)

    # Start BLE background manager
    await controller.start()

    app = await init_app()
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, host, port)
    await site.start()

    print(f"✨ Server is LIVE at http://{host}:{port}")

    # Keep alive
    try:
        while True:
            await asyncio.sleep(3600)
    except (asyncio.CancelledError, KeyboardInterrupt):
        pass
    finally:
        print("\nShutting down server & BLE bridge...")
        await runner.cleanup()
        await controller.stop()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nServer stopped.")
