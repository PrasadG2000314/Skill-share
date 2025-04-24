import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Grid, Box, Typography, Button, Avatar, Paper,
  Tabs, Tab, Divider, CircularProgress, Chip, IconButton, Snackbar, Alert, Fab
} from '@mui/material';
import {
  Edit as EditIcon,
  Add as AddIcon,
  PersonAdd as FollowIcon,
  Check as FollowingIcon,
  PostAdd as PostAddIcon,
  PlaylistAdd as PlanAddIcon,
  BookmarkAdd as ProgressAddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { userApi, postApi, learningPlanApi, learningProgressApi } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import PostCard from '../components/PostCard';
import LearningPlanCard from '../components/LearningPlanCard';
import LearningProgressCard from '../components/LearningProgressCard';
import FollowDialog from '../components/FollowDialog';
import CreatePostDialog from '../components/CreatePostDialog';
import CreateProgressDialog from '../components/CreateProgressDialog';
import { getFullImageUrl } from '../utils/imageUtils';

export default function ProfilePage() {
  const [tabValue, setTabValue] = useState(0);
  const [followDialogOpen, setFollowDialogOpen] = useState(false);
  const [followDialogType, setFollowDialogType] = useState('followers');
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [createPostDialogOpen, setCreatePostDialogOpen] = useState(false);
  const [createProgressDialogOpen, setCreateProgressDialogOpen] = useState(false);
  const [progressToEdit, setProgressToEdit] = useState(null);
  
  const { userId } = useParams();
  const { currentUser, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Determine if this is the current user's profile
  const isOwnProfile = currentUser?.id === userId;

  // Fetch user data - use the correct endpoint based on whether it's the current user or another user
  const { data: userData, isLoading: userLoading, error: userError } = useQuery(
    ['user', userId],
    () => isOwnProfile ? userApi.getUser() : userApi.getUserById(userId),
    {
      enabled: !!userId,
      staleTime: 60000, // 1 minute
      onError: (error) => {
        console.error("Error fetching user:", error);
        setErrorMessage("Failed to load user profile. Please try again.");
        setShowError(true);
      }
    }
  );

  // Fetch user posts
  const { data: postsData, isLoading: postsLoading } = useQuery(
    ['userPosts', userId],
    () => postApi.getUserPosts(userId),
    {
      enabled: !!userId && tabValue === 0,
      staleTime: 60000, // 1 minute
    }
  );

  // Fetch user learning plans
  const { data: learningPlansData, isLoading: plansLoading } = useQuery(
    ['userLearningPlans', userId],
    () => learningPlanApi.getUserPlans(userId),
    {
      enabled: !!userId && tabValue === 1,
      staleTime: 60000, // 1 minute
    }
  );
  
  // Fetch user learning progress
  const { data: progressData, isLoading: progressLoading } = useQuery(
    ['userProgress', userId],
    () => learningProgressApi.getUserProgress(userId),
    {
      enabled: !!userId && tabValue === 2,
      staleTime: 60000, // 1 minute
    }
  );

  // Follow user mutation
  const followMutation = useMutation(
    () => userApi.followUser(userId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['user', userId]);
      },
      onError: (error) => {
        console.error("Error following user:", error);
        setErrorMessage("Failed to follow user. Please try again.");
        setShowError(true);
      }
    }
  );

  // Unfollow user mutation
  const unfollowMutation = useMutation(
    () => userApi.unfollowUser(userId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['user', userId]);
      },
      onError: (error) => {
        console.error("Error unfollowing user:", error);
        setErrorMessage("Failed to unfollow user. Please try again.");
        setShowError(true);
      }
    }
  );
  
  // Delete progress mutation
  const deleteProgressMutation = useMutation(
    (progressId) => learningProgressApi.deleteProgress(progressId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['userProgress', userId]);
        setErrorMessage("Learning progress deleted successfully.");
        setShowError(true);
      },
      onError: (error) => {
        console.error("Error deleting progress:", error);
        setErrorMessage("Failed to delete learning progress. Please try again.");
        setShowError(true);
      }
    }
  );

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleFollowToggle = () => {
    if (user?.isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  const handleFollowersClick = () => {
    setFollowDialogType('followers');
    setFollowDialogOpen(true);
  };

  const handleFollowingClick = () => {
    setFollowDialogType('following');
    setFollowDialogOpen(true);
  };

  const handleCloseError = () => {
    setShowError(false);
  };

  const handleCreatePost = () => {
    setCreatePostDialogOpen(true);
  };

  const handleCreateLearningPlan = () => {
    navigate('/learning-plans/create');
  };
  
  const handleCreateProgress = () => {
    setProgressToEdit(null);
    setCreateProgressDialogOpen(true);
  };
  
  const handleEditProgress = (progress) => {
    setProgressToEdit(progress);
    setCreateProgressDialogOpen(true);
  };
  
  const handleDeleteProgress = (progressId) => {
    if (window.confirm('Are you sure you want to delete this learning progress?')) {
      deleteProgressMutation.mutate(progressId);
    }
  };

  // Extract user data from response
  // Handle different response formats from different endpoints
  const user = userData?.data?.data || userData?.data || userData;
  const isFollowing = user?.isFollowing || false;  
  // Extract posts and learning plans
  const posts = postsData?.data?.content || postsData?.data || [];
  const learningPlans = learningPlansData?.data?.content || learningPlansData?.content || [];
  const learningProgress = progressData?.data?.content || progressData?.data || [];

  // Log data for debugging
  useEffect(() => {
    if (userData) {
      console.log("User data:", userData);
    }
    if (learningPlansData) {
      console.log("Learning plans data:", learningPlansData);
    }
    if (progressData) {
      console.log("Learning progress data:", progressData);
    }
  }, [userData, learningPlansData, progressData]);

  if (userLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (userError || !user) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          User not found
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Go to Home
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Paper sx={{ mb: 4, overflow: 'hidden' }}>
        {/* Cover Photo */}
        <Box
          sx={{
            height: 200,
            bgcolor: 'primary.light',
            position: 'relative',
            backgroundImage: user.coverPicture ? `url(${getFullImageUrl(user.coverPicture)})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        
        <Box sx={{ p: 3, position: 'relative' }}>
          {/* Profile Picture */}
          <Avatar
            src={getFullImageUrl(user.profilePicture)}
            alt={user.name}
            sx={{
              width: 120,
              height: 120,
              border: '4px solid white',
              position: 'absolute',
              top: -60,
              left: 24,
            }}
          />

          {/* Profile Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            {isOwnProfile ? (
              <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate('/edit-profile')}
            >
              Edit Profile
            </Button>
          ) : isAuthenticated && (
            <Button
              variant={isFollowing ? "outlined" : "contained"}
              startIcon={isFollowing ? <FollowingIcon /> : <FollowIcon />}
              onClick={handleFollowToggle}
              disabled={followMutation.isLoading || unfollowMutation.isLoading}
            >
              {isFollowing ? "Following" : "Follow"}
            </Button>
          )}
        </Box>

        {/* Profile Info */}
        <Box sx={{ mt: 5 }}>
          <Typography variant="h5" fontWeight="bold">
            {user.name}
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            @{user.username}
          </Typography>
          
          {user.bio && (
            <Typography variant="body1" paragraph>
              {user.bio}
            </Typography>
          )}

          {/* Stats */}
          <Box sx={{ display: 'flex', gap: 3, my: 2 }}>
            <Box 
              sx={{ cursor: 'pointer' }}
              onClick={handleFollowersClick}
            >
              <Typography variant="h6" component="span">
                {user.followers?.length || user.followerCount || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 1 }}>
                Followers
              </Typography>
            </Box>
            
            <Box 
              sx={{ cursor: 'pointer' }}
              onClick={handleFollowingClick}
            >
              <Typography variant="h6" component="span">
                {user.following?.length || user.followingCount || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 1 }}>
                Following
              </Typography>
            </Box>
          </Box>


          {/* Skills */}
          {user.skills?.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Skills
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {user.skills.map((skill) => (
                  <Chip 
                    key={skill} 
                    label={skill} 
                    size="small"
                    onClick={() => navigate(`/explore?skill=${encodeURIComponent(skill)}`)}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Paper>

    {/* Tabs */}
    <Paper sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ flexGrow: 1 }}
        >
          <Tab label="Posts" />
          <Tab label="Learning Plans" />
          <Tab label="Learning Progress" />
        </Tabs>
        
        {/* Add buttons for creating content */}
        {isOwnProfile && (
          <Box sx={{ pr: 2 }}>
            {tabValue === 0 ? (
              <Button
                variant="contained"
                color="primary"
                startIcon={<PostAddIcon />}
                onClick={handleCreatePost}
                size="small"
                sx={{ my: 1 }}
              >
                New Post
              </Button>
            ) : tabValue === 1 ? (
              <Button
                variant="contained"
                color="primary"
                startIcon={<PlanAddIcon />}
                onClick={handleCreateLearningPlan}
                size="small"
                sx={{ my: 1 }}
              >
                New Learning Plan
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                startIcon={<ProgressAddIcon />}
                onClick={handleCreateProgress}
                size="small"
                sx={{ my: 1 }}
              >
                Track Progress
              </Button>
            )}
          </Box>
        )}
      </Box>
    </Paper>

    {/* Tab Content */}
    {tabValue === 0 ? (
      /* Posts */
      postsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : posts.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No posts yet
          </Typography>
          {isOwnProfile && (
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleCreatePost}
              sx={{ mt: 2 }}
            >
              Create your first post
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {posts.map((post) => (
            <Grid item xs={12} key={post.id}>
              <PostCard post={post} />
            </Grid>
          ))}
        </Grid>
      )
    ) : tabValue === 1 ? (
      /* Learning Plans */
      plansLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : learningPlans.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No learning plans yet
          </Typography>
          {isOwnProfile && (
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleCreateLearningPlan}
              sx={{ mt: 2 }}
            >
              Create a learning plan
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {Array.isArray(learningPlans) ? learningPlans.map((plan) => (
            <Grid item xs={12} md={6} key={plan.id}>
              <LearningPlanCard 
                learningPlan={plan} 
                isOwner={isOwnProfile}
              />
            </Grid>
          )) : (
            <Grid item xs={12}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="error">
                  Error loading learning plans
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      )
    ) : (
      /* Learning Progress */
      progressLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : learningProgress.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No learning progress tracked yet
          </Typography>
          {isOwnProfile && (
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleCreateProgress}
              sx={{ mt: 2 }}
            >
              Track your learning progress
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {Array.isArray(learningProgress) ? learningProgress.map((progress) => (
            <Grid item xs={12} md={6} lg={4} key={progress.id}>
              <Paper sx={{ p: 3, height: '100%', position: 'relative' }}>
                {isOwnProfile && (
                  <Box sx={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 1 }}>
                    <IconButton 
                      size="small" 
                      color="primary" 
                      onClick={() => handleEditProgress(progress)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleDeleteProgress(progress.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
                
                <Typography variant="h6" sx={{ pr: 6 }}>
                  {progress.title}
                </Typography>
                
                <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
                  {progress.type} • {progress.startDate && new Date(progress.startDate).toLocaleDateString()}
                  {progress.completionDate && ` → ${new Date(progress.completionDate).toLocaleDateString()}`}
                </Typography>
                
                {progress.description && (
                  <Typography variant="body2" paragraph>
                    {progress.description}
                  </Typography>
                )}
                
                <Box sx={{ mt: 2, mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body2">Completion</Typography>
                    <Typography variant="body2">{progress.completionPercentage || 0}%</Typography>
                  </Box>
                  <Box sx={{ width: '100%', backgroundColor: '#eee', borderRadius: 1, height: 8, overflow: 'hidden' }}>
                    <Box 
                      sx={{ 
                        width: `${progress.completionPercentage || 0}%`,
                        height: '100%',
                        backgroundColor: 'primary.main'
                      }}
                    />
                  </Box>
                </Box>
                
                {progress.skills?.length > 0 && (
                  <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {progress.skills.map(skill => (
                      <Chip
                        key={skill}
                        label={skill}
                        size="small"
                        variant="outlined"
                        onClick={() => navigate(`/explore?skill=${encodeURIComponent(skill)}`)}
                      />
                    ))}
                  </Box>
                )}
                
                {progress.resourceUrl && (
                  <Button 
                    variant="text" 
                    size="small" 
                    href={progress.resourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ mt: 1 }}
                  >
                    View Resource
                  </Button>
                )}
              </Paper>
            </Grid>
          )) : (
            <Grid item xs={12}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="error">
                  Error loading learning progress
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      )
    )}

    {/* Floating Action Button for quick creation */}
    {isOwnProfile && (
      <Fab
        color="primary"
        aria-label={
          tabValue === 0 ? "add post" : 
          tabValue === 1 ? "add learning plan" :
          "track progress"
        }
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
        }}
        onClick={
          tabValue === 0 ? handleCreatePost : 
          tabValue === 1 ? handleCreateLearningPlan :
          handleCreateProgress
        }
      >
        <AddIcon />
      </Fab>
    )}

    {/* Followers/Following Dialog */}
    <FollowDialog
      open={followDialogOpen}
      onClose={() => setFollowDialogOpen(false)}
      userId={userId}
      type={followDialogType}
      username={user.username}
    />

    {/* Create Post Dialog */}
    <CreatePostDialog
      open={createPostDialogOpen}
      onClose={() => setCreatePostDialogOpen(false)}
    />
    
    {/* Create/Edit Progress Dialog */}
    {createProgressDialogOpen && (
      <CreateProgressDialog
        open={createProgressDialogOpen}
        onClose={() => {
          setCreateProgressDialogOpen(false);
          setProgressToEdit(null);
        }}
        progressToEdit={progressToEdit}
        userId={userId}
      />
    )}

    {/* Error Snackbar */}
    <Snackbar
      open={showError}
      autoHideDuration={6000}
      onClose={handleCloseError}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={handleCloseError} severity="error">
        {errorMessage}
      </Alert>
    </Snackbar>
  </Container>
);
}
