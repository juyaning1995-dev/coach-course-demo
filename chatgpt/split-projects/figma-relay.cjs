const WebSocket = require('ws');

function sendCommand(channel, code, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('ws://localhost:3055');
    let joined = false;
    let resolved = false;

    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'join', channel }));
    });

    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'system' && msg.message && msg.message.includes('Joined channel')) {
        joined = true;
        // Send the plugin code
        setTimeout(() => {
          ws.send(JSON.stringify({
            type: 'plugin',
            channel,
            requestId: 'r' + Date.now(),
            data: { code }
          }));
        }, 300);
        return;
      }

      if (msg.type === 'system' && msg.message && msg.message.result && msg.message.result.includes('Connected to channel')) {
        return;
      }

      // Any other message could be a response
      if (joined && !resolved) {
        resolved = true;
        try {
          resolve(msg);
        } catch(e) {
          resolve(msg);
        }
        ws.close();
      }
    });

    ws.on('error', (err) => {
      if (!resolved) {
        resolved = true;
        reject(err);
      }
    });

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        ws.close();
        resolve({ error: 'timeout', type: 'timeout' });
      }
    }, timeout);
  });
}

// Run the command
const channel = process.argv[2] || 'sn53tvxc';
const code = process.argv[3];

if (!code) {
  console.log('Usage: node figma-relay.cjs <channel> <code>');
  process.exit(1);
}

sendCommand(channel, code).then(result => {
  console.log(JSON.stringify(result, null, 2));
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
