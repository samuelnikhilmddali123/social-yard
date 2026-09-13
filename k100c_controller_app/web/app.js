// K-1000C Web Controller Client Application

let socket = null;
let currentStatus = {
  connected: false,
  device: "XB-Led-1BA1",
  currentLight: null,
  programs: {}
};

document.addEventListener("DOMContentLoaded", () => {
  initWebSocket();
  fetchInitialStatus();
});

// ---------------- WebSocket Connection ----------------

function initWebSocket() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;

  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    logToConsole("Connected to Mac BLE Bridge API", "info");
    hideError();
  };

  socket.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === "init") {
        updateUI(msg.status);
        if (msg.logs) {
          msg.logs.forEach(l => appendLogEntry(l));
        }
      } else if (msg.type === "status_update") {
        updateUI(msg.status);
      } else if (msg.type === "event") {
        if (msg.data) appendLogEntry(msg.data);
        if (msg.status) updateUI(msg.status);
      }
    } catch (e) {
      console.error("Error parsing WS message:", e);
    }
  };

  socket.onclose = () => {
    updateUI({ connected: false });
    showError("Bridge Disconnected", "Lost connection to local Mac BLE bridge service. Reconnecting...");
    setTimeout(initWebSocket, 2000);
  };

  socket.onerror = () => {
    showError("Connection Error", "Cannot reach http://127.0.0.1:8765. Is python server.py running?");
  };
}

// ---------------- REST Fallback & Initial Sync ----------------

async function fetchInitialStatus() {
  try {
    const res = await fetch("/api/status");
    if (res.ok) {
      const data = await res.json();
      updateUI(data);
    }
  } catch (e) {
    console.warn("Status fetch failed:", e);
  }
}

// ---------------- UI Updates ----------------

function updateUI(status) {
  currentStatus = { ...currentStatus, ...status };

  // 1. Connection Badge
  const badge = document.getElementById("connectionBadge");
  const badgeText = document.getElementById("statusText");
  const subtext = document.getElementById("deviceSubtext");

  if (currentStatus.connected) {
    badge.className = "status-badge connected";
    badgeText.textContent = "CONNECTED";
    subtext.textContent = `Device: ${currentStatus.device || "XB-Led-1BA1"} (Active BLE)`;
    hideError();
  } else {
    badge.className = "status-badge disconnected";
    badgeText.textContent = currentStatus.connecting ? "CONNECTING..." : "DISCONNECTED";
    subtext.textContent = currentStatus.connecting ? "Scanning for controller..." : "Searching for XB-Led-1BA1...";
  }

  // 2. Active Program
  const activeProgText = document.getElementById("activeProgramBadge");
  const progLabel = document.getElementById("activeProgramText");

  if (currentStatus.currentLight) {
    const pInfo = currentStatus.programs && currentStatus.programs[String(currentStatus.currentLight)];
    const pName = pInfo ? pInfo.name : `Light ${currentStatus.currentLight}`;
    progLabel.textContent = `Playing ${pName}`;
    setFeedback(`Active: Program ${currentStatus.currentLight}`);
  }

  // 3. Button Active States & Hex previews
  for (let i = 1; i <= 4; i++) {
    const btn = document.getElementById(`btnLight${i}`);
    const hexPrev = document.getElementById(`hex${i}`);
    const title = document.getElementById(`title${i}`);
    const desc = document.getElementById(`desc${i}`);

    const prog = currentStatus.programs && currentStatus.programs[String(i)];
    if (prog) {
      if (title && prog.name) title.textContent = prog.name.toUpperCase();
      if (desc && prog.description) desc.textContent = prog.description;
      if (hexPrev && prog.hex) hexPrev.textContent = `HEX: ${prog.hex.substring(0, 14)}...`;
    }

    if (btn) {
      if (currentStatus.currentLight === i) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    }
  }

  // 4. Last Read Characteristic
  if (currentStatus.lastReadValue) {
    const el = document.getElementById("lastReadState");
    if (el) el.textContent = `Read State: [ ${currentStatus.lastReadValue} ]`;
  }
}

function setFeedback(msg, isError = false) {
  const fb = document.getElementById("feedbackMessage");
  if (fb) {
    fb.textContent = msg;
    fb.style.color = isError ? "var(--status-red)" : "var(--text-muted)";
  }
}

function showError(title, msg) {
  const banner = document.getElementById("errorBanner");
  document.getElementById("errorTitle").textContent = title;
  document.getElementById("errorMessage").textContent = msg;
  banner.classList.remove("hidden");
}

function hideError() {
  document.getElementById("errorBanner").classList.add("hidden");
}

function dismissError() {
  hideError();
}

// ---------------- Button Triggers ----------------

async function selectLight(lightId) {
  if (!currentStatus.connected) {
    showError("Controller Not Connected", "Cannot send command while K-1000C is disconnected. Please wait for Bluetooth connection.");
    return;
  }

  setFeedback(`Sending... Activating Light ${lightId}`);
  logToConsole(`[User Action] Clicked LIGHT ${lightId}`, "tx");

  try {
    const res = await fetch(`/api/light/${lightId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    const data = await res.json();
    if (res.ok && data.success) {
      setFeedback(`Playing Light ${lightId}`);
      updateUI({ currentLight: lightId });
    } else {
      setFeedback(`Error: ${data.error || "Failed to trigger light"}`, true);
      showError("Command Failed", data.error || "Could not dispatch command to controller.");
    }
  } catch (e) {
    setFeedback(`Network error: ${e.message}`, true);
    showError("Network Error", e.message);
  }
}

async function triggerHardwareButton(buttonName) {
  if (!currentStatus.connected) {
    showError("Controller Not Connected", "Cannot trigger hardware button while K-1000C is disconnected.");
    return;
  }

  const prettyName = buttonName.toUpperCase().replace("_", " ");
  setFeedback(`Triggering physical [${prettyName}] button...`);
  logToConsole(`[User Action] Pressed Hardware Button: [${prettyName}]`, "tx");

  try {
    const res = await fetch(`/api/button/${buttonName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    const data = await res.json();
    if (res.ok && data.success) {
      setFeedback(`Triggered [${prettyName}] on controller`);
    } else {
      setFeedback(`Error: ${data.error || "Failed to trigger button"}`, true);
      showError("Button Failed", data.error || "Could not trigger hardware button.");
    }
  } catch (e) {
    setFeedback(`Network error: ${e.message}`, true);
    showError("Network Error", e.message);
  }
}

// ---------------- Protocol Discovery Studio ----------------

async function sendRawHex() {
  const input = document.getElementById("rawHexInput");
  const hexStr = input.value.trim();
  if (!hexStr) return;

  logToConsole(`[User Action] Sending Raw Hex: [ ${hexStr} ]`, "tx");
  setFeedback(`Transmitting Raw Hex...`);

  try {
    const res = await fetch("/api/send-raw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hex: hexStr, description: "Web Console Command" })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      setFeedback(`Hex transmitted successfully!`);
    } else {
      setFeedback(`Send error: ${data.error}`, true);
      showError("Write Failed", data.error || "Could not write raw hex to characteristic.");
    }
  } catch (e) {
    setFeedback(`Error: ${e.message}`, true);
  }
}

async function saveAsLightMapping() {
  const hexStr = document.getElementById("rawHexInput").value.trim();
  const selectedTarget = document.getElementById("assignLightSelect").value;
  if (!hexStr) {
    alert("Please enter a hex string first.");
    return;
  }

  if (selectedTarget.startsWith("btn_")) {
    const btnKey = selectedTarget.replace("btn_", "");
    try {
      const res = await fetch(`/api/config/button/${btnKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hex: hexStr,
          name: btnKey.toUpperCase().replace("_", " "),
          description: `Verified Hex: ${hexStr}`
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✅ Successfully mapped Hardware Button [${btnKey.toUpperCase()}] to: [ ${hexStr} ]!`);
        updateUI({ hardwareButtons: data.hardwareButtons });
      } else {
        alert(`Failed to save button: ${data.error}`);
      }
    } catch (e) {
      alert(`Error saving button config: ${e.message}`);
    }
  } else {
    // Light 1..4 mapping
    const lightId = selectedTarget;
    try {
      const res = await fetch(`/api/config/light/${lightId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hex: hexStr,
          name: `Light ${lightId}`,
          description: `Verified Hex: ${hexStr}`
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✅ Successfully mapped Light ${lightId} to: [ ${hexStr} ]!`);
        updateUI({ programs: data.programs });
      } else {
        alert(`Failed to save: ${data.error}`);
      }
    } catch (e) {
      alert(`Error saving configuration: ${e.message}`);
    }
  }
}

function loadPreset(hexStr, name) {
  const input = document.getElementById("rawHexInput");
  input.value = hexStr;
  logToConsole(`Loaded preset: ${name} -> [ ${hexStr} ]`, "info");
}

function toggleDiscovery() {
  const body = document.getElementById("discoveryBody");
  const arrow = document.getElementById("discoveryArrow");
  body.classList.toggle("collapsed");
  arrow.textContent = body.classList.contains("collapsed") ? "▶" : "▼";
}

// ---------------- Console Log Functions ----------------

function appendLogEntry(entry) {
  const time = entry.time || new Date().toLocaleTimeString();
  let typeClass = "info";
  if (entry.type === "TX") typeClass = "tx";
  else if (entry.type === "NOTIFY") typeClass = "notify";
  else if (entry.type === "ERROR" || entry.type === "WARNING") typeClass = "error";
  else if (entry.type === "SUCCESS") typeClass = "success";

  let content = `[${time}] ${entry.message}`;
  if (entry.hex) {
    content += ` | HEX: [ ${entry.hex} ]`;
  }
  if (entry.extra && entry.extra.ascii) {
    content += ` | ASCII: "${entry.extra.ascii}"`;
  }

  logToConsole(content, typeClass);
}

function logToConsole(text, typeClass = "info") {
  const box = document.getElementById("consoleLog");
  if (!box) return;
  const line = document.createElement("div");
  line.className = `log-line ${typeClass}`;
  line.textContent = text;
  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}

function clearLogs() {
  const box = document.getElementById("consoleLog");
  if (box) box.innerHTML = '<div class="log-line info">[System] Logs cleared.</div>';
}
