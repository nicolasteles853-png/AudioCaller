<div align="center">

# 📞 Voice Call Server

**Servidor WebSocket em tempo real para chamadas de voz entre usuários**

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-ws-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![Android](https://img.shields.io/badge/Android-Sketchware%20Pro-3DDC84?style=for-the-badge&logo=android&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

</div>

---

## 📖 Sobre

O **Voice Call Server** é um servidor leve e eficiente que gerencia sinalização de chamadas e retransmissão de áudio em tempo real via **WebSocket**. Ele conecta dois usuários identificados por UID, controla todo o ciclo da chamada (discagem, aceite, recusa e encerramento) e repassa os dados de áudio binário diretamente entre os participantes.

Desenvolvido para ser consumido por aplicativos Android criados com **Sketchware Pro**, mas compatível com qualquer cliente WebSocket.

---

## ✨ Recursos

- 🔌 **Conexão em tempo real** via WebSocket
- 🆔 **Registro de usuários** por UID
- 📲 **Sistema completo de chamadas**: chamar, aceitar, recusar e desligar
- 🕓 **Chamadas pendentes**: se o destinatário estiver offline, a chamada é entregue assim que ele se conectar
- 🎙️ **Retransmissão de áudio binário** entre os dois participantes
- 🔔 **Notificação de desconexão** ao parceiro quando um usuário cai
- 💓 **Suporte a heartbeat** para manter a conexão ativa
- ⚡ **Baixa latência**, com `perMessageDeflate` desativado
- 🩺 **Endpoint HTTP de status** para verificação de saúde do servidor

---

## 🧰 Tecnologias

| Tecnologia | Uso |
|---|---|
| Node.js | Ambiente de execução |
| ws | Biblioteca WebSocket |
| HTTP nativo | Health check |

---

## 🚀 Instalação

```bash
git clone https://github.com/nicolasteles853-png/AudioCaller.git
cd AudioCaller
npm install ws
node server.js
```

O servidor inicia na porta definida em `PORT` (padrão: `8080`).

```bash
PORT=3000 node server.js
```

---

## 🩺 Health Check

```http
GET /
```

Resposta:

```
Voice Call Server OK
```

---

## 📡 Protocolo de Mensagens

Todas as mensagens de controle são enviadas em **JSON (texto)**. O áudio é enviado em **frames binários**.

### Cliente → Servidor

| Tipo | Campos | Descrição |
|---|---|---|
| `register` | `uid` | Registra o usuário no servidor |
| `call` | `to` | Inicia uma chamada para outro UID |
| `accept` | `to` (opcional) | Aceita a chamada recebida |
| `reject` | `to` (opcional) | Recusa a chamada recebida |
| `hangup` | `to` (opcional) | Encerra a chamada em andamento |
| `heartbeat` | — | Mantém a conexão ativa |

### Servidor → Cliente

| Tipo | Campos | Descrição |
|---|---|---|
| `welcome` | `uid` | Confirmação de registro |
| `incoming_call` | `from`, `to` | Chamada recebida |
| `call_accepted` | `from`, `to` | Chamada aceita pelo destinatário |
| `call_rejected` | — | Chamada recusada |
| `audio_start` | `peer` | Início da transmissão de áudio |
| `user_offline` | `to` | Usuário offline ou desconectado |
| `no_pending` | — | Nenhuma chamada pendente para aceitar |
| `hangup` | — | O outro participante encerrou a chamada |

---

## 🔄 Fluxo da Chamada

```
Chamador                    Servidor                   Destinatário
   │── register ───────────────▶│                            │
   │                            │◀────────── register ───────│
   │── call (to) ──────────────▶│                            │
   │                            │──── incoming_call ────────▶│
   │                            │◀────────── accept ─────────│
   │◀──── call_accepted ────────│                            │
   │◀──── audio_start ──────────│──────── audio_start ──────▶│
   │◀═══════ áudio binário ════▶│◀═══════ áudio binário ════▶│
   │── hangup ─────────────────▶│──────── hangup ───────────▶│
```

---

## 💻 Exemplo de Uso

```javascript
const ws = new WebSocket("wss://seu-servidor.com");

ws.onopen = () => {
  ws.send(JSON.stringify({ type: "register", uid: "usuario1" }));
};

ws.onmessage = (event) => {
  if (typeof event.data === "string") {
    const msg = JSON.parse(event.data);
    console.log(msg);
  }
};

ws.send(JSON.stringify({ type: "call", to: "usuario2" }));
```

---

## 🌐 Deploy

O servidor funciona em qualquer plataforma que suporte Node.js e WebSocket, como Railway, Render, Fly.io, VPS ou containers Docker. A porta é lida automaticamente da variável de ambiente `PORT`.

---

## 📱 Cliente Android

Aplicativo cliente desenvolvido com **Sketchware Pro**, utilizando captura e reprodução de áudio em tempo real sobre a conexão WebSocket.

---

## 📄 Licença

Distribuído sob a licença **MIT**. Consulte o arquivo `LICENSE` para mais informações.

---

<div align="center">

Feito com ❤️ por **Nicolas**

</div>
