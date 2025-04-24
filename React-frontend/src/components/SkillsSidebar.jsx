import { Box, Paper, Typography, List, ListItem, ListItemText, Chip, Divider } from '@mui/material';
import { useQuery } from 'react-query';
import { Link as RouterLink } from 'react-router-dom';
import { userApi } from '../services/api';

const POPULAR_SKILLS = [
  'Programming', 'Design', 'Photography', 'Writing', 
  'Music', 'Cooking', 'Languages', 'Marketing'
];

export default function SkillsSidebar() {
  const { data: suggestedUsers } = useQuery(
    ['suggestedUsers'],
    () => userApi.getSuggestedUsers(),
    {
      enabled: true,
      staleTime: 300000, // 5 minutes
    }
  );
  
  const users = suggestedUsers?.data || [];

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Popular Skills
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {POPULAR_SKILLS.map(skill => (
            <Chip 
              key={skill} 
              label={skill} 
              component={RouterLink} 
              to={`/explore?skill=${skill}`}
              clickable
              color="primary"
              variant="outlined"
            />
          ))}
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Suggested Users
        </Typography>
        
        {users.length > 0 ? (
          <List disablePadding>
            {users.map((user, index) => (
              <Box key={user.id}>
                {index > 0 && <Divider component="li" />}
                <ListItem 
                  button 
                  component={RouterLink}
                  to={`/profile/${user.id}`}
                  sx={{ px: 0 }}
                >
                  <Box
                    component="img"
                    src={user.profilePicture || '/default-avatar.png'}
                    alt={user.name}
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: '50%',
                      mr: 2,
                      objectFit: 'cover'
                    }}
                  />
                  <ListItemText
                    primary={user.name}
                    secondary={
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {user.skills?.slice(0, 2).join(', ')}
                      </Typography>
                    }
                  />
                </ListItem>
              </Box>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            No suggestions available right now.
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
