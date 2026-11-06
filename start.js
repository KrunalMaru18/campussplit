const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting CampusSplit Full-Stack Application...\n');

// 1. Start Server
const serverProcess = spawn('npm', ['start'], {
  cwd: path.join(__dirname, 'server'),
  shell: true,
  stdio: 'inherit',
});

// 2. Start Vite Client
const clientProcess = spawn('npx', ['vite', '--host'], {
  cwd: path.join(__dirname, 'client'),
  shell: true,
  stdio: 'inherit',
});

function cleanup() {
  console.log('\n🛑 Shutting down CampusSplit...');
  serverProcess.kill();
  clientProcess.kill();
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
