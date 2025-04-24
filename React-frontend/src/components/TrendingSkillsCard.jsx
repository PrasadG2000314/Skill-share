import { useNavigate } from 'react-router-dom';
import {
  Paper, Typography, List, ListItem, ListItemText,
  ListItemIcon, Chip, Box, Skeleton
} from '@mui/material';
import { TrendingUp as TrendingIcon } from '@mui/icons-material';
import { useQuery } from 'react-query';
import { skillApi } from '../services/api';

export default function TrendingSkillsCard({ sx = {} }) {
  const navigate = useNavigate();
  
  const { data, isLoading } = useQuery(
    ['trendingSkills'],
    () => skillApi.getTrendingSkills(),
    {
      staleTime: 300000, // 5 minutes
    }
  );

  const handleSkillClick = (skill) => {
    navigate(`/explore?skill=${encodeURIComponent(skill.name)}`);
  };

  return (
    <Paper sx={{ p: 3, ...sx }}>
      <Typography variant="h6" gutterBottom>
        Trending Skills
      </Typography>
      
      {isLoading ? (
        <List dense disablePadding>
          {[...Array(5)].map((_, index) => (
            <ListItem key={index} disablePadding sx={{ py: 1 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Skeleton variant="circular" width={24} height={24} />
              </ListItemIcon>
              <ListItemText
                primary={<Skeleton width="70%" />}
                secondary={<Skeleton width="40%" />}
              />
            </ListItem>
          ))}
        </List>
      ) : !data?.data?.length ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          No trending skills available
        </Typography>
      ) : (
        <List dense disablePadding>
          {data.data.slice(0, 5).map((skill) => (
            <ListItem 
              key={skill.name} 
              disablePadding 
              sx={{ py: 1 }}
              secondaryAction={
                <Chip
                  size="small"
                  label={`${skill.postCount} posts`}
                  onClick={() => handleSkillClick(skill)}
                  clickable
                />
              }
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <TrendingIcon color="primary" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box 
                    component="span" 
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                    onClick={() => handleSkillClick(skill)}
                  >
                    {skill.name}
                  </Box>
                }
                secondary={`${skill.growthRate}% this week`}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
}
