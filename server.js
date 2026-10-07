const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Voice Call Server OK');
});

const wss = new WebSocket.Server({ server, perMessageDeflate: false });
const users = new Map();
const pendingCalls = new Map();

function enviar(ws, obj) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(obj));
  }
}

wss.on('connection', (ws) => {
  let uid = null;

  ws.on('message', (data, isBinary) => {
    const binario = (typeof isBinary === 'boolean') ? isBinary : (typeof data !== 'string');

    if (!binario) {
      let msg = null;
      try {
        msg = JSON.parse(data.toString());
      } catch (e) {
        return;
      }

      if (msg.type === 'register') {
        uid = String(msg.uid);
        users.set(uid, ws);
        ws.uid = uid;

        if (pendingCalls.has(uid)) {
          const pending = pendingCalls.get(uid);
          ws.lastCaller = pending.from;
          enviar(ws, { type: 'incoming_call', from: pending.from, to: uid });
          pendingCalls.delete(uid);
        }

        enviar(ws, { type: 'welcome', uid: uid });
        return;
      }

      if (!uid) return;

      if (msg.type === 'call') {
        const alvo = String(msg.to);
        const target = users.get(alvo);
        if (target && target.readyState === WebSocket.OPEN) {
          target.lastCaller = uid;
          enviar(target, { type: 'incoming_call', from: uid, to: alvo });
        } else {
          pendingCalls.set(alvo, { from: uid, timestamp: Date.now() });
          enviar(ws, { type: 'user_offline', to: alvo });
        }
        return;
      }

      if (msg.type === 'accept') {
        const callerUid = msg.to ? String(msg.to) : ws.lastCaller;
        if (!callerUid) {
          enviar(ws, { type: 'no_pending' });
          return;
        }
        const caller = users.get(callerUid);
        if (caller && caller.readyState === WebSocket.OPEN) {
          caller.partnerUid = uid;
          ws.partnerUid = callerUid;
          ws.lastCaller = null;
          enviar(caller, { type: 'call_accepted', from: uid, to: callerUid });
          enviar(caller, { type: 'audio_start', peer: uid });
          enviar(ws, { type: 'audio_start', peer: callerUid });
        } else {
          ws.lastCaller = null;
          enviar(ws, { type: 'no_pending' });
        }
        return;
      }

      if (msg.type === 'reject') {
        const callerUid = msg.to ? String(msg.to) : ws.lastCaller;
        if (callerUid) {
          enviar(users.get(callerUid), { type: 'call_rejected' });
          pendingCalls.delete(callerUid);
        }
        ws.lastCaller = null;
        return;
      }

      if (msg.type === 'hangup') {
        const outroUid = msg.to ? String(msg.to) : ws.partnerUid;
        const other = outroUid ? users.get(outroUid) : null;
        if (other && other.readyState === WebSocket.OPEN) {
          enviar(other, { type: 'hangup' });
          other.partnerUid = null;
        }
        ws.partnerUid = null;
        return;
      }

      if (msg.type === 'heartbeat') return;

    } else {
      if (ws.partnerUid) {
        const partner = users.get(ws.partnerUid);
        if (partner && partner.readyState === WebSocket.OPEN) {
          partner.send(data, { binary: true });
        }
      }
    }
  });

  ws.on('close', () => {
    if (uid) {
      if (ws.partnerUid) {
        const partner = users.get(ws.partnerUid);
        if (partner && partner.readyState === WebSocket.OPEN) {
          enviar(partner, { type: 'user_offline' });
          partner.partnerUid = null;
        }
      }
      if (users.get(uid) === ws) {
        users.delete(uid);
      }
    }
  });
});

server.listen(PORT, () => {
  console.log('Servidor rodando na porta ' + PORT);
});
