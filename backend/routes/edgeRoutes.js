/**
 * E3DI Multi-Site Edge Agent API Routes
 * 
 * Endpoints:
 * - POST /api/admin/edges/register : Register Edge Agent
 * - POST /api/edges/:edgeId/heartbeat : Edge Agent telemetry & health check
 * - GET  /api/admin/edges : List edge agents & site status
 * - GET  /api/admin/edges/:edgeId/status : Get specific edge agent telemetry
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const EdgeAgent = require('../models/EdgeAgent');
const Camera = require('../models/Camera');
const { handleEdgeHeartbeat, activeEdgeSockets } = require('../services/edgeManager');
const STREAMS_DIR = path.join(__dirname, '..', 'uploads', 'cctv_streams');

/**
 * @route   POST /api/edges/upload-segment
 * @desc    Receive raw binary HLS segment file upload from Edge Agent with atomic write & rename
 * @access  Public / Edge Token
 */
router.post('/upload-segment', express.raw({ type: '*/*', limit: '10mb' }), (req, res) => {
  const edgeId = req.headers['x-edge-id'] || 'EDGE-001';
  const cameraId = req.headers['x-camera-id'];
  const filename = req.headers['x-filename'];

  if (!cameraId || !filename || !req.body) {
    return res.status(400).json({ error: 'INVALID_SEGMENT_UPLOAD', message: 'x-camera-id, x-filename and binary body are required.' });
  }

  try {
    const camDir = path.join(STREAMS_DIR, cameraId);
    if (!fs.existsSync(camDir)) {
      fs.mkdirSync(camDir, { recursive: true });
    }

    const cleanName = path.basename(filename);
    const tmpPath = path.join(camDir, `${cleanName}.tmp`);
    const finalPath = path.join(camDir, cleanName);

    // Atomic write to .tmp file, then rename to final .ts file
    fs.writeFileSync(tmpPath, req.body);
    fs.renameSync(tmpPath, finalPath);

    res.json({ success: true, cameraId, filename: cleanName, size: req.body.length });
  } catch (err) {
    console.error(`[Edge Routes] Error handling binary segment upload ${filename}:`, err.message);
    res.status(500).json({ error: 'SEGMENT_UPLOAD_FAILED', message: err.message });
  }
});

/**
 * @route   POST /api/admin/edges/register
 * @desc    Register an Edge Agent for a site
 * @access  Public / Edge Token
 */
router.post('/register', async (req, res) => {
  const { edgeId, siteId, name, agentVersion, localIp } = req.body || {};

  if (!edgeId || !siteId) {
    return res.status(400).json({ error: 'INVALID_REQUEST', message: 'edgeId and siteId are required.' });
  }

  try {
    const agent = await EdgeAgent.findOneAndUpdate(
      { edgeId },
      {
        siteId,
        name: name || `Site ${siteId} CCTV Gateway`,
        agentVersion: agentVersion || '1.0.0',
        localIp: localIp || req.ip || '192.168.1.1',
        status: 'online',
        lastSeen: new Date()
      },
      { upsert: true, new: true }
    );

    // Register initial default camera for this site if not exists
    const camId = `cam-${siteId.toLowerCase()}`;
    await Camera.findOneAndUpdate(
      { id: camId },
      {
        siteId,
        edgeId,
        name: `${name || siteId} Main Camera`,
        vendor: 'Sparsh',
        model: 'SC-INA50B-3P25'
      },
      { upsert: true }
    );

    res.json({
      success: true,
      edgeId: agent.edgeId,
      siteId: agent.siteId,
      status: agent.status
    });
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

/**
 * @route   POST /api/edges/:edgeId/heartbeat
 * @desc    Receive Edge Agent health heartbeat & telemetry
 * @access  Public / Edge Token
 */
router.post('/:edgeId/heartbeat', async (req, res) => {
  const { edgeId } = req.params;
  const { cpuUsage, memoryUsage, activeStreams, cameraStatus, uptime } = req.body || {};

  try {
    await handleEdgeHeartbeat(edgeId, { cpuUsage, memoryUsage, activeStreams, cameraStatus, uptime });
    res.json({ success: true, timestamp: Date.now() });
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

/**
 * @route   GET /api/admin/edges
 * @desc    Get status list of all registered Edge Agents across 200 sites
 * @access  Private (Admin)
 */
router.get('/', async (req, res) => {
  try {
    let agents = await EdgeAgent.find({}).sort({ siteId: 1 }).lean();
    
    // Seed default EDGE-001 for SITE-001 if empty
    if (agents.length === 0) {
      const defaultAgent = await EdgeAgent.create({
        edgeId: 'EDGE-001',
        siteId: 'SITE-001',
        name: 'Site 001 Camera Gateway',
        agentVersion: '1.0.0',
        localIp: '192.168.1.107',
        status: 'online',
        lastSeen: new Date()
      });
      agents = [defaultAgent.toObject()];
    }

    const edgeList = agents.map(agent => ({
      id: agent.edgeId,
      edgeId: agent.edgeId,
      siteId: agent.siteId,
      name: agent.name,
      agentVersion: agent.agentVersion,
      status: activeEdgeSockets.has(agent.edgeId) ? 'online' : (agent.status || 'offline'),
      lastSeen: agent.lastSeen,
      telemetry: agent.telemetry || { cpuUsage: 12, memoryUsage: 34, activeStreams: 0 }
    }));

    res.json({ edges: edgeList });
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

/**
 * @route   GET /api/admin/edges/:edgeId/status
 * @route   GET /api/admin/edges/:edgeId
 * @desc    Get detailed telemetry status of a specific Edge Agent
 * @access  Private (Admin)
 */
const handleSingleEdgeStatus = async (req, res) => {
  const { edgeId } = req.params;

  try {
    const agent = await EdgeAgent.findOne({ edgeId }).lean();
    if (!agent) {
      // Fallback for default EDGE-001
      if (edgeId === 'EDGE-001') {
        return res.json({
          id: 'EDGE-001',
          edgeId: 'EDGE-001',
          siteId: 'SITE-001',
          status: activeEdgeSockets.has('EDGE-001') ? 'online' : 'offline',
          lastSeen: new Date(),
          agentVersion: '1.0.0',
          telemetry: { cpuUsage: 12, memoryUsage: 34, activeStreams: 0 }
        });
      }
      return res.status(404).json({ code: 'EDGE_NOT_FOUND', message: 'Edge Agent not registered.' });
    }

    res.json({
      id: agent.edgeId,
      edgeId: agent.edgeId,
      siteId: agent.siteId,
      name: agent.name,
      agentVersion: agent.agentVersion,
      status: activeEdgeSockets.has(agent.edgeId) ? 'online' : (agent.status || 'offline'),
      lastSeen: agent.lastSeen,
      telemetry: agent.telemetry || { cpuUsage: 12, memoryUsage: 34, activeStreams: 0 }
    });
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
};

router.get('/:edgeId/status', handleSingleEdgeStatus);
router.get('/:edgeId', handleSingleEdgeStatus);

module.exports = router;
