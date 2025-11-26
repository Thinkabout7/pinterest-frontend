// types/commentTypes.ts
export interface UserType {
  _id: string;
  username: string;
  profilePicture?: string;
}

export interface CommentType {
  _id: string;
  text: string;
  user: UserType;
  parentCommentId?: string | null;        // backend sends this
  replyToUsername?: string | null;        // backend sends this
  likesCount: number;
  isLiked: boolean;
  createdAt: string;
  replies: CommentType[];                 // nested replies
}

export type ReplyType = CommentType;
