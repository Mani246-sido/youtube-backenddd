import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()
//app.use middleware ke liye use hota ye hr baar jb call krenge to ye chalega
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(express.json({limit: "16kb"})) //body ko json me convert karta hai or limit bhi 
app.use(express.urlencoded({extended: true,  limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


//routes

import userRouter from "./routes/user.routes.js"




//routes declaration;
app.use("/api/v1/users", userRouter)

//http://localhost:8000/api/v1/users/login



export {app}