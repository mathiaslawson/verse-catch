import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { AudioProcessor } from "./audioProcessor";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// TODO: implement whipser classs 
// const audioProcessor = new AudioProcessor();

io.on("connection", (socket: Socket) => {
  console.log("Client connected:", socket.id);

  socket.on("audio-stream", async (audioChunk: ArrayBuffer) => {
    try {
     
      socket.emit("transcription", {
        text: `Received audio chunk of ${audioChunk.byteLength} bytes`,
      });
    } catch (error) {
      console.error("Error processing audio:", error);
      socket.emit("error", {
        message: "Error processing audio",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });

  socket.emit("status", { connected: true });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  httpServer.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
