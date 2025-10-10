import cookieParser from "cookie-parser";
import { app } from "./app.js";
import http, { createServer } from "http";
import { Server } from "socket.io";
import cron from "node-cron";
import { escalateIssuePriority, escalateOverdueTasksService,reopenUnresolvedIssues} from "./controllers/issue.contoller.js";
import { sendDeadlineRemindersService } from "./controllers/notification.controller.js";

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST"],
        credentials: true,
    },
})

io.on("connection", (socket) => {
    socket.on("join", (userId) => {
      
      socket.join(userId);
      socket.emit("joined-room", userId);
    });
  
    socket.on("disconnect", () => {
      
    });
  });
export {io}


// Run escalation service every hour
cron.schedule("0 * * * *", async () => {
  try {
    const result = await escalateOverdueTasksService();
  } catch (err) {
    console.error("[CRON] Escalation error:", err);
  }
});

// Run deadline reminders twice daily (9 AM and 6 PM)
cron.schedule("0 9,18 * * *", async () => {
  try {
    const result = await sendDeadlineRemindersService();
  } catch (err) {
    console.error("[CRON] Deadline reminders error:", err);
  }
});

cron.schedule("0 9,18 * * *", async () => {
  try {
    const result = await reopenUnresolvedIssues();
  } catch (err) {
    console.error("[CRON] Reopending Unresolved issues error:", err);
  }
});

cron.schedule("0 0,12 * * *", async () => {
  try {
    const result = await escalateIssuePriority();
  }
  catch (err) {
    console.error("[CRON] Issue priority escalation error:", err);
  }
});

server.listen(process.env.PORT, () => {
    
});

// (async () => {
//   try {
//     console.log("Manual escalation started");
//     const result = await escalateIssuePriority();
//     console.log("Manual escalation finished, summary:", result);
//   } catch (err) {
//     console.error("Manual escalation error:", err);
//   }
// })();

// (async () => {
//   try {
//     console.log("Manual Running escalateOverdueTasksService");
//     const result = await escalateOverdueTasksService();
//     console.log("Manual escalateOverdueTasksService summary:", result);
//   } catch (err) {
//     console.error("Manual escalateOverdueTasksService error:", err);
//   }
// })();