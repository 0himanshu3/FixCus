import cookieParser from "cookie-parser";
import express from "express";

import { config } from "dotenv";
import cors from "cors"
import { connectDB } from "./db/db.js";
import authRouter from './routes/user.route.js'
import municipalityRouter from './routes/municipalityReq.route.js'
import issueRouter from './routes/issue.route.js'
import notificationRouter from './routes/notification.route.js'
export const app=express();

config({path:"./config/config.env"});

app.use(cors({
    origin:process.env.FRONTEND_URL,
    methods:["GET","POST","PUT","DELETE","PATCH"],
    credentials:true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use("/api/v1/auth",authRouter)
app.use("/api/v1/municipality",municipalityRouter)
app.use("/api/v1/issues", issueRouter)
app.use("/api/v1/notification", notificationRouter)
connectDB()