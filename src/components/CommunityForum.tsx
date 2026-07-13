import React, { useState, useEffect } from "react";
import { CommunicationItem, UserProfile, Comment } from "../types";
import { collection, onSnapshot, doc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Megaphone, MessageSquare, ThumbsUp, Send, PlusCircle, Shield, User, ArrowLeft } from "lucide-react";

interface CommunityForumProps {
  activeUser: UserProfile;
}

export default function CommunityForum({ activeUser }: CommunityForumProps) {
  const [communications, setCommunications] = useState<CommunicationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "announcement" | "discussion">("all");

  // Create notice form
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<"announcement" | "discussion">("discussion");

  // Single post viewing detail state
  const [activePost, setActivePost] = useState<CommunicationItem | null>(null);
  const [newComment, setNewComment] = useState("");

  // Load communications
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "communications"), (snap) => {
      const data: CommunicationItem[] = [];
      snap.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as CommunicationItem);
      });
      // Sort by date descending
      data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setCommunications(data);
    });
    return unsub;
  }, []);

  // Filter list
  const displayedPosts = communications.filter((p) => {
    return filterType === "all" || p.type === filterType;
  });

  // 1. Submit notice
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    try {
      setLoading(true);

      const newPost = {
        authorId: activeUser.id,
        authorName: activeUser.name,
        authorRole: activeUser.role,
        title,
        content,
        type: activeUser.role === "board_member" ? postType : "discussion",
        date: new Date().toISOString(),
        likes: 0,
        comments: [],
      };

      await addDoc(collection(db, "communications"), newPost);

      setShowForm(false);
      setTitle("");
      setContent("");
      setLoading(false);
    } catch (err) {
      console.error("Error creating forum post:", err);
      setLoading(false);
    }
  };

  // 2. Upvote post
  const handleLikePost = async (post: CommunicationItem, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening post
    try {
      const postRef = doc(db, "communications", post.id);
      await updateDoc(postRef, {
        likes: (post.likes || 0) + 1,
      });
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  // 3. Comment on post
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePost || !newComment.trim()) return;

    try {
      setLoading(true);
      const postRef = doc(db, "communications", activePost.id);

      const freshComment: Comment = {
        id: `c_${Date.now()}`,
        authorName: activeUser.name,
        authorRole: activeUser.role,
        content: newComment.trim(),
        date: new Date().toISOString(),
      };

      const updatedComments = [...(activePost.comments || []), freshComment];

      await updateDoc(postRef, {
        comments: updatedComments,
      });

      // Update local active post to show comments immediately
      setActivePost({
        ...activePost,
        comments: updatedComments,
      });

      setNewComment("");
      setLoading(false);
    } catch (err) {
      console.error("Error adding comment:", err);
      setLoading(false);
    }
  };

  // Handle back to listing, refresh activePost details if changed in list
  useEffect(() => {
    if (activePost) {
      const updated = communications.find((p) => p.id === activePost.id);
      if (updated) {
        setActivePost(updated);
      }
    }
  }, [communications, activePost?.id]);

  return (
    <div className="space-y-6" id="community-forum-view">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Community Forum & Bulletin Board</h2>
          <p className="text-xs text-gray-500">
            Official announcements, notices, and resident discussions to streamline neighboring coordination.
          </p>
        </div>

        {!activePost && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors duration-150"
            id="new-post-btn"
          >
            <PlusCircle className="w-4 h-4" />
            Create Post
          </button>
        )}
      </div>

      {activePost ? (
        // Detailed Post & Comment Thread View
        <div className="space-y-5" id="detailed-post-view">
          <button
            onClick={() => setActivePost(null)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-semibold mb-2 hover:underline"
            id="back-to-forum-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bulletin Board
          </button>

          <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-50 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center font-extrabold text-blue-700 text-sm">
                  {activePost.authorName.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-900 leading-snug flex items-center gap-1.5">
                    {activePost.authorName}
                    {activePost.authorRole === "board_member" && (
                      <span className="text-[9px] font-extrabold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full uppercase flex items-center gap-0.5">
                        <Shield className="w-2.5 h-2.5" /> Board
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Posted on {new Date(activePost.date).toLocaleString()}
                  </p>
                </div>
              </div>

              <span
                className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full ${
                  activePost.type === "announcement" ? "bg-red-50 text-red-600 border border-red-100" : "bg-slate-50 text-slate-600"
                }`}
              >
                {activePost.type}
              </span>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-bold text-slate-950">{activePost.title}</h3>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{activePost.content}</p>
            </div>

            <div className="flex gap-4 pt-3 border-t border-gray-50 text-xs">
              <button
                onClick={(e) => handleLikePost(activePost, e)}
                className="flex items-center gap-1 text-slate-500 hover:text-slate-950 font-semibold"
              >
                <ThumbsUp className="w-4 h-4" />
                <span>{activePost.likes || 0} Upvotes</span>
              </button>
              <div className="flex items-center gap-1 text-slate-500 font-medium">
                <MessageSquare className="w-4 h-4" />
                <span>{(activePost.comments || []).length} Comments</span>
              </div>
            </div>
          </div>

          {/* Comment Stream */}
          <div className="space-y-4" id="comment-stream-container">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Comment Thread</h4>

            <div className="space-y-3">
              {(activePost.comments || []).map((c) => (
                <div key={c.id} className="bg-slate-50/50 border border-slate-100 p-4 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-900 flex items-center gap-1">
                      {c.authorName}
                      {c.authorRole === "board_member" && <span className="text-[8px] bg-blue-50 text-blue-600 px-1 py-0.2 rounded-full font-bold uppercase">ACC</span>}
                    </span>
                    <span className="text-slate-400 font-medium">
                      {new Date(c.date).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{c.content}</p>
                </div>
              ))}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-3 pt-2" id="comment-submit-form">
              <input
                type="text"
                required
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a constructive, supportive comment..."
                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-blue-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                id="submit-comment-btn"
              >
                <Send className="w-3.5 h-3.5" />
                Reply
              </button>
            </form>
          </div>
        </div>
      ) : (
        // Listing View
        <div className="space-y-6" id="forum-list-view">
          {/* Form to Post */}
          {showForm && (
            <form onSubmit={handleCreatePost} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4 animate-slide-down" id="add-post-form">
              <h3 className="text-sm font-bold text-slate-900 uppercase">Write Bulletin Notice</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Notice Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Provide a clear, descriptive title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Message Body</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Type details, timing, and coordinate requests for neighbor visibility..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                  />
                </div>

                {activeUser.role === "board_member" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Notice Classification</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="postType"
                          value="discussion"
                          checked={postType === "discussion"}
                          onChange={() => setPostType("discussion")}
                          className="accent-blue-600"
                        />
                        General Resident Discussion
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="postType"
                          value="announcement"
                          checked={postType === "announcement"}
                          onChange={() => setPostType("announcement")}
                          className="accent-blue-600"
                        />
                        Official Bulletin Board Announcement
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-slate-600 text-xs font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl"
                >
                  {loading ? "Publishing..." : "Publish Post"}
                </button>
              </div>
            </form>
          )}

          {/* Filters */}
          <div className="flex gap-2 border-b border-gray-100 pb-3" id="forum-filters">
            {(["all", "announcement", "discussion"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`text-xs px-3.5 py-1.5 rounded-full capitalize font-semibold transition-all duration-150 ${
                  filterType === type ? "bg-slate-950 text-white" : "text-gray-500 hover:bg-slate-50"
                }`}
                id={`filter-forum-tab-${type}`}
              >
                {type === "all" ? "All Posts" : `${type}s`}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="space-y-4" id="forum-posts-list">
            {displayedPosts.length > 0 ? (
              displayedPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => setActivePost(post)}
                  className={`bg-white border rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-gray-300 transition-all duration-150 cursor-pointer flex flex-col justify-between space-y-3 ${
                    post.type === "announcement" ? "border-l-4 border-l-red-500 border-gray-150" : "border-gray-150"
                  }`}
                  id={`forum-post-${post.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      {post.type === "announcement" ? (
                        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                          <Megaphone className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">{post.title}</h4>
                        <span className="text-[10px] text-slate-400 font-medium">
                          By {post.authorName} ({post.authorRole}) • {new Date(post.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full ${
                        post.type === "announcement" ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-600"
                      }`}
                    >
                      {post.type}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{post.content}</p>

                  <div className="flex gap-4 border-t border-gray-50 pt-3 text-[11px] font-bold text-slate-400">
                    <button
                      onClick={(e) => handleLikePost(post, e)}
                      className="flex items-center gap-1.5 hover:text-slate-900 transition-colors"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-blue-600" />
                      <span>{post.likes || 0}</span>
                    </button>
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{(post.comments || []).length} Comments</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-dashed border-gray-200 py-12 text-center text-gray-400 text-xs rounded-2xl flex flex-col items-center justify-center gap-2">
                <Megaphone className="w-8 h-8 opacity-25" />
                No announcements or discussion posts matching this filter.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
