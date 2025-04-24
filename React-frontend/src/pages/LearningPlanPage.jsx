import { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Paper, Button, Divider, List, ListItem,
  ListItemText, ListItemIcon, Checkbox, TextField, IconButton, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowUpward as MoveUpIcon,
  ArrowDownward as MoveDownIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import { AuthContext } from '../contexts/AuthContext';
import { learningPlanApi } from '../services/api';

export default function LearningPlanPage() {
  const { planId } = useParams();
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [newStep, setNewStep] = useState('');
  const [editingStep, setEditingStep] = useState(null);
  const [editedStepContent, setEditedStepContent] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addStepError, setAddStepError] = useState('');

  const { data, isLoading, error } = useQuery(
    ['learningPlan', planId],
    () => learningPlanApi.getPlan(planId),
    {
      enabled: !!planId,
      onError: (err) => {
        console.error("Error fetching learning plan:", err);
      }
    }
  );

  const toggleCompleteMutation = useMutation(
    ({ stepId, completed }) => learningPlanApi.updatePlanStep(planId, stepId, { completed }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['learningPlan', planId]);
        queryClient.invalidateQueries(['userLearningPlans']);
      }
    }
  );

  const addStepMutation = useMutation(
    (content) => learningPlanApi.addPlanStep(planId, { content }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['learningPlan', planId]);
        queryClient.invalidateQueries(['userLearningPlans']);
        setNewStep('');
        setAddStepError('');
      },
      onError: (error) => {
        setAddStepError(error.response?.data?.message || 'Failed to add step');
      }
    }
  );

  const updateStepMutation = useMutation(
    ({ stepId, content }) => learningPlanApi.updatePlanStep(planId, stepId, { content }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['learningPlan', planId]);
        queryClient.invalidateQueries(['userLearningPlans']);
        setEditingStep(null);
      }
    }
  );

  const deleteStepMutation = useMutation(
    (stepId) => learningPlanApi.deletePlanStep(planId, stepId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['learningPlan', planId]);
        queryClient.invalidateQueries(['userLearningPlans']);
      }
    }
  );

  const reorderStepMutation = useMutation(
    ({ stepId, direction }) => learningPlanApi.reorderPlanStep(planId, stepId, direction),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['learningPlan', planId]);
        queryClient.invalidateQueries(['userLearningPlans']);
      }
    }
  );

  const deletePlanMutation = useMutation(
    () => learningPlanApi.deletePlan(planId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['userLearningPlans']);
        navigate('/profile/' + currentUser.id);
      }
    }
  );

  const handleToggleComplete = (stepId, currentStatus) => {
    toggleCompleteMutation.mutate({ stepId, completed: !currentStatus });
  };

  const handleAddStep = (e) => {
    e.preventDefault();
    if (newStep.trim()) {
      addStepMutation.mutate(newStep.trim());
    }
  };

  const handleEditStep = (step) => {
    setEditingStep(step);
    // Fix: Set the edited content based on the step's content, description, or title
    setEditedStepContent(step.content || step.description || step.title || '');
  };

  const handleSaveEdit = () => {
    if (editedStepContent.trim()) {
      updateStepMutation.mutate({
        stepId: editingStep.id,
        content: editedStepContent.trim()
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingStep(null);
    setEditedStepContent('');
  };

  const handleDeleteStep = (stepId) => {
    deleteStepMutation.mutate(stepId);
  };

  const handleReorderStep = (stepId, direction) => {
    reorderStepMutation.mutate({ stepId, direction });
  };

  const handleDeletePlan = () => {
    setConfirmDelete(true);
  };

  const handleDeletePlanConfirm = () => {
    deletePlanMutation.mutate();
  };

  // Fix: When editing a learning plan, navigate to edit page with state containing the plan data
  const handleEditPlan = () => {
    navigate(`/learning-plans/edit/${planId}`, { 
      state: { 
        plan: {
          title: plan.title,
          description: plan.description,
          skill: plan.skill,
          steps: plan.steps
        } 
      }
    });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Box sx={{ my: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Error loading learning plan
          </Typography>
          <Button variant="contained" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </Box>
      </Container>
    );
  }

  const plan = data?.data;
  if (!plan) {
    return (
      <Container maxWidth="md">
        <Box sx={{ my: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Learning plan not found
          </Typography>
          <Button variant="contained" onClick={() => navigate('/profile/' + (currentUser?.id || ''))}>
            Go to Profile
          </Button>
        </Box>
      </Container>
    );
  }

  const isOwner = currentUser?.id === plan.userId;
  const completedSteps = plan.steps?.filter(step => step.completed).length || 0;
  const totalSteps = plan.steps?.length || 0;
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3, my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Typography variant="h4" component="h1">
            {plan.title}
          </Typography>
          
          {isOwner && (
            <Box>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEditPlan}
                sx={{ mr: 1 }}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDeletePlan}
              >
                Delete
              </Button>
            </Box>
          )}
        </Box>

        <Typography variant="body1" paragraph>
          {plan.description}
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
          {plan.skills && plan.skills.length > 0 ? (
            plan.skills.map(skill => (
              <Chip
                key={skill}
                label={skill}
                variant="outlined"
                color="primary"
              />
            ))
          ) : plan.skill ? (
            <Chip
              key={plan.skill}
              label={plan.skill}
              variant="outlined"
              color="primary"
            />
          ) : null}
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ 
            mb: 2,
            display: 'flex',
            alignItems: 'center'
          }}>
            Created by {plan.userName || 'User'} on {format(new Date(plan.createdAt), 'MMMM d, yyyy')}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="subtitle1">
              Progress: {progress}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {completedSteps}/{totalSteps} steps completed
            </Typography>
          </Box>
          <Box sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 1, height: 8, overflow: 'hidden' }}>
            <Box sx={{ width: `${progress}%`, height: '100%', bgcolor: 'primary.main' }} />
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" gutterBottom>
          Learning Steps
        </Typography>

        {plan.steps?.length > 0 ? (
          <List>
            {plan.steps.map((step, index) => (
              <ListItem
                key={step.id}
                sx={{
                  bgcolor: editingStep?.id === step.id ? 'action.hover' : 'inherit',
                  borderRadius: 1,
                  mb: 1
                }}
                secondaryAction={
                  isOwner && (
                    <Box>
                      {editingStep?.id !== step.id && (
                        <>
                          {index > 0 && (
                            <IconButton
                              edge="end"
                              onClick={() => handleReorderStep(step.id, 'up')}
                              size="small"
                            >
                              <MoveUpIcon />
                            </IconButton>
                          )}
                          {index < plan.steps.length - 1 && (
                            <IconButton
                              edge="end"
                              onClick={() => handleReorderStep(step.id, 'down')}
                              size="small"
                            >
                              <MoveDownIcon />
                            </IconButton>
                          )}
                          <IconButton
                            edge="end"
                            onClick={() => handleEditStep(step)}
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() => handleDeleteStep(step.id)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  )
                }
              >
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={step.completed}
                    onChange={() => handleToggleComplete(step.id, step.completed)}
                    disabled={!isOwner && !currentUser}
                  />
                </ListItemIcon>
                
                {editingStep?.id === step.id ? (
                  <Box sx={{ width: '100%' }}>
                    <TextField
                      fullWidth
                      multiline
                      variant="outlined"
                      value={editedStepContent}
                      onChange={(e) => setEditedStepContent(e.target.value)}
                      autoFocus
                      sx={{ mb: 1 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Button size="small" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                      <Button 
                        size="small" 
                        variant="contained" 
                        onClick={handleSaveEdit}
                        disabled={updateStepMutation.isLoading}
                      >
                        Save
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <ListItemText
                    primary={step.content || step.description || step.title}
                    sx={{
                      textDecoration: step.completed ? 'line-through' : 'none',
                      color: step.completed ? 'text.secondary' : 'text.primary'
                    }}
                  />
                )}
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            No steps added yet
          </Typography>
        )}

        {isOwner && (
          <Box component="form" onSubmit={handleAddStep} sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Add New Step
            </Typography>
            
            {addStepError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {addStepError}
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                placeholder="Enter a new learning step..."
                value={newStep}
                onChange={(e) => setNewStep(e.target.value)}
                variant="outlined"
                size="small"
              />
              <Button
                type="submit"
                variant="contained"
                startIcon={<AddIcon />}
                disabled={!newStep.trim() || addStepMutation.isLoading}
              >
                Add
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this learning plan? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button 
            onClick={handleDeletePlanConfirm} 
            color="error" 
            variant="contained"
            disabled={deletePlanMutation.isLoading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
