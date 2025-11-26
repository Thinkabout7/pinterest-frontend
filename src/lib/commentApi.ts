// src/lib/commentApi.ts

import { CommentType, UserType } from "@/types/commentTypes";

const apiUrl =
  import.meta.env.VITE_API_URL || "https://pinterest-backend-088x.onrender.com";

/* GET THREADED COMMENTS */
export const fetchComments = async (
  pinId: string,
  token?: string | null
): Promise<{ comments: CommentType[]; totalCount: number }> => {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${apiUrl}/api/comments/pin/${pinId}`, { headers });

  if (!res.ok) throw new Error("Failed to fetch comments");
  return res.json();
};

/* POST COMMENT */
export const postComment = async (pinId: string, text: string, token: string) => {
  const res = await fetch(`${apiUrl}/api/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ pinId, text }),
  });

  if (!res.ok) throw new Error("Failed to post comment");
  return res.json();
};

/* POST REPLY */
export const postReply = async (
  pinId: string,
  parentCommentId: string,
  text: string,
  token: string
) => {
  const res = await fetch(`${apiUrl}/api/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ pinId, parentCommentId, text }),
  });

  if (!res.ok) throw new Error("Failed to post reply");
  return res.json();
};

/* TOGGLE LIKE */
export const toggleLikeComment = async (commentId: string, token: string) => {
  const res = await fetch(`${apiUrl}/api/comments/${commentId}/like`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Failed to toggle like");
  return res.json();
};

/* DELETE COMMENT */
export const deleteComment = async (commentId: string, token: string) => {
  const res = await fetch(`${apiUrl}/api/comments/${commentId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Failed to delete comment");
};

/* GET USERS WHO LIKED COMMENT (REACTIONS) */
export const getCommentLikes = async (commentId: string): Promise<UserType[]> => {
  const res = await fetch(`${apiUrl}/api/comments/${commentId}/likes`);

  if (!res.ok) throw new Error("Failed to load reactions");
  const data = await res.json();
  return data.users || [];
};
