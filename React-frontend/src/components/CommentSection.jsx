import { useState, useContext } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { 
  Box, Typography, TextField, Button, Avatar, 
  List, ListItem, ListItemAvatar, ListItemText,
  IconButton, Menu, MenuItem, Divider,
  CircularProgress, Snackbar, Alert
} from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { AuthContext } from '../contexts/AuthContext';
import { commentApi, postApi } from '../services/api';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { getFullImageUrl } from '../utils/imageUtils';
// Main Comment Section component
export default function CommentSection({ postId }) {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedComment, setSelectedComment] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const queryClient = useQueryClient();
  // Fetch all comments related to the post
  const { data, isLoading, isError } = useQuery(
    ['comments', postId],
    () => postApi.getComments(postId),
    {
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error("Error fetching comments:", error);
        setErrorMessage("Failed to load comments. Please try again.");
        setShowError(true);
      }
    }
  );

  // Mutation to add a new comment
  const addCommentMutation = useMutation(
    (commentText) => postApi.createComment(postId, commentText),
    {
      onSuccess: () => {
        // Invalidate comment data
        queryClient.invalidateQueries(['comments', postId]);
        
        // Also invalidate queries that might show comment counts
        queryClient.invalidateQueries(['post', postId]);
        queryClient.invalidateQueries(['userPosts']);
        queryClient.invalidateQueries(['feed']);
        queryClient.invalidateQueries(['explorePosts']);
        
        setCommentText('');
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

  // Mutation to update a comment
  const updateCommentMutation = useMutation(
    ({ commentId, commentData }) => commentApi.updateComment(commentId, commentData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['comments', postId]);
        setEditingComment(null);
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

  // Mutation to delete a comment
  const deleteCommentMutation = useMutation(
    (commentId) => commentApi.deleteComment(commentId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['comments', postId]);
        queryClient.invalidateQueries(['post', postId]);
        queryClient.invalidateQueries(['userPosts']);
        queryClient.invalidateQueries(['feed']);
        queryClient.invalidateQueries(['explorePosts']);
        handleMenuClose();
        setSuccessMessage('Comment deleted successfully!');
        setShowSuccess(true);
      },
      onError: (error) => {
        console.error("Error deleting comment:", error);
        setErrorMessage("Failed to delete comment. Please try again.");
        setShowError(true);
        handleMenuClose();
      }
    }
  );

  // Submit a new comment
  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (commentText.trim()) {
      // Create a proper comment object with content property
      addCommentMutation.mutate({ content: commentText.trim() });
    }
  };

  // Submit edited comment
  const handleUpdateComment = () => {
    if (editText.trim()) {
      updateCommentMutation.mutate({
        commentId: editingComment.id,
        commentData: { content: editText }
      });
    }
  };

  // Delete selected comment
  const handleDeleteComment = () => {
    if (selectedComment) {
      deleteCommentMutation.mutate(selectedComment.id);
    }
  };

   // Open options menu for comment (edit/delete)
  const handleMenuOpen = (event, comment) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedComment(comment);
  };

  // Close options menu
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedComment(null);
  };

  // Start editing a comment
  const startEditComment = (comment) => {
    setEditingComment(comment);
    setEditText(comment.content);
    handleMenuClose();
  };

  // Cancel comment editing
  const cancelEditComment = () => {
    setEditingComment(null);
    setEditText('');
  };

  // Close error alert
  const handleCloseError = () => {
    setShowError(false);
  };

  // Close success alert
  const handleCloseSuccess = () => {
    setShowSuccess(false);
  };

  // Navigate to user profile
  const handleUserProfileClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  // Show loading spinner
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={30} />
      </Box>
    );
  }

  // Show error message if comment fetch fails
  if (isError) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">Failed to load comments.</Typography>
      </Box>
    );
  }

  const comments = data?.data?.content || data?.data || [];
  console.log('Comment data received:', data);
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Comments
      </Typography>
      {currentUser && (
      <Box component="form" onSubmit={handleSubmitComment} sx={{ mb: 3, display: 'flex' }}>
        <Avatar 
        src={getFullImageUrl(currentUser.profilePicture) || '/default-avatar.png'}
        alt={currentUser?.name}
          sx={{ mr: 1.5, width: 36, height: 36 }}
        />
        <TextField
          fullWidth
          size="small"
          placeholder="Add a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          sx={{ mr: 1 }}
        />
        <Button 
          type="submit" 
          variant="contained" 
          disabled={!commentText.trim() || addCommentMutation.isLoading}
        >
          {addCommentMutation.isLoading ? 'Posting...' : 'Post'}
        </Button>
      </Box>
)}
      {comments.length > 0 ? (
        <List>
          {comments.map((comment) => (
            <ListItem
              key={comment.id}
              alignItems="flex-start"
              sx={{ px: 0 }}
              secondaryAction={
                currentUser?.id === comment.userId && (
                  <IconButton 
                    edge="end" 
                    aria-label="comment options"
                    onClick={(e) => handleMenuOpen(e, comment)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                )
              }
            >
              <ListItemAvatar>
                <Avatar 
                  src={getFullImageUrl(currentUser.profilePicture) || '/default-avatar.png'}
                  alt={comment.userName || 'User'}
                  onClick={() => handleUserProfileClick(comment.userId)}
                  sx={{ cursor: 'pointer' }}
                />
              </ListItemAvatar>
              
              {editingComment && editingComment.id === comment.id ? (
                <Box sx={{ flex: 1, ml: -2 }}>
                  <TextField
                    fullWidth
                    multiline
                    size="small"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    sx={{ mb: 1 }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button 
                      size="small" 
                      onClick={cancelEditComment}
                      sx={{ mr: 1 }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="small" 
                      variant="contained"
                      onClick={handleUpdateComment}
                      disabled={!editText.trim() || updateCommentMutation.isLoading}
                    >
                      {updateCommentMutation.isLoading ? 'Saving...' : 'Save'}
                    </Button>
                  </Box>
                </Box>
              ) : (
                <ListItemText
                  primary={
                    <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography
                        variant="subtitle2"
                        onClick={() => handleUserProfileClick(comment.userId)}
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        {comment.userName || 'Anonymous User'}
                      </Typography>
                      {comment.username && (
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          @{comment.username}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        • {format(new Date(comment.createdAt), 'MMM d, yyyy • h:mm a')}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      color="text.primary"
                      sx={{ whiteSpace: 'pre-line', mt: 0.5 }}
                    >
                      {comment.content}
                    </Typography>
                  }
                />
              )}
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          No comments yet. Be the first to comment!
        </Typography>
      )}

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => startEditComment(selectedComment)}>Edit</MenuItem>
        <MenuItem onClick={handleDeleteComment}>Delete</MenuItem>
      </Menu>

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
    </Box>
  );
}
