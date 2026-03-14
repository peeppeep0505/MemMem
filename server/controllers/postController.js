const mongoose = require("mongoose");
const Post = require("../models/Post");
const User = require("../models/User");

async function enrichComment(comment) {
  const raw = comment?.toObject ? comment.toObject() : comment;
  const owner = await User.findById(raw.userId).lean().catch(() => null);

  return {
    ...raw,
    _id: raw._id?.toString?.() || String(raw._id),
    userId: raw.userId?.toString?.() || String(raw.userId),
    user: {
      _id: owner?._id?.toString() || String(raw.userId),
      username: owner?.username || "unknown",
      email: owner?.email || "",
      profilePic: owner?.profilePic || "",
      backgroundColor: owner?.backgroundColor || "#9ca3af",
    },
    replies: await Promise.all(
      (raw.replies || []).map((reply) => enrichComment(reply))
    ),
  };
}

async function enrichPost(post) {
  const raw = post.toObject ? post.toObject() : post;
  const owner = await User.findById(raw.userId).lean().catch(() => null);

  return {
    ...raw,
    _id: raw._id?.toString?.() || String(raw._id),
    userId: raw.userId?.toString?.() || String(raw.userId),
    text: raw.text || "",
    images: Array.isArray(raw.images) ? raw.images : [],
    likes: Array.isArray(raw.likes) ? raw.likes.map(String) : [],
    comments: await Promise.all(
      (Array.isArray(raw.comments) ? raw.comments : []).map((c) => enrichComment(c))
    ),
    user: {
      _id: owner?._id?.toString() || String(raw.userId),
      username: owner?.username || "unknown",
      email: owner?.email || "",
      profilePic: owner?.profilePic || "",
      backgroundColor: owner?.backgroundColor || "#9ca3af",
    },
  };
}

function appendReplyImmutable(comments, parentCommentId, newComment) {
  return comments.map((comment) => {
    const currentId = String(comment._id);

    if (currentId === String(parentCommentId)) {
      return {
        ...comment,
        replies: [...(comment.replies || []), newComment],
      };
    }

    return {
      ...comment,
      replies: appendReplyImmutable(comment.replies || [], parentCommentId, newComment),
    };
  });
}

exports.createPost = async (req, res) => {
  try {
    const imageFiles = Array.isArray(req.files) ? req.files : [];

    const post = await Post.create({
      userId: req.body.userId,
      text: req.body.text || "",
      images: imageFiles.map((f) => {
        const b64 = f.buffer.toString("base64");
        return `data:${f.mimetype};base64,${b64}`;
      }),
      likes: [],
      comments: [],
    });

    res.status(201).json(await enrichPost(post));
  } catch (err) {
    console.error("createPost error:", err);
    res.status(500).json({ message: "Failed to create post" });
  }
};

exports.getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    const result = await Promise.all(posts.map(enrichPost));
    res.json(result);
  } catch (err) {
    console.error("getMyPosts error:", err);
    res.status(500).json({ message: "Failed to fetch my posts" });
  }
};

exports.getFriendPosts = async (req, res) => {
  try {
    const me = await User.findById(req.params.userId).lean();
    const friendIds = Array.isArray(me?.friends) ? me.friends : [];

    if (!friendIds.length) {
      return res.json([]);
    }

    const posts = await Post.find({
      userId: { $in: friendIds },
    }).sort({ createdAt: -1 });

    const result = await Promise.all(posts.map(enrichPost));
    res.json(result);
  } catch (err) {
    console.error("getFriendPosts error:", err);
    res.status(500).json({ message: "Failed to fetch friend posts" });
  }
};

exports.deletePost = async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "deleted" });
  } catch (err) {
    console.error("deletePost error:", err);
    res.status(500).json({ message: "Failed to delete post" });
  }
};

exports.likePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const alreadyLiked = post.likes.some((id) => String(id) === String(userId));

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => String(id) !== String(userId));
    } else {
      post.likes.push(userId);
    }

    await post.save();
    res.json(await enrichPost(post));
  } catch (err) {
    console.error("likePost error:", err);
    res.status(500).json({ message: "Failed to like post" });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { userId, text, parentCommentId } = req.body;
    const postId = req.params.id;

    if (!userId || !String(text || "").trim()) {
      return res.status(400).json({ message: "userId and text are required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const newComment = {
      _id: new mongoose.Types.ObjectId(),
      userId,
      text: String(text).trim(),
      createdAt: new Date(),
      replies: [],
    };

    if (!parentCommentId) {
      post.comments = [...(post.comments || []), newComment];
    } else {
      post.comments = appendReplyImmutable(
        post.comments || [],
        parentCommentId,
        newComment
      );
    }

    await post.save();
    res.json(await enrichPost(post));
  } catch (err) {
    console.error("addComment error:", err);
    res.status(500).json({ message: "Failed to add comment" });
  }
};