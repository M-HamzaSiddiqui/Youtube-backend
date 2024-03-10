import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credential: true
}))
app.use(express.json({            // to accept json response in your application
    limit: "16kb"
}))
app.use(express.urlencoded({      // to accept data from url
    extended: true,
    limit: "16kb"
}))
app.use(express.static("public"))   // to store files locally on server
app.use(cookieParser())              // to set and retrieve cookies on the users browser



export { app }; 