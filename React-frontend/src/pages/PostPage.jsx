import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container, Typography, Box, Paper, Divider, CircularProgress,
  TextField, Button, Avatar, List, ListItem, ListItemAvatar,
  ListItemText, IconButton, Snackbar, Alert
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Reply as ReplyIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { postApi, commentApi } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import PostCard from '../components/PostCard';
import NotFoundPage from './NotFoundPage';
import { getFullImageUrl } from '../utils/imageUtils';

export default function PostPage() {
  const [commentText, setCommentText] = useState('');
  const [replyToId, setReplyToId] = useState(null);
  const [replyToUser, setReplyToUser] = useState(null);
  const [selectedComment, setSelectedComment] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editCommentText, setEditCommentText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { postId } = useParams();
  const { currentUser, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Check if comments section should be focused
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('focus') === 'comments') {
      const commentsSection = document.getElementById('comments-section');
      if (commentsSection) {
        commentsSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location]);

  const { data: postData, isLoading: postLoading, error: postError } = useQuery(
    ['post', postId],
    () => postApi.getPost(postId),
    {
      staleTime: 60000, // 1 minute
    }
  );

  const { data: commentsData, isLoading: commentsLoading } = useQuery(
    ['comments', postId],
    () => postApi.getComments(postId),
    {
      staleTime: 60000, // 1 minute
      onError: (error) => {
        console.error("Error fetching comments:", error);
        setErrorMessage("Failed to load comments. Please try again.");
        setShowError(true);
      }
    }
  );

  const addCommentMutation = useMutation(
    (commentData) => postApi.createComment(postId, commentData),
    {
      onSuccess: () => {
        setCommentText('');
        setReplyToId(null);
        setReplyToUser(null);
        queryClient.invalidateQueries(['comments', postId]);
        queryClient.invalidateQueries(['post', postId]);
        setSuccessMessage('Comment added successfully!');
        setShowSuccess(true);
      },
      onError: (error) => {
        console.error("Error adding comment:", error);
        setErrorMessage("Failed to add comment. Please try again.");
        setShowError(true);
      }
    }
  );

  const deleteCommentMutation = useMutation(
    (commentId) => commentApi.deleteComment(commentId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['comments', postId]);
        queryClient.invalidateQueries(['post', postId]);
        setSelectedComment(null);
        setSuccessMessage('Comment deleted successfully!');
        setShowSuccess(true);
      },
      onError: (error) => {
        console.error("Error deleting comment:", error);
        setErrorMessage("Failed to delete comment. Please try again.");
        setShowError(true);
      }
    }
  );

  const updateCommentMutation = useMutation(
    ({ commentId, content }) => commentApi.updateComment(commentId, { content }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['comments', postId]);
        setEditMode(false);
        setSelectedComment(null);
        setSuccessMessage('Comment updated successfully!');
        setShowSuccess(true);
      },
      onError: (error) => {
        console.error("Error updating comment:", error);
        setErrorMessage("Failed to update comment. Please try again.");
        setShowError(true);
      }
    }
  );

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (commentText.trim()) {
      addCommentMutation.mutate({ content: commentText.trim() });
    }
  };

  const handleReplyClick = (commentId, username) => {
    setReplyToId(commentId);
    setReplyToUser(username);
    // Focus the comment input
    const commentInput = document.getElementById('comment-input');
    if (commentInput) {
      commentInput.focus();
    }
  };

  const cancelReply = () => {
    setReplyToId(null);
    setReplyToUser(null);
  };

  const handleEditComment = (comment) => {
    setEditMode(true);
    setSelectedComment(comment);
    setEditCommentText(comment.content);
  };

  const handleDeleteComment = (comment) => {
    setSelectedComment(comment);
    deleteCommentMutation.mutate(comment.id);
  };

  const handleEditCancel = () => {
    setEditMode(false);
    setEditCommentText('');
    setSelectedComment(null);
  };

  const handleEditSubmit = () => {
    if (editCommentText.trim() && editCommentText !== selectedComment.content) {
      updateCommentMutation.mutate({
        commentId: selectedComment.id,
        content: editCommentText.trim()
      });
    } else if (editCommentText === selectedComment.content) {
      setEditMode(false);
      setSelectedComment(null);
    }
  };

  const handleCloseError = () => {
    setShowError(false);
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
  };

  if (postError && postError.response?.status === 404) {
    return <NotFoundPage message="The post you're looking for doesn't exist." />;
  }

  if (postLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  const post = postData?.data;
  
  // Fixed this line: Properly extract comments from the response data
  const comments = commentsData?.data?.content || (Array.isArray(commentsData?.data) ? commentsData.data : []);
  
  return (
    <Container maxWidth="md">
      {/* Post */}
      {post && <PostCard post={post} />}

      {/* Comments Section */}
      <Paper sx={{ p: 3, mt: 3 }} id="comments-section">
        <Typography variant="h6" gutterBottom>
          Comments ({post?.commentCount || 0})
        </Typography>

        {isAuthenticated ? (
          <Box component="form" onSubmit={handleCommentSubmit} sx={{ mb: 3 }}>
            {replyToUser && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2">
                  Replying to <strong>@{replyToUser}</strong>
                </Typography>
                <Button size="small" onClick={cancelReply} sx={{ ml: 1 }}>
                  Cancel
                </Button>
              </Box>
            )}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Avatar 
                src={getFullImageUrl(currentUser.profilePicture) || '/default-avatar.png'}
                alt={currentUser?.name} 
                sx={{ width: 40, height: 40 }}
              />
              <TextField
                id="comment-input"
                fullWidth
                multiline
                rows={2}
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={addCommentMutation.isLoading}
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={!commentText.trim() || addCommentMutation.isLoading}
              >
                {addCommentMutation.isLoading ? <CircularProgress size={24} /> : "Post Comment"}
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="body1" gutterBottom>
              Sign in to comment on this post
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate('/login', { state: { from: location } })}
            >
              Sign In
            </Button>
          </Box>
        )}

        <Divider />

        {commentsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : comments.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No comments yet. Be the first to comment!
            </Typography>
          </Box>
        ) : (
          <List>
            {comments.map((comment) => (
              <Box key={comment.id}>
                <ListItem 
                  alignItems="flex-start"
                  secondaryAction={
                    currentUser?.id === comment.userId && (
                      <Box>
                        <IconButton 
                          edge="end" 
                          color="primary"
                          onClick={() => handleEditComment(comment)}
                          size="small"
                          sx={{ mr: 1 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          edge="end" 
                          color="error"
                          onClick={() => handleDeleteComment(comment)}
                          size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )
                  }
                >
                  <ListItemAvatar>
                    <Avatar 
                      src={getFullImageUrl(comment.userProfilePicture) || '/default-avatar.png'}                      alt={comment.userName} 
                      onClick={() => navigate(`/profile/${comment.userId}`)}
                      sx={{ cursor: 'pointer' }}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography
                          variant="subtitle2"
                          component="span"
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/profile/${comment.userId}`)}
                        >
                          {comment.userName || "Unknown User"}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          component="span"
                          sx={{ ml: 1 }}
                        >
                          {comment.username ? `@${comment.username}` : ""} · {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      editMode && selectedComment?.id === comment.id ? (
                        <Box sx={{ mt: 1 }}>
                          <TextField
                            fullWidth
                            multiline
                            rows={2}
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            disabled={updateCommentMutation.isLoading}
                          />
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, gap: 1 }}>
                            <Button size="small" onClick={handleEditCancel}>
                              Cancel
                            </Button>
                            <Button 
                              size="small" 
                              variant="contained" 
                              onClick={handleEditSubmit}
                              disabled={!editCommentText.trim() || updateCommentMutation.isLoading}
                            >
                              {updateCommentMutation.isLoading ? <CircularProgress size={16} /> : "Save"}
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <Box>
                          <Typography
                            variant="body1"
                            component="div"
                            color="text.primary"
                            sx={{ mt: 1, whiteSpace: 'pre-line' }}
                          >
                            {comment.content}
                          </Typography>
                          {isAuthenticated && (
                            <Button
                              size="small"
                              startIcon={<ReplyIcon />}
                              onClick={() => handleReplyClick(comment.id, comment.username || comment.userName)}
                              sx={{ mt: 1 }}
                            >
                              Reply
                            </Button>
                          )}
                        </Box>
                      )
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </Box>
            ))}
          </List>
        )}
      </Paper>

      <Snackbar 
        open={showError} 
        autoHideDuration={6000} 
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}
