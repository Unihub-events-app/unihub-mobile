import { io } from "socket.io-client";
import { API_URL } from "./config";

let socket = null;

export function getSocket(token) {
  if (!socket || !socket.connected) {
    socket = io(API_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinCommunity(communityId) {
  if (socket) socket.emit("join_community", { community_id: communityId });
}

export function sendMessage(communityId, content, token) {
  if (socket) socket.emit("send_message", { community_id: communityId, content, user_token: token });
}

export function onMessage(cb) {
  if (socket) socket.on("receive_message", cb);
}

export function offMessage(cb) {
  if (socket) socket.off("receive_message", cb);
}

export function onNewNotification(cb) {
  if (socket) socket.on("new_notification", cb);
}

export function offNewNotification(cb) {
  if (socket) socket.off("new_notification", cb);
}
