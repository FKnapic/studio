
// This file would contain your WebSocket client (e.g., socket.io-client) setup.

// Example using socket.io-client:
import { io, Socket } from 'socket.io-client';

// The URL of your WebSocket server.
// For production, set NEXT_PUBLIC_SOCKET_URL in your deployment environment variables.
// For local development, it defaults to 'http://localhost:3001' if the env var is not set.
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    console.log(`Attempting to connect to WebSocket server at: ${SOCKET_URL}`);
    socket = io(SOCKET_URL, {
      reconnectionAttempts: 5,
      transports: ['websocket'], // Prefer WebSocket transport
      // Add other configurations as needed, like path or auth.
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket server with id:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason);
      // Optional: Set socket to null here if you want to re-initialize on next getSocket call,
      // but be careful as this might lead to multiple connections if not handled well.
      // socket = null; 
    });

    socket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err.message, err.cause);
      // Potentially set socket to null or implement retry logic UI.
      // socket = null;
    });

    // You might add other global listeners here, or handle them in specific components/hooks
  }
  return socket;
};

// Optional: A function to explicitly disconnect the socket if needed
export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
    console.log('Manually disconnected WebSocket.');
  }
  socket = null; // Clear the instance
};

// It's good practice to call getSocket() when your application initializes
// or within a React context provider to manage the socket instance.
// For example, in a top-level component or context:
//
// useEffect(() => {
//   const currentSocket = getSocket();
//
//   // Example: Listen for a welcome message from the server
//   currentSocket.on('welcome', (message) => {
//     console.log('Welcome message from server:', message);
//   });
//
//   return () => {
//     // Optional: Disconnect if the socket should only live with certain components
//     // or if the app is closing. Consider app lifecycle.
//     // console.log("Cleaning up socket connection");
//     // disconnectSocket(); // Or currentSocket.disconnect(); if you don't reset the global `socket`
//   };
// }, []);

console.log("Socket.ts loaded. WebSocket client configured for URL:", SOCKET_URL);
