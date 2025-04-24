import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container, Box, Typography, TextField, Button, Paper,
  FormControl, FormHelperText, InputLabel, Chip, IconButton,
  CircularProgress, Alert
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useQuery, useMutation } from 'react-query';
import { learningPlanApi } from '../services/api';

const validationSchema = Yup.object({
  title: Yup.string()
    .required('Title is required')
    .max(100, 'Title must be at most 100 characters'),
  description: Yup.string()
    .required('Description is required')
    .max(1000, 'Description must be at most 1000 characters'),
  skills: Yup.array()
    .min(1, 'At least one skill is required')
    .max(10, 'Maximum 10 skills are allowed'),
});

export default function CreateLearningPlanPage() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [newSkill, setNewSkill] = useState('');
  const [error, setError] = useState('');
  const isEditMode = !!planId;

  const { data: planData, isLoading: fetchLoading } = useQuery(
    ['learningPlan', planId],
    () => learningPlanApi.getPlan(planId),
    {
      enabled: isEditMode,
      onError: () => {
        setError('Failed to load learning plan. Please try again.');
      }
    }
  );

  const createMutation = useMutation(
    (data) => learningPlanApi.createPlan(data),
    {
      onSuccess: (response) => {
        navigate(`/learning-plans/${response.data.id}`);
      },
      onError: (err) => {
        setError(err.response?.data?.message || 'Failed to create learning plan');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => learningPlanApi.updatePlan(id, data),
    {
      onSuccess: (response) => {
        navigate(`/learning-plans/${response.data.id}`);
      },
      onError: (err) => {
        setError(err.response?.data?.message || 'Failed to update learning plan');
      }
    }
  );

  const formik = useFormik({
    initialValues: {
      title: '',
      description: '',
      skills: [],
    },
    validationSchema,
    onSubmit: (values) => {
      setError('');
      if (isEditMode) {
        updateMutation.mutate({ id: planId, data: values });
      } else {
        createMutation.mutate(values);
      }
    },
  });

  useEffect(() => {
    if (planData?.data && isEditMode) {
      const plan = planData.data;
      formik.setValues({
        title: plan.title || '',
        description: plan.description || '',
        skills: plan.skills || [],
      });
    }
  }, [planData, isEditMode]);

  const handleSkillAdd = () => {
    const skill = newSkill.trim();
    if (
      skill && 
      !formik.values.skills.includes(skill) && 
      formik.values.skills.length < 10
    ) {
      formik.setFieldValue('skills', [...formik.values.skills, skill]);
      setNewSkill('');
    }
  };

  const handleSkillDelete = (skillToDelete) => {
    formik.setFieldValue(
      'skills',
      formik.values.skills.filter((skill) => skill !== skillToDelete)
    );
  };

  const handleSkillKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSkillAdd();
    }
  };

  if (fetchLoading && isEditMode) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={2} sx={{ p: 4, my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEditMode ? 'Edit Learning Plan' : 'Create Learning Plan'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={formik.handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="title"
            label="Title"
            name="title"
            autoFocus
            value={formik.values.title}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.title && Boolean(formik.errors.title)}
            helperText={formik.touched.title && formik.errors.title}
            disabled={createMutation.isLoading || updateMutation.isLoading}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            id="description"
            label="Description"
            name="description"
            multiline
            rows={4}
            value={formik.values.description}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.description && Boolean(formik.errors.description)}
            helperText={formik.touched.description && formik.errors.description}
            disabled={createMutation.isLoading || updateMutation.isLoading}
          />

          <FormControl 
            fullWidth 
            margin="normal"
            error={formik.touched.skills && Boolean(formik.errors.skills)}
          >
            <InputLabel htmlFor="skills" shrink>
              Skills (required)
            </InputLabel>
            <Box sx={{ display: 'flex', mt: 3 }}>
              <TextField
                fullWidth
                id="newSkill"
                placeholder="Add a skill and press Enter"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={handleSkillKeyPress}
                disabled={formik.values.skills.length >= 10 || createMutation.isLoading || updateMutation.isLoading}
                size="small"
              />
              <Button
                onClick={handleSkillAdd}
                disabled={!newSkill.trim() || formik.values.skills.length >= 10 || createMutation.isLoading || updateMutation.isLoading}
                sx={{ ml: 1 }}
              >
                <AddIcon />
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
              {formik.values.skills.map((skill) => (
                <Chip
                  key={skill}
                  label={skill}
                  onDelete={() => handleSkillDelete(skill)}
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  deleteIcon={
                    <IconButton size="small">
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  }
                />
              ))}
            </Box>

            {formik.touched.skills && formik.errors.skills && (
              <FormHelperText error>{formik.errors.skills}</FormHelperText>
            )}
          </FormControl>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
            <Button 
              onClick={() => navigate(-1)}
              disabled={createMutation.isLoading || updateMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isLoading || updateMutation.isLoading}
            >
              {(createMutation.isLoading || updateMutation.isLoading) ? (
                <CircularProgress size={24} />
              ) : isEditMode ? (
                'Update Plan'
              ) : (
                'Create Plan'
              )}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
