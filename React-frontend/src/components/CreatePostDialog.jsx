import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, IconButton, Box, Chip, CircularProgress,
  Typography, Alert
} from '@mui/material';
import { Close as CloseIcon, Add as AddIcon, PhotoCamera } from '@mui/icons-material';
import { useMutation, useQueryClient } from 'react-query';
import { postApi } from '../services/api';

export default function CreatePostDialog({ open, onClose }) {
  const [content, setContent] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState([]);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const createPostMutation = useMutation(
    (postData) => postApi.createPost(postData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['feed']);
        queryClient.invalidateQueries(['userPosts']);
        resetForm();
        onClose();
      },
      onError: (err) => {
        console.error('Error creating post:', err);
        setError(err.response?.data?.message || 'Failed to create post. Please try again.');
      }
    }
  );

  const handleSubmit = () => {
    setError('');
    if (!content.trim()) {
      setError('Post content cannot be empty');
      return;
    }

    createPostMutation.mutate({
      content: content.trim(),
      skills: skills,
      files: files
    });
  };

  const handleAddSkill = () => {
    const trimmedSkill = skillInput.trim();
    if (
      trimmedSkill && 
      !skills.includes(trimmedSkill) &&
      skills.length < 5
    ) {
      setSkills([...skills, trimmedSkill]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleSkillInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const resetForm = () => {
    setContent('');
    setSkills([]);
    setSkillInput('');
    setFiles([]);
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Create Post</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <TextField
          autoFocus
          fullWidth
          multiline
          rows={4}
          placeholder="What would you like to share?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          variant="outlined"
          sx={{ mb: 3 }}
        />
        
        <Typography variant="subtitle2" gutterBottom>
          Related Skills (optional)
        </Typography>
        <Box sx={{ display: 'flex', mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Add a skill and press Enter"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyPress={handleSkillInputKeyPress}
            disabled={skills.length >= 5}
            size="small"
          />
          <Button
            onClick={handleAddSkill}
            disabled={!skillInput.trim() || skills.length >= 5}
            sx={{ ml: 1 }}
          >
            <AddIcon />
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {skills.map((skill) => (
            <Chip
              key={skill}
              label={skill}
              onDelete={() => handleRemoveSkill(skill)}
              size="small"
            />
          ))}
        </Box>
        
        {skills.length >= 5 && (
          <Typography variant="caption" color="text.secondary">
            Maximum of 5 skills reached
          </Typography>
        )}

        {/* Add file upload feature */}
        <Box sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            component="label"
            startIcon={<PhotoCamera />}
          >
            Add Media
            <input
              type="file"
              multiple
              hidden
              accept="image/*, video/*"
              onChange={handleFileChange}
            />
          </Button>
          {files.length > 0 && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {files.length} file(s) selected
            </Typography>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!content.trim() || createPostMutation.isLoading}
        >
          {createPostMutation.isLoading ? <CircularProgress size={24} /> : "Post"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
