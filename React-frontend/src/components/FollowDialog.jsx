import React from 'react';
import { useState, useEffect, useContext } from 'react';
import {
  Dialog, DialogTitle, DialogContent, List, ListItem,
  ListItemAvatar, ListItemText, Avatar, Typography,
  Button, IconButton, CircularProgress, Box,
  TextField, InputAdornment, Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  PersonAdd as FollowIcon,
  Check as FollowingIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { userApi } from '../services/api';
import { getFullImageUrl } from '../utils/imageUtils';
import { AuthContext } from '../contexts/AuthContext';

export default function FollowDialog({ open, onClose, userId, type, username }) {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser, isAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    // Reset search when dialog opens
    if (open) {
      setSearchTerm('');
    }
  }, [open]);

  const { data, isLoading, refetch } = useQuery(
    [`${type}List`, userId],
    () => type === 'followers' 
      ? userApi.getUserFollowers(userId) 
      : userApi.getUserFollowing(userId),
    {
      enabled: open,
      staleTime: 60000 // 1 minute
    }
  );

  const followMutation = useMutation(
    (targetUserId) => userApi.followUser(targetUserId),
    {
      onSuccess: () => {
        // Invalidate relevant queries
        queryClient.invalidateQueries(['user', userId]);
        queryClient.invalidateQueries([`${type}List`, userId]);
      }
    }
  );

  const unfollowMutation = useMutation(
    (targetUserId) => userApi.unfollowUser(targetUserId),
    {
      onSuccess: () => {
        // Invalidate relevant queries
        queryClient.invalidateQueries(['user', userId]);
        queryClient.invalidateQueries([`${type}List`, userId]);
      }
    }
  );

  const handleFollowToggle = (targetUserId, isFollowing) => {
    if (isFollowing) {
      unfollowMutation.mutate(targetUserId);
    } else {
      followMutation.mutate(targetUserId);
    }
  };

  const handleUserClick = (targetUserId) => {
    navigate(`/profile/${targetUserId}`);
    onClose();
  };

  const users = data?.data?.data || data?.data || [];
  const filteredUsers = searchTerm.trim() 
  ? users.filter(user => 
      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  : users;


  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="follow-dialog-title"
    >
      <DialogTitle id="follow-dialog-title">
        {username ? `@${username}'s ` : ''}
        {type === 'followers' ? 'Followers' : 'Following'}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <TextField
          fullWidth
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredUsers.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            {searchTerm.trim() ? (
              <Typography variant="body1" color="text.secondary">
                No users found matching "{searchTerm}"
              </Typography>
            ) : (
              <Typography variant="body1" color="text.secondary">
                {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
              </Typography>
            )}
          </Box>
        ) : (
          <List sx={{ pt: 0 }}>
            {filteredUsers.map((user) => (
              <React.Fragment key={user.id}>
                <ListItem
                  secondaryAction={
                    isAuthenticated && currentUser && userId !== user.id && user.id !== currentUser.id && (
                      <Button
                        variant={user.isFollowing ? "outlined" : "contained"}
                        size="small"
                        startIcon={user.isFollowing ? <FollowingIcon /> : <FollowIcon />}
                        onClick={() => handleFollowToggle(user.id, user.isFollowing)}
                        disabled={followMutation.isLoading || unfollowMutation.isLoading}
                      >
                        {user.isFollowing ? "Following" : "Follow"}
                      </Button>
                    )
                  }
                >
                  <ListItemAvatar>
                    <Avatar 
                      src={getFullImageUrl(user.profilePicture) || '/default-avatar.png'}
                      alt={user.name}
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleUserClick(user.id)}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography 
                        variant="subtitle2" 
                        component="span"
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleUserClick(user.id)}
                      >
                        {user.name}
                      </Typography>
                    }
                    secondary={`@${user.username}`}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleUserClick(user.id)}
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
}
