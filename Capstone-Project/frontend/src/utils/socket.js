import { io } from 'socket.io-client';

const URL = 'https://realtime-chat-backend-dvxw.onrender.com';

export const socket = io(URL, {
  autoConnect: false,
  auth: {
    token: localStorage.getItem('user')
      ? JSON.parse(localStorage.getItem('user')).token
      : '',
  },
});
