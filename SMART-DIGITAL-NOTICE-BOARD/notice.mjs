import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'DELETE'],
  },
});

// In-memory notice store
let activeNotices = [
  {
    _id: '1',
    title: 'Welcome to Smart Digital Notice Board',
    content: 'This system updates announcements in real time across all display boards.',
    category: 'General',
    department: 'All Departments',
    expiryDate: '',
  },
];

let activeEmergency = null;

// REST API Endpoints
app.get('/api/notices/active', (req, res) => {
  res.json(activeNotices);
});

app.post('/api/notices', (req, res) => {
  const newNotice = {
    _id: Date.now().toString(),
    title: req.body.title,
    content: req.body.content,
    category: req.body.category || 'General',
    department: req.body.department || 'All Departments',
    expiryDate: req.body.expiryDate || '',
  };
  activeNotices.unshift(newNotice);
  res.status(201).json(newNotice);
});

app.delete('/api/notices/:id', (req, res) => {
  const { id } = req.params;
  activeNotices = activeNotices.filter((notice) => notice._id !== id);
  res.json({ message: 'Notice deleted successfully' });
});

// Socket.io Real-Time Event Handlers
io.on('connection', (socket) => {
  console.log(`Client Connected: ${socket.id}`);

  if (activeEmergency) {
    socket.emit('EMERGENCY_ALERT', activeEmergency);
  }

  socket.on('CREATE_NOTICE', (notice) => {
    socket.broadcast.emit('NEW_NOTICE', notice);
  });

  socket.on('DELETE_NOTICE', (id) => {
    socket.broadcast.emit('NOTICE_DELETED', id);
  });

  socket.on('EMERGENCY_ALERT', (alertData) => {
    activeEmergency = alertData;
    io.emit('EMERGENCY_ALERT', alertData);
  });

  socket.on('CLEAR_EMERGENCY', () => {
    activeEmergency = null;
    io.emit('CLEAR_EMERGENCY');
  });

  socket.on('disconnect', () => {
    console.log(`Client Disconnected: ${socket.id}`);
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Backend Server running on http://localhost:${PORT}`);
});