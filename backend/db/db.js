import mongoose from "mongoose"
import dotenv from 'dotenv';
dotenv.config();

export const connectDB=async()=>{

    mongoose.connect(process.env.MONGO_URI)
    .then(()=>{
        console.log("Connected to DB ",mongoose.connection.db.databaseName);
    }).catch((err)=>{
        console.log("Error connecting to DB",err);
        
    })
}