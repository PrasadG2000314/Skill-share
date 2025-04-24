import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Avatar, Skeleton,
  Chip
} from '@mui/material';
import { useMutation, useQueryClient } from 'react-query';
import { userApi } from '../services/api';

export default function SuggestedUserCard({ user }) {
  const [isFollowing, setIsFollowing] = useState(user?.isFollowing || false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const followMutation = useMutation(
    () => userApi.followUser(user.id),
    {
      onSuccess: () => {
        setIsFollowing(true);
        queryClient.invalidateQueries(['suggestedUsers']);
        queryClient.invalidateQueries(['feed']);
      }
    }
  );

  const unfollowMutation = useMutation(
    () => userApi.unfollowUser(user.id),
    {
      onSuccess: () => {
        setIsFollowing(false);
        queryClient.invalidateQueries(['suggestedUsers']);
        queryClient.invalidateQueries(['feed']);
      }
    }
  );

  const handleFollowToggle = () => {
    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  if (!user) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
        <Box sx={{ width: '100%' }}>
          <Skeleton width="60%" />
          <Skeleton width="40%" />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Avatar
        src={user.profilePicture}
        alt={user.name}
        sx={{ 
          width: 40, 
          height: 40, 
          mr: 2,
          cursor: 'pointer'
        }}
        onClick={() => navigate(`/profile/${user.id}`)}
      />
      
      <Box sx={{ flexGrow: 1 }}>
        <Typography
          variant="subtitle2"
          sx={{ 
            cursor: 'pointer',
            '&:hover': { textDecoration: 'underline' }
          }}
          onClick={() => navigate(`/profile/${user.id}`)}
        >
          {user.name}
        </Typography>
        
        {user.skills?.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
            {user.skills.slice(0, 2).map(skill => (
              <Chip
                key={skill}
                label={skill}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.6rem' }}
              />
            ))}
            {user.skills.length > 2 && (
              <Typography variant="caption" color="text.secondary">
                +{user.skills.length - 2} more
              </Typography>
            )}
          </Box>
        )}
      </Box>
      
      <Button
        size="small"
        variant={isFollowing ? "outlined" : "contained"}
        onClick={handleFollowToggle}
        sx={{ minWidth: 80 }}
        disabled={followMutation.isLoading || unfollowMutation.isLoading}
      >
        {isFollowing ? "Following" : "Follow"}
      </Button>
    </Box>
  );
}
