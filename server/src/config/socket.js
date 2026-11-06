const { Server } = require('socket.io');

let io = null;
let activeConnections = 0;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    activeConnections++;
    console.log(`🔌 Client connected to WebSocket: ${socket.id} (Total active: ${activeConnections})`);
    
    // Broadcast updated live connections to admin channel
    io.to('admin_channel').emit('ADMIN_LIVE_STATS', { activeConnections });

    // Join group room
    socket.on('join_group', (groupId) => {
      if (groupId) {
        socket.join(`group_${groupId}`);
        console.log(`👥 Socket ${socket.id} joined group room: group_${groupId}`);
      }
    });

    // Leave group room
    socket.on('leave_group', (groupId) => {
      if (groupId) {
        socket.leave(`group_${groupId}`);
        console.log(`👋 Socket ${socket.id} left group room: group_${groupId}`);
      }
    });

    // Join personal user room (for personal notifications)
    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
        console.log(`👤 Socket ${socket.id} registered user room: user_${userId}`);
      }
    });

    // Join admin channel
    socket.on('join_admin', () => {
      socket.join('admin_channel');
      socket.emit('ADMIN_LIVE_STATS', { activeConnections });
      console.log(`🛡️ Socket ${socket.id} joined admin channel`);
    });

    socket.on('disconnect', () => {
      activeConnections = Math.max(0, activeConnections - 1);
      console.log(`❌ Client disconnected: ${socket.id} (Remaining: ${activeConnections})`);
      io.to('admin_channel').emit('ADMIN_LIVE_STATS', { activeConnections });
    });
  });

  return io;
}

function getIO() {
  return io;
}

function emitToGroup(groupId, event, data) {
  if (io && groupId) {
    io.to(`group_${groupId}`).emit(event, data);
  }
}

function emitToUser(userId, event, data) {
  if (io && userId) {
    io.to(`user_${userId}`).emit(event, data);
  }
}

function emitToAdmin(event, data) {
  if (io) {
    io.to('admin_channel').emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
}

function broadcastEvent(event, data) {
  if (io) {
    io.emit(event, data);
  }
}

function getLiveStats() {
  return {
    activeConnections,
  };
}

module.exports = {
  initSocket,
  getIO,
  emitToGroup,
  emitToUser,
  emitToAdmin,
  broadcastEvent,
  getLiveStats,
};
