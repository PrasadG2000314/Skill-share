import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Stack, Typography, 
  MenuItem, LinearProgress, FormHelperText,
  IconButton
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { learningProgressApi, skillApi } from '../services/api';
import CreatableSelect from 'react-select/creatable';

const progressTypes = [
  { value: 'COURSE', label: 'Course' },
  { value: 'TUTORIAL', label: 'Tutorial' },
  { value: 'PROJECT', label: 'Project' },
  { value: 'CERTIFICATE', label: 'Certificate' },
  { value: 'BOOK', label: 'Book' },
  { value: 'PRACTICE', label: 'Practice' },
  { value: 'OTHER', label: 'Other' }
];

const CreateProgressDialog = ({ open, onClose, progressToEdit = null, userId }) => {
  const isEditMode = !!progressToEdit;
  const queryClient = useQueryClient();
  
  const initialFormState = {
    title: '',
    description: '',
    type: 'COURSE',
    skills: [],
    resourceUrl: '',
    completionPercentage: 0,
    startDate: new Date().toISOString().split('T')[0],
    completionDate: ''
  };
  
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch skills for autocomplete
  const { data: skillsData } = useQuery(
    ['skills'],
    skillApi.getTrendingSkills,
    { staleTime: 300000 } // 5 min cache
  );
  
  const skillOptions = skillsData?.data?.map(skill => ({ 
    value: skill.name, 
    label: skill.name 
  })) || [];

  // Setup mutations
  const createMutation = useMutation(
    (data) => learningProgressApi.createProgress(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['userProgress', userId]);
        onClose();
        setIsSubmitting(false);
      },
      onError: (error) => {
        console.error('Error creating progress:', error);
        setIsSubmitting(false);
      }
    }
  );
  
  const updateMutation = useMutation(
    ({ id, data }) => learningProgressApi.updateProgress(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['userProgress', userId]);
        onClose();
        setIsSubmitting(false);
      },
      onError: (error) => {
        console.error('Error updating progress:', error);
        setIsSubmitting(false);
      }
    }
  );
  
  // Load existing data if in edit mode
  useEffect(() => {
    if (isEditMode && progressToEdit) {
      // Format dates for input field
      const startDate = progressToEdit.startDate ? 
        new Date(progressToEdit.startDate).toISOString().split('T')[0] : '';
      const completionDate = progressToEdit.completionDate ? 
        new Date(progressToEdit.completionDate).toISOString().split('T')[0] : '';
        
      setFormData({
        title: progressToEdit.title || '',
        description: progressToEdit.description || '',
        type: progressToEdit.type || 'COURSE',
        skills: progressToEdit.skills || [],
        resourceUrl: progressToEdit.resourceUrl || '',
        completionPercentage: progressToEdit.completionPercentage || 0,
        startDate: startDate,
        completionDate: completionDate
      });
    } else {
      setFormData(initialFormState);
    }
  }, [isEditMode, progressToEdit]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  const handleSkillChange = (selectedOptions) => {
    const skills = selectedOptions ? selectedOptions.map(option => option.value) : [];
    setFormData(prev => ({ ...prev, skills }));
  };
  
  const handleTypeChange = (e) => {
    setFormData(prev => ({ ...prev, type: e.target.value }));
  };
  
  const handleCompletionChange = (e) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value)) value = 0;
    if (value < 0) value = 0;
    if (value > 100) value = 100;
    
    setFormData(prev => ({ ...prev, completionPercentage: value }));
  };
  
  const validate = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.type) {
      newErrors.type = 'Type is required';
    }
    
    if (formData.startDate && formData.completionDate && 
        new Date(formData.startDate) > new Date(formData.completionDate)) {
      newErrors.completionDate = 'Completion date cannot be before start date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    if (isEditMode) {
      updateMutation.mutate({
        id: progressToEdit.id,
        data: formData
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          {isEditMode ? 'Edit Learning Progress' : 'Create Learning Progress'}
        </Typography>
        <IconButton aria-label="close" onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <Stack spacing={3}>
            <TextField
              fullWidth
              id="title"
              name="title"
              label="Title"
              placeholder="What are you learning?"
              value={formData.title}
              onChange={handleChange}
              error={!!errors.title}
              helperText={errors.title}
              required
            />
            
            <TextField
              fullWidth
              id="description"
              name="description"
              label="Description"
              placeholder="Describe what you're learning..."
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={3}
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                select
                fullWidth
                id="type"
                name="type"
                label="Type"
                value={formData.type}
                onChange={handleTypeChange}
                error={!!errors.type}
                helperText={errors.type}
                required
              >
                {progressTypes.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </TextField>
              
              <Box sx={{ width: '100%' }}>
                <Typography variant="body2" gutterBottom>
                  Completion Percentage
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={formData.completionPercentage} 
                  sx={{ height: 8, borderRadius: 1, mb: 1 }}
                />
                <TextField
                  fullWidth
                  id="completionPercentage"
                  name="completionPercentage"
                  type="number"
                  InputProps={{
                    endAdornment: <Typography variant="body2">%</Typography>
                  }}
                  inputProps={{
                    min: 0,
                    max: 100
                  }}
                  value={formData.completionPercentage}
                  onChange={handleCompletionChange}
                />
              </Box>
            </Box>
            
            <Box>
              <Typography variant="body2" gutterBottom>
                Skills
              </Typography>
              <CreatableSelect
                isMulti
                name="skills"
                options={skillOptions}
                className="basic-multi-select"
                classNamePrefix="select"
                value={formData.skills.map(skill => ({ value: skill, label: skill }))}
                onChange={handleSkillChange}
                placeholder="Add skills you're learning..."
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '56px',
                  })
                }}
              />
            </Box>
            
            <TextField
              fullWidth
              id="resourceUrl"
              name="resourceUrl"
              label="Resource URL"
              placeholder="https://example.com/course"
              value={formData.resourceUrl}
              onChange={handleChange}
              type="url"
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                id="startDate"
                name="startDate"
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              
              <TextField
                fullWidth
                id="completionDate"
                name="completionDate"
                label="Completion Date"
                type="date"
                value={formData.completionDate}
                onChange={handleChange}
                error={!!errors.completionDate}
                helperText={errors.completionDate}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Box>
          </Stack>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit} 
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateProgressDialog;
