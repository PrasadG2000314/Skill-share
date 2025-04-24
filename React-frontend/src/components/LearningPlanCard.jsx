import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Card, CardContent, CardActions, Typography, Box,
  Chip, LinearProgress, Button, IconButton, Menu,
  MenuItem, Dialog, DialogTitle, DialogContent,
  DialogActions, Avatar
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useMutation, useQueryClient } from 'react-query';
import { learningPlanApi } from '../services/api';
import { getFullImageUrl } from '../utils/imageUtils';

export default function LearningPlanCard({ learningPlan, isOwner = false }) {
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const completedSteps = learningPlan.steps?.filter(step => step.completed).length || 0;
  const totalSteps = learningPlan.steps?.length || 0;
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const deleteMutation = useMutation(
    () => learningPlanApi.deletePlan(learningPlan.id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['userLearningPlans']);
        queryClient.invalidateQueries(['learningPlan']);
        setConfirmDelete(false);
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
    navigate(`/learning-plans/edit/${learningPlan.id}`);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setConfirmDelete(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = () => {
    deleteMutation.mutate();
  };

  const handleDeleteCancel = () => {
    setConfirmDelete(false);
  };

  return (
    <Card elevation={2}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" component={RouterLink} to={`/learning-plans/${learningPlan.id}`} sx={{ 
            textDecoration: 'none', 
            color: 'inherit',
            '&:hover': { textDecoration: 'underline' }
          }}>
            {learningPlan.title}
          </Typography>
          
          {isOwner && (
            <IconButton onClick={handleMenuOpen} size="small">
              <MoreVertIcon />
            </IconButton>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>

          <Typography 
            variant="body2" 
            color="text.secondary"
            component={RouterLink}
            to={`/profile/${learningPlan.userId}`}
            sx={{ 
              textDecoration: 'none', 
              color: 'text.secondary',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            {learningPlan.userName}
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ 
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          fontSize: '0.8rem'
        }}>
          <TimeIcon fontSize="small" sx={{ mr: 0.5 }} />
          Created {format(new Date(learningPlan.createdAt), 'MMM d, yyyy')}
        </Typography>

        <Typography variant="body1" sx={{ mb: 2 }}>
          {learningPlan.description}
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="body2">
              Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {completedSteps}/{totalSteps} steps
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 6, borderRadius: 3 }} 
          />
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {learningPlan.skill && (
            <Chip 
              key={learningPlan.skill} 
              label={learningPlan.skill} 
              size="small" 
              variant="outlined" 
              color="primary"
            />
          )}
        </Box>
      </CardContent>
      
      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button 
          component={RouterLink} 
          to={`/learning-plans/${learningPlan.id}`}
          size="small" 
          variant="contained"
        >
          View Plan
        </Button>
      </CardActions>

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>Edit</MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <DeleteIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }} />
          <Typography color="error">Delete</Typography>
        </MenuItem>
      </Menu>

      <Dialog open={confirmDelete} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this learning plan? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm} 
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
