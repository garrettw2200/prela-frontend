import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import {
  fetchTraceComments,
  createTraceComment,
  updateTraceComment,
  deleteTraceComment,
  TraceComment,
} from '../../api/comments';

interface TraceCommentsProps {
  traceId: string;
  projectId: string;
}

export function TraceComments({ traceId, projectId }: TraceCommentsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['trace-comments', traceId, projectId],
    queryFn: () => fetchTraceComments(traceId, projectId),
  });

  const invalidateComments = () => {
    queryClient.invalidateQueries({ queryKey: ['trace-comments', traceId, projectId] });
  };

  const createMutation = useMutation({
    mutationFn: (params: { content: string; parentId?: string }) =>
      createTraceComment(traceId, projectId, {
        content: params.content,
        parent_comment_id: params.parentId,
      }),
    onSuccess: () => {
      invalidateComments();
      setNewComment('');
      setReplyingTo(null);
      setReplyContent('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      updateTraceComment(id, { content }),
    onSuccess: () => {
      invalidateComments();
      setEditingId(null);
      setEditContent('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTraceComment(id),
    onSuccess: invalidateComments,
  });

  // Organize comments into threads
  const topLevel = comments.filter((c) => !c.parent_comment_id);
  const replies = comments.filter((c) => c.parent_comment_id);
  const getReplies = (parentId: string) =>
    replies.filter((c) => c.parent_comment_id === parentId);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    createMutation.mutate({ content: newComment });
  };

  const handleSubmitReply = (parentId: string) => {
    if (!replyContent.trim()) return;
    createMutation.mutate({ content: replyContent, parentId });
  };

  const renderComment = (comment: TraceComment, isReply = false) => {
    const isAuthor = comment.user_id === user?.id;

    return (
      <div
        key={comment.id}
        className={`${isReply ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}
      >
        <div className="flex gap-3 py-3">
          {comment.profile_image_url ? (
            <img
              src={comment.profile_image_url}
              alt=""
              className="h-7 w-7 rounded-full flex-shrink-0"
            />
          ) : (
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
              {(comment.full_name || comment.email || '?')[0].toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">
                {comment.full_name || comment.email}
              </span>
              <span className="text-xs text-gray-400">
                {comment.created_at
                  ? new Date(comment.created_at).toLocaleString()
                  : ''}
              </span>
            </div>

            {editingId === comment.id ? (
              <div className="mt-1">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={2}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                />
                <div className="mt-1 flex gap-2">
                  <button
                    onClick={() => updateMutation.mutate({ id: comment.id, content: editContent })}
                    disabled={updateMutation.isPending || !editContent.trim()}
                    className="rounded px-2 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="mt-0.5 text-sm text-gray-700 whitespace-pre-wrap">
                  {comment.content}
                </p>
                <div className="mt-1 flex gap-3">
                  {!isReply && (
                    <button
                      onClick={() => {
                        setReplyingTo(replyingTo === comment.id ? null : comment.id);
                        setReplyContent('');
                      }}
                      className="text-xs text-gray-500 hover:text-indigo-600"
                    >
                      Reply
                    </button>
                  )}
                  {isAuthor && (
                    <button
                      onClick={() => {
                        setEditingId(comment.id);
                        setEditContent(comment.content);
                      }}
                      className="text-xs text-gray-500 hover:text-indigo-600"
                    >
                      Edit
                    </button>
                  )}
                  {isAuthor && (
                    <button
                      onClick={() => {
                        if (confirm('Delete this comment?')) {
                          deleteMutation.mutate(comment.id);
                        }
                      }}
                      className="text-xs text-gray-500 hover:text-red-600"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Reply input */}
        {replyingTo === comment.id && (
          <div className="ml-10 mb-2">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={2}
              placeholder="Write a reply..."
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />
            <div className="mt-1 flex gap-2">
              <button
                onClick={() => handleSubmitReply(comment.id)}
                disabled={createMutation.isPending || !replyContent.trim()}
                className="rounded px-2 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
              >
                Reply
              </button>
              <button
                onClick={() => setReplyingTo(null)}
                className="rounded px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Threaded replies */}
        {getReplies(comment.id).map((reply) => renderComment(reply, true))}
      </div>
    );
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Comments</h3>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading comments...</p>
      ) : (
        <>
          {/* Comment list */}
          {topLevel.length === 0 ? (
            <p className="text-sm text-gray-400 mb-4">No comments yet.</p>
          ) : (
            <div className="divide-y divide-gray-100 mb-4">
              {topLevel.map((comment) => renderComment(comment))}
            </div>
          )}

          {/* New comment input */}
          <form onSubmit={handleSubmitComment}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              placeholder="Add a comment..."
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={createMutation.isPending || !newComment.trim()}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending ? 'Posting...' : 'Comment'}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
