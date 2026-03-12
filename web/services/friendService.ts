import { apiFetch } from "./api";

export const sendFriendRequest = (sender: string, receiver: string) => {
  return apiFetch("/friends/request", {
    method: "POST",
    body: JSON.stringify({ sender, receiver }),
  });
};

export const acceptFriendRequest = (requestId: string) => {
  return apiFetch(`/friends/accept/${requestId}`, {
    method: "PUT",
  });
};

export const declineFriendRequest = (requestId: string) => {
  return apiFetch(`/friends/decline/${requestId}`, {
    method: "PUT",
  });
};

export const removeFriend = (userId: string, friendId: string) => {
  return apiFetch(`/friends/remove/${userId}/${friendId}`, {
    method: "DELETE",
  });
};

export const getFriends = (userId: string) => {
  return apiFetch(`/friends/${userId}`);
};

export const getFriendRequests = (userId: string) => {
  return apiFetch(`/friends/requests/${userId}`);
};

export const searchUsers = (keyword: string, currentUserId: string) => {
  return apiFetch(
    `/users/search?keyword=${encodeURIComponent(keyword.trim())}&currentUserId=${currentUserId}`
  );
};