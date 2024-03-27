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


// routes import 

import userRouter from "./routes/user.routes.js"
import videoRouter from "./routes/video.routes.js"
import likeRouter from "./routes/like.routes.js"
import commentRouter from "./routes/comment.routes.js"
import tweetRouter from "./routes/tweet.routes.js"

// routes declaration

app.use("/api/v1/users", userRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/tweets", tweetRouter)



export { app }; 