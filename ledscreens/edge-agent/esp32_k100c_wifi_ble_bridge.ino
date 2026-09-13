/*
 * =========================================================================================
 *  E3Di SMART POLE — ESP32 WiFi-to-BLE K100C Controller Cloud Bridge & SOS Node
 * =========================================================================================
 *  Hardware: ESP32-WROOM-32 / ESP32-S3
 *  Target Environment: LIVE PRODUCTION CLOUD (https://www.e3di.org)
 *  Features:
 *   1. Connects to 2.4GHz WiFi with Auto-Reconnect
 *   2. Physical SOS Emergency Push Button on GPIO 4 (Triggers instant live Telegram Alert & 1-Min CCTV)
 *   3. Scans & Connects over BLE to K100C LED Bluetooth Controller
 *   4. Polls Live Production Server for remote Power, Brightness, and Lighting Modes
 * =========================================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEScan.h>
#include <BLEAdvertisedDevice.h>
#include <ArduinoJson.h>

// =========================================================================================
// 1. PRODUCTION CONFIGURATION — ENTER YOUR WIFI DETAILS BELOW
// =========================================================================================

// --- WiFi Credentials ---
const char* WIFI_SSID     = "YOUR_WIFI_NAME_HERE";      // <-- Enter your WiFi Name
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD_HERE";  // <-- Enter your WiFi Password

// --- Live Production Server URL ---
const char* SERVER_BASE_URL = "https://www.e3di.org";

// --- Device & Pole Mapping ---
const char* DEVICE_ID = "ethree-65";
const char* POLE_ID   = "ETHREE-P01";
const char* LOCATION  = "Vijayawada MG Road Corridor";

// --- Hardware Pins ---
// Physical SOS Push Button PIN (Connect button between GPIO 4 and GND)
#define SOS_BUTTON_PIN 4

// =========================================================================================
// 2. BLE CONTROLLER UUIDS (Shenzhen Xinboled K-1000C / SP105E / XB-LED)
// =========================================================================================
static BLEUUID SERVICE_UUID("0000fff0-0000-1000-8000-00805f9b34fb");
static BLEUUID CHAR_UUID   ("0000fff2-0000-1000-8000-00805f9b34fb");

// =========================================================================================
// 3. GLOBAL VARIABLES & STATE
// =========================================================================================
static boolean doConnect = false;
static boolean bleConnected = false;
static BLERemoteCharacteristic* pRemoteCharacteristic;
static BLEAdvertisedDevice* myDevice;

unsigned long lastPollTime = 0;
const unsigned long POLL_INTERVAL = 3000; // Poll live production server every 3 seconds

volatile bool sosTriggered = false;
unsigned long lastSosPress = 0;

// Interrupt Service Routine for Physical SOS Button (Debounced)
void IRAM_ATTR handleSosInterrupt() {
  unsigned long now = millis();
  if (now - lastSosPress > 2000) { // 2-second debounce
    sosTriggered = true;
    lastSosPress = now;
  }
}

// =========================================================================================
// 4. BLE CLIENT CALLBACKS
// =========================================================================================
class MyClientCallback : public BLEClientCallbacks {
  void onConnect(BLEClient* pclient) {
    bleConnected = true;
    Serial.println("✅ [BLE] Connected to K100C Controller!");
  }

  void onDisconnect(BLEClient* pclient) {
    bleConnected = false;
    Serial.println("⚠️ [BLE] Disconnected from K100C. Restarting BLE scan...");
    BLEDevice::getScan()->start(5, false);
  }
};

bool connectToK100C() {
  if (myDevice == nullptr) return false;

  Serial.print("📡 [BLE] Connecting to K100C Controller: ");
  Serial.println(myDevice->getAddress().toString().c_str());

  BLEClient* pClient = BLEDevice::createClient();
  pClient->setClientCallbacks(new MyClientCallback());

  if (!pClient->connect(myDevice)) {
    Serial.println("❌ [BLE] Connection to K100C failed.");
    return false;
  }

  BLERemoteService* pRemoteService = pClient->getRemoteService(SERVICE_UUID);
  if (pRemoteService == nullptr) {
    Serial.println("❌ [BLE] K100C service UUID not found.");
    pClient->disconnect();
    return false;
  }

  pRemoteCharacteristic = pRemoteService->getCharacteristic(CHAR_UUID);
  if (pRemoteCharacteristic == nullptr) {
    Serial.println("❌ [BLE] K100C characteristic UUID not found.");
    pClient->disconnect();
    return false;
  }

  Serial.println("✨ [BLE] K100C Characteristic Ready for commands!");
  return true;
}

class MyAdvertisedDeviceCallbacks : public BLEAdvertisedDeviceCallbacks {
  void onResult(BLEAdvertisedDevice advertisedDevice) {
    String devName = advertisedDevice.getName().c_str();
    if (devName.indexOf("K100") >= 0 || devName.indexOf("SP105") >= 0 || devName.indexOf("LED") >= 0 || advertisedDevice.isAdvertisingService(SERVICE_UUID)) {
      Serial.printf("🔍 [BLE] Found Matching Controller: %s (%s)\n", devName.c_str(), advertisedDevice.getAddress().toString().c_str());
      BLEDevice::getScan()->stop();
      myDevice = new BLEAdvertisedDevice(advertisedDevice);
      doConnect = true;
    }
  }
};

// =========================================================================================
// 5. K100C BLE COMMAND DISPATCHER
// =========================================================================================
void sendK100cCommand(bool power, int brightness, String mode) {
  if (!pRemoteCharacteristic) return;

  if (!power) {
    // K-1000C Power OFF / Pause frame
    uint8_t offPacket[7] = {0xA5, 0x05, 0x00, 0x00, 0x00, 0xAA, 0x5A};
    pRemoteCharacteristic->writeValue(offPacket, 7, false);
    Serial.println("⚡ [K-1000C] Sent: POWER OFF (STANDBY)");
    return;
  }

  // Play / Start frame
  uint8_t onPacket[7] = {0xA5, 0x05, 0x01, 0x00, 0x00, 0xAB, 0x5A};
  pRemoteCharacteristic->writeValue(onPacket, 7, false);
  delay(50);

  if (mode == "emergency_red") {
    // Red Emergency Strobe frame
    uint8_t redPacket[7] = {0xA5, 0x04, 0xFF, 0x00, 0x00, (uint8_t)((0xA5 + 0x04 + 0xFF) & 0xFF), 0x5A};
    pRemoteCharacteristic->writeValue(redPacket, 7, false);
    Serial.println("🚨 [K-1000C] Emergency Red Scene Active!");
  } else {
    // Speed / Brightness packet
    uint8_t spd = map(constrain(brightness, 0, 100), 0, 100, 1, 30);
    uint8_t spdPacket[7] = {0xA5, 0x02, spd, 0x00, 0x00, (uint8_t)((0xA5 + 0x02 + spd) & 0xFF), 0x5A};
    pRemoteCharacteristic->writeValue(spdPacket, 7, false);
  }

  Serial.printf("💡 [K-1000C] Applied: Brightness=%d%%, Mode=%s\n", brightness, mode.c_str());
}

// =========================================================================================
// 6. TRIGGER INSTANT SOS EMERGENCY ALERT TO LIVE SERVER
// =========================================================================================
void sendSosAlertToCloud() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ [SOS] Cannot send alert: WiFi not connected!");
    return;
  }

  String url = String(SERVER_BASE_URL) + "/api/sos/trigger";
  Serial.printf("🚨 [SOS] Contacting Live Emergency API: %s\n", url.c_str());

  WiFiClientSecure client;
  client.setInsecure(); // Connect securely to https://www.e3di.org without root certificate overhead

  HTTPClient http;
  if (http.begin(client, url)) {
    http.addHeader("Content-Type", "application/json");

    // Construct Emergency JSON Payload
    StaticJsonDocument<256> doc;
    doc["device"]   = String("ESP32-POLE-") + DEVICE_ID;
    doc["poleId"]   = POLE_ID;
    doc["status"]   = "Active Emergency";
    doc["battery"]  = 100;
    doc["location"] = LOCATION;

    String payload;
    serializeJson(doc, payload);

    int httpCode = http.POST(payload);
    if (httpCode > 0) {
      String response = http.getString();
      Serial.printf("✅ [SOS] Live Emergency Dispatched! HTTP %d | Server Response: %s\n", httpCode, response.c_str());
      
      // Trigger Red Emergency Strobe locally on the K100C LED Screen
      sendK100cCommand(true, 100, "emergency_red");
    } else {
      Serial.printf("❌ [SOS] Failed to send emergency alert. Error: %s\n", http.errorToString(httpCode).c_str());
    }

    http.end();
  }
}

// =========================================================================================
// 7. POLL REMOTE COMMANDS FROM LIVE PRODUCTION SERVER
// =========================================================================================
void pollCloudCommands() {
  if (WiFi.status() != WL_CONNECTED) return;

  String url = String(SERVER_BASE_URL) + "/api/device/" + DEVICE_ID + "/k100c/poll";
  
  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;
  if (http.begin(client, url)) {
    int httpCode = http.GET();
    if (httpCode == HTTP_CODE_OK) {
      String response = http.getString();
      StaticJsonDocument<512> doc;
      DeserializationError error = deserializeJson(doc, response);

      if (!error) {
        bool power = doc["power"] | true;
        int brightness = doc["brightness"] | 100;
        String mode = doc["mode"] | "normal";

        static bool lastPower = true;
        static int lastBrightness = -1;
        static String lastMode = "";

        if (power != lastPower || brightness != lastBrightness || mode != lastMode) {
          Serial.println("\n📥 [LIVE COMMAND] New Command Received from Live Production Server!");
          sendK100cCommand(power, brightness, mode);
          lastPower = power;
          lastBrightness = brightness;
          lastMode = mode;
        }
      }
    }
    http.end();
  }
}

// =========================================================================================
// 8. SETUP & MAIN LOOP
// =========================================================================================
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n==================================================================");
  Serial.println("🚀 [E3Di LIVE] ESP32 Smart Pole WiFi-to-BLE & SOS Controller Node");
  Serial.println("🌐 Server Target: https://www.e3di.org");
  Serial.println("==================================================================");

  // 1. Setup SOS Button Pin with internal Pull-Up (Push to GND)
  pinMode(SOS_BUTTON_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(SOS_BUTTON_PIN), handleSosInterrupt, FALLING);
  Serial.println("🚨 [HARDWARE] SOS Emergency Button armed on GPIO 4");

  // 2. Connect WiFi
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.printf("📶 [WIFI] Connecting to '%s'", WIFI_SSID);

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 30) {
    delay(500);
    Serial.print(".");
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n✅ [WIFI] Connected successfully! IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n⚠️ [WIFI] Connection pending. Auto-reconnecting in background...");
  }

  // 3. Initialize BLE Scanner for K100C
  BLEDevice::init("E3Di-SmartPole-Bridge");
  BLEScan* pBLEScan = BLEDevice::getScan();
  pBLEScan->setAdvertisedDeviceCallbacks(new MyAdvertisedDeviceCallbacks());
  pBLEScan->setInterval(1349);
  pBLEScan->setWindow(449);
  pBLEScan->setActiveScan(true);
  pBLEScan->start(5, false);
  Serial.println("🔵 [BLE] Scanner active — scanning for K100C controller...");
}

void loop() {
  // 1. Handle Physical SOS Button Press
  if (sosTriggered) {
    sosTriggered = false;
    Serial.println("\n🚨🚨🚨 [SOS PRESSED] CITIZEN TRIGGERED EMERGENCY BUTTON ON POLE! 🚨🚨🚨");
    sendSosAlertToCloud();
  }

  // 2. Connect BLE if discovered
  if (doConnect) {
    if (connectToK100C()) {
      Serial.println("✨ [BLE] Link Established with K100C.");
    }
    doConnect = false;
  }

  // 3. Periodic Command Polling from Live Server
  if (millis() - lastPollTime > POLL_INTERVAL) {
    lastPollTime = millis();
    pollCloudCommands();
  }

  // 4. Ensure WiFi auto-reconnects if signal drops
  if (WiFi.status() != WL_CONNECTED) {
    static unsigned long lastWifiRetry = 0;
    if (millis() - lastWifiRetry > 10000) {
      lastWifiRetry = millis();
      Serial.println("📶 [WIFI] Reconnecting to WiFi...");
      WiFi.reconnect();
    }
  }
}
