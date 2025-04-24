import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Grid, Box, Typography, Button, Paper, Tabs, Tab,
  Divider, CircularProgress, TextField
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useQuery } from 'react-query';
import { AuthContext } from '../contexts/AuthContext';
import { postApi, userApi } from '../services/api';
import PostCard from '../components/PostCard';
import SuggestedUserCard from '../components/SuggestedUserCard';
import TrendingSkillsCard from '../components/TrendingSkillsCard';
import CreatePostDialog from '../components/CreatePostDialog';
import { getFullImageUrl } from '../utils/imageUtils';
export default function HomePage() {
  const [tabValue, setTabValue] = useState(0);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const { currentUser, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const { data: feedData, isLoading: feedLoading } = useQuery(
    ['feed', tabValue],
    () => tabValue === 0 
      ? postApi.getFeed() 
      : postApi.getExploreFeed(),
    {
      enabled: isAuthenticated,
      staleTime: 60000, // 1 minute
    }
  );

  const { data: suggestedUsersData } = useQuery(
    ['suggestedUsers'],
    () => userApi.getSuggestedUsers(),
    {
      enabled: isAuthenticated,
      staleTime: 300000, // 5 minutes
    }
  );

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Get the posts from the response structure correctly
  const posts = feedData?.data?.content || [];

  return (
    <Container maxWidth="lg">
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Main content */}
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1">
              Feed
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreatePostOpen(true)}
            >
              Create Post
            </Button>
          </Box>

          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Feed" />
              <Tab label="Discover" />
            </Tabs>
          </Paper>

          {feedLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : posts.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                {tabValue === 0 ? "Your feed is empty" : "No posts to discover"}
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {tabValue === 0 
                  ? "Follow more people to see their posts here" 
                  : "Try again later for new content"}
              </Typography>
              {tabValue === 0 && (
                <Button 
                  variant="contained" 
                  onClick={() => navigate('/explore')}
                >
                  Find People to Follow
                </Button>
              )}
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {posts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </Box>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Box sx={{ position: 'sticky', top: 100 }}>
            {/* User Profile Card */}
            {currentUser && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box 
                  component="img"
                  src={getFullImageUrl(currentUser.profilePicture) || '/default-avatar.png'}
                  alt={currentUser.name}
                  sx={{ 
                    width: 60, 
                    height: 60, 
                    borderRadius: '50%',
                    mr: 2
                  }}
                />
                  <Box>
                    <Typography variant="h6">
                      {currentUser.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      @{currentUser.username}
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Button 
                  fullWidth 
                  variant="outlined" 
                  onClick={() => navigate(`/profile/${currentUser.id}`)}
                >
                  View Profile
                </Button>
              </Paper>
            )}

            {/* Trending Skills */}
            <TrendingSkillsCard sx={{ mb: 3 }} />

            {/* Suggested Users */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Suggested Users
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                {suggestedUsersData?.data?.slice(0, 3).map(user => (
                  <SuggestedUserCard key={user.id} user={user} />
                ))}
                {!suggestedUsersData?.data?.length && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                    No suggestions available
                  </Typography>
                )}
              </Box>
              <Button 
                fullWidth 
                sx={{ mt: 2 }}
                onClick={() => navigate('/explore')}
              >
                See More
              </Button>
            </Paper>
          </Box>
        </Grid>
      </Grid>

      <CreatePostDialog 
        open={createPostOpen} 
        onClose={() => setCreatePostOpen(false)} 
      />
    </Container>
  );
}
