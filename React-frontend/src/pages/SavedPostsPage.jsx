import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Grid, CircularProgress,
  Paper, Button, Tabs, Tab
} from '@mui/material';
import {
  BookmarkBorder as BookmarkIcon,
  MenuBook as PlanIcon
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { postApi, learningPlanApi } from '../services/api';
import PostCard from '../components/PostCard';
import LearningPlanCard from '../components/LearningPlanCard';

export default function SavedPostsPage() {
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();

  const { data: savedPostsData, isLoading: postsLoading } = useQuery(
    'savedPosts',
    () => postApi.getSavedPosts(),
    {
      enabled: tabValue === 0,
      staleTime: 60000, // 1 minute
    }
  );

  const { data: savedPlansData, isLoading: plansLoading } = useQuery(
    'savedLearningPlans',
    () => learningPlanApi.getSavedPlans(),
    {
      enabled: tabValue === 1,
      staleTime: 60000, // 1 minute
    }
  );

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const savedPosts = savedPostsData?.data || [];
  const savedPlans = savedPlansData?.data || [];

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Saved Items
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and manage your saved posts and learning plans
        </Typography>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab icon={<BookmarkIcon />} label="Saved Posts" />
          <Tab icon={<PlanIcon />} label="Saved Learning Plans" />
        </Tabs>
      </Paper>

      {tabValue === 0 ? (
        /* Saved Posts */
        postsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : savedPosts.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              No saved posts yet
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate('/explore')}
              sx={{ mt: 2 }}
            >
              Explore posts
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {savedPosts.map((post) => (
              <Grid item xs={12} key={post.id}>
                <PostCard post={post} />
              </Grid>
            ))}
          </Grid>
        )
      ) : (
        /* Saved Learning Plans */
        plansLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : savedPlans.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              No saved learning plans yet
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate('/explore')}
              sx={{ mt: 2 }}
            >
              Explore learning plans
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {savedPlans.map((plan) => (
              <Grid item xs={12} md={6} key={plan.id}>
                <LearningPlanCard plan={plan} />
              </Grid>
            ))}
          </Grid>
        )
      )}
    </Container>
  );
}
