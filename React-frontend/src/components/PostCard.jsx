import { useState, useContext } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Card, CardHeader, CardContent, CardActions, Avatar,
  Typography, IconButton, Button, Box, Chip,
  Menu, MenuItem, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, ImageList, ImageListItem
} from '@mui/material';
import {
  FavoriteBorder as FavoriteBorderIcon,
  Favorite as FavoriteIcon,
  ChatBubbleOutline as CommentIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Bookmark as BookmarkIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayArrowIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useMutation, useQueryClient } from 'react-query';
import { AuthContext } from '../contexts/AuthContext';
import { postApi } from '../services/api';
import { getFullImageUrl } from '../utils/imageUtils';

export default function PostCard({ post }) {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [selectedMedia, setSelectedMedia] = useState(null);
  
  const isOwner = currentUser?.id === post.userId;
  const isLiked = post.likedBy?.includes(currentUser?.id);
  const isSaved = post.savedBy?.includes(currentUser?.id);
  const hasMedia = post.mediaUrls && post.mediaUrls.length > 0;

  const isVideo = (url) => {
    return url && url.match(/\.(mp4|webm|ogg)$/i);
  };

  const likeMutation = useMutation(
    () => isLiked ? postApi.unlikePost(post.id) : postApi.likePost(post.id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['userPosts']);
        queryClient.invalidateQueries(['explorePosts']);
        queryClient.invalidateQueries(['feed']);
        queryClient.invalidateQueries(['post', post.id]);
      }
    }
  );

  const saveMutation = useMutation(
    () => isSaved ? postApi.unsavePost(post.id) : postApi.savePost(post.id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['userPosts']);
        queryClient.invalidateQueries(['savedPosts']);
      }
    }
  );

  const deleteMutation = useMutation(
    () => postApi.deletePost(post.id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['userPosts']);
        queryClient.invalidateQueries(['explorePosts']);
        queryClient.invalidateQueries(['feed']);
        setConfirmDelete(false);
      }
    }
  );

  const updateMutation = useMutation(
    (content) => postApi.updatePost(post.id, { 
      content,
      mediaUrls: post.mediaUrls, // Preserve the existing media URLs
      skillCategory: post.skillCategory // Preserve the skill category
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['userPosts']);
        queryClient.invalidateQueries(['explorePosts']);
        queryClient.invalidateQueries(['feed']);
        queryClient.invalidateQueries(['post', post.id]);
        setEditMode(false);
      }
    }
  );


  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleEdit = () => {
    setEditedContent(post.content);
    setEditMode(true);
    handleMenuClose();
  };

  const handleSaveEdit = () => {
    if (editedContent.trim() !== '') {
      updateMutation.mutate(editedContent);
    }
  };
  
  const API_BASE_URL = 'http://localhost:4000';
  
  const handleDeleteClick = () => {
    setConfirmDelete(true);
    handleMenuClose();
  };

  const handleLike = () => {
    if (currentUser) {
      likeMutation.mutate();
    }
  };

  const handleSave = () => {
    if (currentUser) {
      saveMutation.mutate();
    }
  };
  
  const handleMediaClick = (url) => {
    setSelectedMedia(url);
  };

  const handleProfileClick = () => {
    if (post.userId) {
      navigate(`/profile/${post.userId}`);
    }
  };

  const renderMedia = (url) => {
    const fullUrl = getFullImageUrl(url);
    if (isVideo(url)) {
      return (
        <Box sx={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
          <video
            src={fullUrl}
            style={{ 
              width: '80%',
              maxWidth: '600px',
              borderRadius: 8,
              cursor: 'pointer',
              objectFit: 'contain'
            }}
            onClick={() => handleMediaClick(fullUrl)}
          />
          <PlayArrowIcon 
            sx={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              fontSize: 48,
              color: 'white',
              backgroundColor: 'rgba(0,0,0,0.5)',
              borderRadius: '50%',
              padding: '8px'
            }} 
          />
        </Box>
      );
    }
    return (
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <img
          src={fullUrl}
          alt="Post media"
          style={{ 
            width: '80%',
            maxWidth: '600px',
            borderRadius: 8,
            cursor: 'pointer',
            objectFit: 'contain'
          }}
          onClick={() => handleMediaClick(fullUrl)}
        />
      </Box>
    );
  };

  return (
    <Card elevation={2} sx={{ maxWidth: '800px', margin: '0 auto' }}>
      <CardHeader
        avatar={
          <Avatar 
            src={getFullImageUrl(post.userProfilePicture)} 
            alt={post.userName || "User"}
            onClick={handleProfileClick}
            sx={{ 
              cursor: 'pointer',
              '&:hover': { opacity: 0.8 }
            }}
          />
        }
        action={
          isOwner && (
            <IconButton onClick={handleMenuOpen}>
              <MoreVertIcon />
            </IconButton>
          )
        }
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography 
              variant="subtitle1"
              component="span"
              onClick={handleProfileClick}
              sx={{ 
                cursor: 'pointer',
                fontWeight: 'bold',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              {post.userName || "Unknown User"}
            </Typography>
            {post.username && (
              <Typography 
                variant="body2" 
                color="text.secondary"
                component="span"
                sx={{ ml: 1 }}
              >
                @{post.username}
              </Typography>
            )}
          </Box>
        }
        subheader={format(new Date(post.createdAt), 'MMM d, yyyy • h:mm a')}
      />
      
      <CardContent sx={{ pt: 0 }}>
        {editMode ? (
          <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            variant="outlined"
          />
          
          {/* Display existing media during edit mode but make it clear it can't be changed */}
          {hasMedia && (
            <Box sx={{ my: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Media cannot be changed during edit
              </Typography>
              {post.mediaUrls.length === 1 ? (
                renderMedia(post.mediaUrls[0])
              ) : (
                <ImageList 
                  cols={post.mediaUrls.length > 3 ? 2 : post.mediaUrls.length} 
                  gap={8}
                  sx={{ mb: 0, width: '80%', maxWidth: '600px', margin: '0 auto' }}
                >
                  {post.mediaUrls.map((url, index) => (
                    <ImageListItem key={index}>
                      {renderMedia(url)}
                    </ImageListItem>
                  ))}
                </ImageList>
              )}
            </Box>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
            <Button onClick={() => setEditMode(false)}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSaveEdit}
              disabled={updateMutation.isLoading}
            >
              Save
            </Button>
          </Box>
        </Box>
        ) : (
          <Typography variant="body1" component="div" gutterBottom>
            {post.content}
          </Typography>
        )}
        
        {hasMedia && !editMode && (
          <Box sx={{ my: 2 }}>
            {post.mediaUrls.length === 1 ? (
              renderMedia(post.mediaUrls[0])
            ) : (
              <ImageList 
                cols={post.mediaUrls.length > 3 ? 2 : post.mediaUrls.length} 
                gap={8}
                sx={{ mb: 0, width: '80%', maxWidth: '600px', margin: '0 auto' }}
              >
                {post.mediaUrls.map((url, index) => (
                  <ImageListItem key={index}>
                    {renderMedia(url)}
                  </ImageListItem>
                ))}
              </ImageList>
            )}
          </Box>
        )}
        
        {post.skillCategory && !editMode && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
            {post.skillCategory.split(',').map(skill => {
              const trimmedSkill = skill.trim();
              return trimmedSkill ? (
                <Chip 
                  key={trimmedSkill} 
                  label={trimmedSkill} 
                  size="small" 
                  component={RouterLink}
                  to={`/explore?skill=${encodeURIComponent(trimmedSkill)}`}
                  clickable
                  sx={{ 
                    textDecoration: 'none', 
                    '&:hover': { opacity: 0.8 }
                  }}
                />
              ) : null;
            }).filter(Boolean)}
          </Box>
        )}
      </CardContent>
      
      <CardActions disableSpacing sx={{ px: 2, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton 
            onClick={handleLike}
            disabled={!currentUser || likeMutation.isLoading}
            color={isLiked ? "error" : "default"}
          >
            {isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            {post.likesCount || 0}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
          <IconButton 
            component={RouterLink}
            to={`/posts/${post.id}`}
          >
            <CommentIcon />
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            {post.commentsCount || 0}
          </Typography>
        </Box>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <IconButton 
          onClick={handleSave}
          disabled={!currentUser || saveMutation.isLoading}
          color={isSaved ? "primary" : "default"}
        >
          {isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
        </IconButton>
        
        <IconButton>
          <ShareIcon />
        </IconButton>
      </CardActions>

      <Dialog 
        open={Boolean(selectedMedia)} 
        onClose={() => setSelectedMedia(null)}
        maxWidth="lg"
      >
        <DialogContent sx={{ p: 0 }}>
          {selectedMedia && isVideo(selectedMedia) ? (
            <video 
              src={selectedMedia}
              controls
              autoPlay
              style={{ 
                width: '100%',
                maxHeight: '90vh',
                objectFit: 'contain'
              }}
            />
          ) : (
            <img 
              src={selectedMedia} 
              alt="Full size media" 
              style={{ 
                width: '100%',
                maxHeight: '90vh',
                objectFit: 'contain'
              }} 
            />
          )}
        </DialogContent>
      </Dialog>

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <DeleteIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }} />
          <Typography color="error">Delete</Typography>
        </MenuItem>
      </Menu>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this post? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button 
            onClick={() => deleteMutation.mutate()} 
            color="error" 
            variant="contained"
            disabled={deleteMutation.isLoading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
