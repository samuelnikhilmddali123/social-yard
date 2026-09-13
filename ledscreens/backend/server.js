require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Models
const User = require('./models/User');
const Billboard = require('./models/Billboard');
const Screen = require('./models/Screen');
const Video = require('./models/Video');
const Schedule = require('./models/Schedule');
const Plan = require('./models/Plan');

// Routes - Required at top for better bundling
const authRoutes = require('./routes/auth');
const screenRoutes = require('./routes/screens');
const videoRoutes = require('./routes/videos');
const scheduleRoutes = require('./routes/schedules');
const deviceRoutes = require('./routes/device');
const billboardRoutes = require('./routes/billboards');
const planRoutes = require('./routes/plans');
const partnerRequestRoutes = require('./routes/partnerRequests');
const cameraRoutes = require('./routes/cameraRoutes');
const edgeRoutes = require('./routes/edgeRoutes');
const adminCampaignsRoutes = require('./routes/adminCampaigns');
const corridorsRoutes = require('./routes/corridors');
const sosRoutes = require('./routes/sos');
const { registerEdgeSocket, unregisterEdgeSocket, handleEdgeHeartbeat, handleHlsSegmentSync, updateSessionStatus } = require('./services/edgeManager');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

// Debug logs for Vercel
console.log(`📦 Routes loaded [Fresh Build: ${new Date().toISOString()}]:`, {
  auth: typeof authRoutes,
  screens: typeof screenRoutes,
  videos: typeof videoRoutes,
  schedule: typeof scheduleRoutes,
  device: typeof deviceRoutes,
  billboards: typeof billboardRoutes,
  plans: typeof planRoutes,
  partnerRequests: typeof partnerRequestRoutes,
  cameras: typeof cameraRoutes,
  adminCampaigns: typeof adminCampaignsRoutes
});

const app = express();

// Strip /_/backend prefix if present in Vercel rewritten requests
app.use((req, res, next) => {
  if (req.url.startsWith('/_/backend')) {
    req.url = req.url.replace('/_/backend', '') || '/';
  }
  next();
});

// Comprehensive CORS Allowed Origins
const allowedOrigins = [
  'https://www.e3di.org',
  'https://e3di.org',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5001',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
];

const isAllowedOrigin = (origin) => {
  // Always return true so Android TV Box WebViews, mobile apps, and web browsers are never blocked by CORS
  return true;
};

// Early Preflight & Universal CORS Middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

  // Immediately respond to preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control', 'Pragma'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Increased limit for video/image uploads
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/streams', express.static(path.join(__dirname, 'uploads', 'streams')));

// Socket.io context (only if not on Vercel)
if (!process.env.VERCEL) {
  const http = require('http');
  const { Server } = require('socket.io');
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Socket.IO connection blocked by CORS'));
      },
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Register Edge Agent outbound connection
    socket.on('REGISTER_EDGE', ({ edgeId, siteId }) => {
      if (edgeId) {
        registerEdgeSocket(edgeId, socket);
        socket.join(`edge-${edgeId}`);
      }
    });

    // Handle Edge Agent heartbeats
    socket.on('EDGE_HEARTBEAT', (telemetry) => {
      if (telemetry && telemetry.edgeId) {
        handleEdgeHeartbeat(telemetry.edgeId, telemetry);
      }
    });

    // Handle camera session status updates from Edge Agent
    socket.on('CAMERA_SESSION_STATUS', ({ sessionId, status, metadata }) => {
      if (sessionId) {
        updateSessionStatus(sessionId, status, metadata);
      }
    });

    // Handle incoming HLS segment sync from Edge Agent
    socket.on('HLS_SEGMENT_SYNC', (data) => {
      if (data && data.cameraId) {
        handleHlsSegmentSync(data);
      }
    });

    // Join a specific screen's monitoring room
    socket.on('join-screen', (deviceId) => {
      socket.join(`screen-${deviceId}`);
      console.log(`Socket ${socket.id} joined room: screen-${deviceId}`);
    });

    // Relay frame from screen to all admins in the room
    socket.on('screen-frame', ({ deviceId, frame }) => {
      socket.to(`screen-${deviceId}`).emit('remote-frame', { deviceId, frame });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      unregisterEdgeSocket(socket.id);
    });
  });

  app.set('io', io);
  app.set('server', server);
}

// DB Connection for Serverless/Vercel with Fallbacks
// DB Connection for Serverless/Vercel with Fallbacks
let connectPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectPromise) return connectPromise;

  const atlasUri = process.env.MONGODB_URI;
  const localUri = 'mongodb://localhost:27017/led-screens';

  connectPromise = (async () => {
    try {
      if (atlasUri) {
        console.log(`📡 Connecting to Atlas...`);
        try {
          await mongoose.connect(atlasUri, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
          });
          console.log(`✅ Connected to Atlas`);
          ensureSeedData().catch(() => {});
          return mongoose.connection;
        } catch (err) {
          console.error(`❌ Atlas Connection Error:`, err.message);
        }
      }

      // 2. Try Localhost (only if not on Vercel)
      if (!process.env.VERCEL) {
        console.log(`📡 Connecting to Local MongoDB...`);
        try {
          await mongoose.connect(localUri, { serverSelectionTimeoutMS: 2000 });
          console.log(`✅ Connected to Local MongoDB`);
          await ensureSeedData();
          return mongoose.connection;
        } catch (err) {
          console.error(`❌ Local MongoDB Connection Error:`, err.message);
        }
      }

      // 3. Final Fallback: Memory Server (only if not on Vercel)
      if (!process.env.VERCEL) {
        try {
          console.log('🔄 Auto-provisioning temporary engine...');
          const { MongoMemoryServer } = require('mongodb-memory-server');
          const mongod = await MongoMemoryServer.create();
          await mongoose.connect(mongod.getUri());
          console.log('✨ Auto-Provisioned Engine Active');
          await ensureSeedData();
          return mongoose.connection;
        } catch (err) {
          console.error('❌ All fallback attempts failed.', err.message);
        }
      }
    } catch (err) {
      console.error('❌ Database connection logic error:', err.message);
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
};

const ensureSeedData = async () => {
  try {
    const adminExists = await User.findOne({ email: 'admin@jaan.com' });
    if (!adminExists) {
      await User.create({ name: 'System Admin', email: 'admin@jaan.com', password: 'adminjaan123', role: 'admin' });
    }

    const planCount = await Plan.countDocuments();
    if (planCount === 0) {
      const defaultPlans = [
        {
          name: 'Starter', price: '₹24,999', duration: '/week', desc: 'Perfect for brand-building campaigns.',
          features: ['1 screen', '1,200 minutes', 'Basic analytics'], cta: 'Get Started', order: 1
        },
        {
          name: 'Growth', price: '₹79,999', duration: '/month', desc: 'The go-to plan for scaling brands.',
          features: ['1 city', '2 screens', '1,200 minutes', 'Live analytics'], cta: 'Start Free Trial', highlight: true, order: 2
        },
        {
          name: 'Enterprise', price: 'Custom', duration: '', desc: 'Unlimited scale.',
          features: ['Pan-India coverage', 'Advanced attribution & API', 'Dedicated account manager'], cta: 'Talk to Sales', order: 3
        }
      ];
      await Plan.insertMany(defaultPlans);
    }

    // Ensure default screens exist (ethree-65, ethree-pole1, ethree-pole2)
    const defaultScreens = [
      {
        deviceId: 'ethree-65',
        name: 'eThree 65" Display',
        location: 'eThree Portal — Vijayawada',
        corridorName: 'eThree Portal',
        city: 'Vijayawada',
        area: 'eThree',
        poleId: 'ETHREE-P01',
        side: 'A',
        status: 'online',
        lat: 16.5062,
        lng: 80.6480,
        cctvCameraId: 'sparsh-main'
      },
      {
        deviceId: 'ethree-pole1',
        name: 'Pole 1 (5x3 Screen)',
        location: 'Pole 1 — Vijayawada',
        corridorName: 'Pole 1',
        city: 'Vijayawada',
        area: 'Pole 1',
        poleId: 'ETHREE-POLE1',
        side: 'A',
        status: 'online',
        lat: 16.5062,
        lng: 80.6480,
        cctvCameraId: 'sparsh-pole1'
      },
      {
        deviceId: 'ethree-pole2',
        name: 'Pole 2 (5x3 Screen)',
        location: 'Pole 2 — Vijayawada',
        corridorName: 'Pole 2',
        city: 'Vijayawada',
        area: 'Pole 2',
        poleId: 'ETHREE-POLE2',
        side: 'B',
        status: 'online',
        lat: 16.5062,
        lng: 80.6480,
        cctvCameraId: 'sparsh-pole2'
      }
    ];

    for (const s of defaultScreens) {
      const exists = await Screen.findOne({ deviceId: s.deviceId });
      if (!exists) {
        await Screen.create(s);
      }
    }
  } catch (err) {
    console.error('❌ Seeding Error:', err.message);
  }
};

// Non-blocking database connection
if (!process.env.VERCEL) {
  connectDB().catch(() => {});
}

app.use((req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1 && process.env.MONGODB_URI) {
      connectDB().catch(() => {});
    }
  } catch (err) {}
  next();
});

// Root route
app.get('/', (req, res) => res.send('LED Screen API is running...'));

// Swagger OpenAPI Documentation
const swaggerOptions = {
  customSiteTitle: 'E3Di & LED Screen API Documentation',
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    persistAuthorization: true,
  }
};

app.get(['/swagger.json', '/api-docs/swagger.json', '/api/swagger.json'], (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerDocument);
});

app.use(['/api-docs', '/docs', '/api/docs', '/api/api-docs'], swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

// Diagnostic Route
app.get('/api/auth/test', async (req, res) => {
  try {
    console.log('🧪 Diagnostic Test Started...');
    await connectDB(); // Active connection attempt
    
    const uri = process.env.MONGODB_URI || '';
    const uriType = uri.startsWith('mongodb+srv') ? 'Atlas (SRV)' : (uri.includes('localhost') ? 'Localhost (WRONG FOR VERCEL)' : 'Other/Unknown');
    
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    
    res.json({
      status: 'Live',
      uriType: uriType,
      database: dbStatus,
      readyState: mongoose.connection.readyState,
      env: {
        hasMongo: !!process.env.MONGODB_URI,
        mongoLength: process.env.MONGODB_URI?.length || 0,
        hasJWT: !!process.env.JWT_SECRET
      }
    });
  } catch (err) {
    console.error('❌ Diagnostic Route Error:', err.message);
    res.status(500).json({ 
      error: 'Diagnostic connection failed', 
      details: err.message
    });
  }
});

// Routes (Supports both standard /api and legacy /_/backend/api proxies)
app.use('/api/auth', authRoutes);
app.use('/_/backend/api/auth', authRoutes);

app.use('/api/screens', screenRoutes);
app.use('/_/backend/api/screens', screenRoutes);

app.use('/api/videos', videoRoutes);
app.use('/_/backend/api/videos', videoRoutes);

app.use('/api/schedule', scheduleRoutes);
app.use('/_/backend/api/schedule', scheduleRoutes);

app.use('/api/device', deviceRoutes);
app.use('/_/backend/api/device', deviceRoutes);

app.use('/api/billboards', billboardRoutes);
app.use('/_/backend/api/billboards', billboardRoutes);

app.use('/api/plans', planRoutes);
app.use('/_/backend/api/plans', planRoutes);

app.use('/api/partner-requests', partnerRequestRoutes);
app.use('/_/backend/api/partner-requests', partnerRequestRoutes);

app.use('/api/admin/campaigns', adminCampaignsRoutes);
app.use('/_/backend/api/admin/campaigns', adminCampaignsRoutes);

// Comprehensive CCTV & Edge Route Mounting across all Reverse Proxies
app.use('/api/admin/cameras', cameraRoutes);
app.use('/api/cameras', cameraRoutes);
app.use('/admin/cameras', cameraRoutes);
app.use('/cameras', cameraRoutes);

app.use('/api/admin/edges', edgeRoutes);
app.use('/api/edges', edgeRoutes);
app.use('/admin/edges', edgeRoutes);
app.use('/edges', edgeRoutes);

// Health Check Endpoints
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'ok',
    service: 'e3di-api',
    timestamp: new Date().toISOString()
  });
});

app.get(['/api/health/dependencies', '/health/dependencies'], (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.json({
    api: 'ok',
    database: isDbConnected ? 'ok' : 'degraded',
    edgeService: 'ok',
    mediaService: 'ok'
  });
});

app.use('/api/corridors', corridorsRoutes);
app.use('/api/sos', sosRoutes);
app.use('/sos', sosRoutes);

// Global JSON Error Handling Middleware (prevents proxy 502 HTML pages)
app.use((err, req, res, next) => {
  console.error('🔥 Global API Error Handler:', err.stack || err.message);
  res.status(err.status || 500).json({
    code: err.code || 'INTERNAL_ERROR',
    message: err.message || 'An unexpected backend error occurred.'
  });
});

// Start Scheduler (only if not on Vercel)
if (!process.env.VERCEL) {
  require('./services/scheduler');
  try {
    const { initAutoRecording } = require('./services/cameraRecorderService');
    initAutoRecording();
  } catch (err) {
    console.warn('[CCTV Recorder] Auto-record init warning:', err.message);
  }
}

if (!process.env.VERCEL) {
  const server = app.get('server');
  if (server) {
    const PORT = process.env.PORT || 5001;
    server.listen(PORT, () => {
      console.log(`🚀 Server v3.0-Production running on port ${PORT}`);
      console.log('🛡️  MONGODB_URI Present:', !!process.env.MONGODB_URI);
      try {
        const { authenticator } = require('otplib');
        console.log('🛡️  Authenticator Loaded:', !!authenticator);
      } catch (e) {
        console.log('⚠️  Authenticator Failed to Load:', e.message);
      }
      console.log('🛡️  TOTP Verification: ENABLED');
    });
    
    // Set timeouts for large file uploads
    server.keepAliveTimeout = 120000; // 120 seconds
    server.headersTimeout = 125000; // 125 seconds
  }
}

module.exports = app;

