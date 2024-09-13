import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import colors from 'colors'
import dotenv from 'dotenv';
import connection from './database/db.js';
import Router from './routes/routes.js';
import path from 'path';
const app = express();
import http from 'http';
import { Server } from 'socket.io';
import messageModel from './models/messageModel.js';
import bodyParser from 'body-parser';

app.use(cors())

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

app.use(morgan('dev'))
app.use(express.static('public'));
app.use('/', Router);

dotenv.config();

// socket io

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
})


io.on('connection', (socket) => {
    console.log('User connected');


    // Emit existing messages when a user connects
    messageModel.find({}).sort({ createdAt: 'asc' }).then((messages) => {
        socket.emit('initial messages', messages);
    });
    // Handle incoming messages
    socket.on('chat message', async (messageData) => {
        try {
            // Save message to MongoDB
            const newMessage = new messageModel({
                sender: messageData.senderId,
                receiver: messageData.receiverId,
                text: messageData.text,
            });

            await newMessage.save();

            // Broadcast the message to sender and receiver
            io.to(messageData.senderSocketId).emit('chat message', newMessage);
            io.to(messageData.receiverSocketId).emit('chat message', newMessage);
        } catch (error) {
            console.error('Error saving message:', error);
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});


const PORT = 8000;
server.listen(PORT, () => console.log(`server is runnning ${PORT}`.bgCyan.white));

const username = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;

const DBURL = process.env.URL;


connection(username, password, DBURL);