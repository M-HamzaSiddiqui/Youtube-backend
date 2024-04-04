// require('dotenv').config({path: './env'})


import dotenv from 'dotenv';
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import connectDB from './db/index.js';
import { app } from './app.js';


dotenv.config({
    path: './env'
});

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running at port : ${process.env.PORT}`);
        });
        app.on("error", (error) => {
            console.log("The app is unable to connect with mongodb: ", error);
        });
    })
    .catch((error) => {
        console.log("MongoDB connection failed !!! ", error);
    });
























// (async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//         app.on("error", (error) => {
//             console.log("ERRR: application unable to connect to the database", error);
//             throw error;
//         });

//         app.listen(process.env.PORT, () => {
//             console.log(`App is listening on ${process.env.PORT}`)
//         })
//     } catch (error) {
//         console.log("Error: ", error);
//         throw error;
//     }
// })();