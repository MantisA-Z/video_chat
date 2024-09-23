const { Server } = require("socket.io");
const io = new Server(8000, { cors: true });

const nameTable = new Map();
const roomTable = new Map();

io.on("connection", (socket) => {
  console.log("New socket connection: " + socket.id);

  socket.on("user:join-room", ({ name, roomId: roomName }) => {
    socket.join(roomName);
    nameTable.set(socket.id, { name, roomName });
    const roomUsers = roomTable.get(roomName) || [];
    roomTable.set(roomName, [...roomUsers, socket.id]);

    // Log the number of users in the room
    console.log(`Users in room ${roomName}:`, roomTable.get(roomName));

    // Emit `server:call-user` to the specific user when there are exactly 2 users
    if (roomTable.get(roomName).length === 2) {
      console.log(`Room ${roomName} has 2 users, emitting server:call-user to ${socket.id}`);
      io.to(roomTable.get(roomName)[0]).emit('server:call-user', {});
    } else if (roomTable.get(roomName).length > 2) {
      console.log('Room is full');
      // Optionally, handle the case where the room is full
    }
  });

  socket.on("user:offer", ({ offer }) => {
    const user = nameTable.get(socket.id);
    if (!user) return;
    const { roomName } = user;
    console.log(roomTable.get(roomName)[1])
    io.to(roomTable.get(roomName)[1]).emit("server:offer", { offer });
  });

  socket.on('user:answer', ({ answer }) => {
    const { roomName } = nameTable.get(socket.id);
    socket.broadcast.to(roomName).emit('server:answer', { answer });
  });

  socket.on("disconnect", () => {
    const user = nameTable.get(socket.id);
    if (user) {
      const { roomName } = user;
      const roomUsers = roomTable.get(roomName) || [];
      const filteredRoom = roomUsers.filter((val) => val !== socket.id);
      roomTable.set(roomName, filteredRoom);
      nameTable.delete(socket.id);
      if (filteredRoom.length === 0) {
        roomTable.delete(roomName);
      }
      console.log(roomTable);
    }
  });
});
