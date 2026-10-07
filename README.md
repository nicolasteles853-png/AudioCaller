<div align="center">

# 📞 AudioCaller

**Chamadas de voz em tempo real para Android: servidor WebSocket em Node.js + cliente Java para Sketchware Pro**

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-Realtime-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![Android](https://img.shields.io/badge/Android-Sketchware%20Pro-3DDC84?style=for-the-badge&logo=android&logoColor=white)
![Java](https://img.shields.io/badge/Java-Client-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)

</div>

---

## 📖 Sobre

O **AudioCaller** é um sistema completo de chamadas de voz em tempo real, dividido em duas partes:

- **Servidor (`server.js`)**: gerencia a sinalização das chamadas e retransmite o áudio binário entre dois usuários identificados por UID.
- **Cliente Android (`VoiceCallManager.java`)**: classe pronta para uso no **Sketchware Pro** que cuida da conexão, da captura e reprodução de áudio, da reconexão automática e dos eventos da chamada.

---

## ✨ Recursos

### Servidor
- 🔌 Conexão em tempo real via WebSocket
- 🆔 Registro de usuários por UID
- 📲 Ciclo completo de chamada: chamar, aceitar, recusar e desligar
- 🕓 Chamadas pendentes entregues quando o destinatário se conecta
- 🎙️ Retransmissão de áudio binário entre os participantes
- 🔔 Aviso ao parceiro quando o outro lado desconecta
- 💓 Suporte a heartbeat
- ⚡ Baixa latência, com `perMessageDeflate` desativado
- 🩺 Endpoint HTTP de status

### Cliente Android
- 🎤 Captura de microfone com `VOICE_COMMUNICATION` (cancelamento de eco nativo)
- 🔊 Reprodução em `STREAM_VOICE_CALL` com ganho de volume e proteção contra distorção (clipping)
- 🔁 Reconexão automática ao perder a conexão
- 💓 Heartbeat a cada 10 segundos
- 🔇 Controle de mudo e viva-voz
- 📥 Fila de áudio com limite de pacotes para evitar atraso acumulado
- ⏳ Chamada e aceite automáticos após reconexão, caso a conexão caia no meio da ação
- 🧵 Código seguro para múltiplas threads (`synchronized`, `AtomicBoolean`, `ConcurrentLinkedQueue`)
- 📡 Todos os eventos entregues na thread principal via `OnCallListener`

---

## 🧰 Tecnologias

| Tecnologia | Uso |
|---|---|
| Node.js | Ambiente de execução do servidor |
| ws | Biblioteca WebSocket do servidor |
| Java-WebSocket | Biblioteca WebSocket do cliente Android |
| AudioRecord / AudioTrack | Captura e reprodução de áudio PCM |
| Sketchware Pro | Desenvolvimento do aplicativo Android |

---

## 🏗️ Arquitetura

```
┌──────────────────┐        WebSocket         ┌──────────────────┐        WebSocket         ┌──────────────────┐
│  App Android A   │◀────────────────────────▶│  Servidor Node   │◀────────────────────────▶│  App Android B   │
│ VoiceCallManager │  JSON (sinalização)      │    server.js     │  JSON (sinalização)      │ VoiceCallManager │
│                  │  Binário (áudio PCM)     │                  │  Binário (áudio PCM)     │                  │
└──────────────────┘                          └──────────────────┘                          └──────────────────┘
```

---

## 🚀 Servidor

### Instalação

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

### Health Check

```http
GET /
```

Resposta:

```
Voice Call Server OK
```

### Deploy

Funciona em qualquer plataforma com suporte a Node.js e WebSocket, como Railway, Render, Fly.io, VPS ou Docker. A porta é lida automaticamente da variável de ambiente `PORT`.

---

## 📡 Protocolo de Mensagens

As mensagens de controle são enviadas em **JSON (texto)**. O áudio é enviado em **frames binários**.

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

## 📱 Cliente Android (`VoiceCallManager`)

Pacote: `com.service.audiocalling.androix`

### Especificações de áudio

| Parâmetro | Valor |
|---|---|
| Taxa de amostragem | 16000 Hz |
| Canais | Mono |
| Formato | PCM 16 bits |
| Fonte de captura | `MediaRecorder.AudioSource.VOICE_COMMUNICATION` |
| Saída | `AudioManager.STREAM_VOICE_CALL` |
| Limite da fila de reprodução | 50 pacotes |
| Ganho de reprodução | 5.5x, com limitação em 16 bits |

### Comportamento interno

| Recurso | Funcionamento |
|---|---|
| Conexão | Conecta ao servidor ao instanciar a classe e envia `register` com o UID |
| Reconexão | Tenta reconectar automaticamente após 1 segundo ao cair |
| Heartbeat | Envia `heartbeat` a cada 10 segundos e força reconexão se estiver offline |
| Perda de conexão | Timeout de 30 segundos configurado no cliente |
| Chamada offline | Se `call()` for chamado sem conexão, a chamada fica pendente e é feita após reconectar |
| Aceite offline | Se `acceptCall()` for chamado sem conexão, o aceite é executado após reconectar |
| Início do áudio | Começa automaticamente após `call_accepted` ou `audio_start` |
| Fim da chamada | Libera `AudioRecord` e `AudioTrack`, limpa a fila e restaura o modo normal de áudio |

### Eventos (`OnCallListener`)

| Evento | Quando dispara |
|---|---|
| `onConnected()` | Primeira conexão com o servidor concluída |
| `onIncomingCall(String fromUid)` | Chamada recebida de outro usuário |
| `onCallAccepted()` | O destinatário aceitou a chamada |
| `onCallRejected()` | O destinatário recusou a chamada |
| `onUserOffline()` | O usuário está offline ou desconectou |
| `onHangup()` | O outro participante encerrou a chamada |
| `onError(String error)` | Erro, como UID inválido ou nenhuma chamada pendente |

### Métodos públicos

| Método | Descrição |
|---|---|
| `call(String targetUid)` | Inicia uma chamada |
| `acceptCall()` | Aceita a chamada recebida |
| `rejectCall()` | Recusa a chamada recebida |
| `hangup()` | Encerra a chamada atual |
| `setMuted(boolean)` / `isMuted()` | Controla o mudo do microfone |
| `setSpeakerphone(boolean)` / `isSpeakerphoneOn()` | Controla o viva-voz |
| `hasIncomingCall()` | Informa se há chamada recebida pendente |
| `getIncomingCallUid()` | Retorna o UID de quem está ligando |
| `isCallActive()` | Informa se há chamada em andamento |
| `isConnected()` | Informa se o WebSocket está conectado |
| `getMyUid()` | Retorna o UID do usuário local |
| `disconnect()` | Encerra tudo e destrói a conexão |

### Requisitos no Sketchware Pro

**Permissões**

```
android.permission.INTERNET
android.permission.RECORD_AUDIO
android.permission.MODIFY_AUDIO_SETTINGS
```

**Biblioteca**

```
org.java-websocket:Java-WebSocket
```

A permissão `RECORD_AUDIO` precisa ser solicitada em tempo de execução antes de iniciar uma chamada.

### Exemplo de uso

```java
VoiceCallManager voiceManager;

voiceManager = new VoiceCallManager(this, "wss://seu-servidor.com", myUid, new VoiceCallManager.OnCallListener() {
    @Override
    public void onConnected() {
    }

    @Override
    public void onIncomingCall(String fromUid) {
    }

    @Override
    public void onCallAccepted() {
    }

    @Override
    public void onCallRejected() {
    }

    @Override
    public void onUserOffline() {
    }

    @Override
    public void onHangup() {
    }

    @Override
    public void onError(String error) {
    }
});

voiceManager.call("uid_do_destinatario");
voiceManager.acceptCall();
voiceManager.rejectCall();
voiceManager.hangup();
voiceManager.setMuted(true);
voiceManager.setSpeakerphone(true);
voiceManager.disconnect();
```

---

## 💻 Exemplo de Cliente WebSocket Genérico

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

## 📄 Licença

Este projeto é **privado e proprietário**. Todos os direitos reservados. É proibido clonar, copiar, modificar, distribuir ou reivindicar a autoria deste software sem autorização expressa e por escrito do autor. Consulte o arquivo `LICENSE` para mais informações.

---

<div align="center">

Feito com ❤️ por **Nicolas**

</div>
