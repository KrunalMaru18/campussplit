const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const { initDbClient, createTables, query } = require('./config/db');
const { seed } = require('./database/seed');
const { initSocket } = require('./config/socket');

const authRoutes = require('./routes/authRoutes');
const groupRoutes = require('./routes/groupRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const settlementRoutes = require('./routes/settlementRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);

// Initialize Socket.io Real-Time Engine
initSocket(httpServer);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging for API visibility
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

function getLocalNetworkIp() {
  const os = require('os');
  const nets = os.networkInterfaces();

  // 1. First priority: Wi-Fi / WLAN adapter
  for (const name of Object.keys(nets)) {
    const lower = name.toLowerCase();
    if (lower.includes('wi-fi') || lower.includes('wlan') || lower.includes('wireless')) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  }

  // 2. Second priority: Physical network (not virtual/vmware/vbox/bluetooth)
  for (const name of Object.keys(nets)) {
    const lower = name.toLowerCase();
    const isVirtual = lower.includes('vmware') || lower.includes('virtual') || lower.includes('vbox') || lower.includes('vethernet') || lower.includes('loopback') || lower.includes('pseudo') || lower.includes('bluetooth');
    if (!isVirtual) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  }

  // 3. Fallback to any non-internal IPv4
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }

  return 'localhost';
}

// Health check & Network info
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'CampusSplit API Server', time: new Date() });
});

app.get('/api/network-info', (req, res) => {
  const ip = getLocalNetworkIp();
  res.json({
    networkIp: ip,
    clientPort: 5173,
    serverPort: PORT,
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

// Serve static frontend assets from client/dist (for Web, iOS PWA, and direct cloud links)
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// Single Page Application (SPA) catch-all fallback
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal server error: ' + (err.message || 'Unknown') });
});

// Start Server
async function start() {
  try {
    await initDbClient();
    await createTables();

    // Auto-seed if database is empty
    const checkUsers = await query('SELECT COUNT(*) as count FROM users');
    const userCount = Number(checkUsers.rows[0]?.count || checkUsers.rows[0]?.['count(*)'] || 0);

    if (userCount === 0) {
      console.log('⚡ Empty database detected. Seeding sample college data...');
      await seed();
    } else {
      console.log(` Database already populated with ${userCount} users.`);
    }

    const networkIp = getLocalNetworkIp();
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 CampusSplit Real-Time API Server is running:`);
      console.log(`   ➜ Local:   http://localhost:${PORT}`);
      console.log(`   ➜ Network: http://${networkIp}:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start CampusSplit server:', err);
    process.exit(1);
  }
}

start();
