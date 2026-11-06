const localtunnel = require('localtunnel');
const https = require('https');

function getPublicIp() {
  return new Promise((resolve) => {
    https.get('https://api.ipify.org', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data.trim()));
    }).on('error', () => resolve('152.58.34.173'));
  });
}

async function startTunnel() {
  const ip = await getPublicIp();
  console.log('\nStarting CampusSplit tunnel for port 5173...');

  try {
    const tunnel = await localtunnel({ port: 5173 });

    console.log('\n======================================================');
    console.log(' CampusSplit Live Public Mobile Link');
    console.log('======================================================');
    console.log('🔗 URL to send your friend: ' + tunnel.url);
    console.log('🔑 Tunnel Password (Public IP): ' + ip);
    console.log('======================================================\n');
    console.log('Tunnel is active and listening for mobile connections...');

    tunnel.on('close', () => {
      console.log('⚠️ Tunnel closed. Reconnecting in 3 seconds...');
      setTimeout(startTunnel, 3000);
    });

    tunnel.on('error', (err) => {
      console.error('❌ Tunnel error:', err.message);
      tunnel.close();
    });
  } catch (err) {
    console.error('❌ Failed to establish tunnel:', err.message);
    setTimeout(startTunnel, 5000);
  }
}

startTunnel();
