import cookieParser from "cookie-parser";
import { app } from "./app.js";
import http, { createServer } from "http";
import { Server } from "socket.io";
import cron from "node-cron";
import { escalateOverdueTasksService } from "./controllers/issue.contoller.js";

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
    },
})

io.on("connection", (socket) => {
    // console.log("Client connected:", socket.id);
    socket.on("join", (userId) => {
      console.log(`User ${userId} joined room`);
      socket.join(userId);
      socket.emit("joined-room", userId);
    });
  
    socket.on("disconnect", () => {
      // console.log("Client disconnected:", socket.id);
    });
  });
export {io}


cron.schedule("0 * * * *", async () => {
  try {
    console.log("[CRON] Running escalateOverdueTasksService");
    const result = await escalateOverdueTasksService();
    console.log("[CRON] Escalation summary:", result);
  } catch (err) {
    console.error("[CRON] Escalation error:", err);
  }
});

server.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on port ${process.env.PORT || 3000}`);
    console.log(`Socket.IO server is ready`);
});