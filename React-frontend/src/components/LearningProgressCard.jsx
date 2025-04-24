import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper, Typography, Box, Chip, Button, IconButton,
  LinearProgress, Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  MenuBook as BookIcon,
  Code as CodeIcon,
  Assignment as ProjectIcon,
  EmojiEvents as CertificateIcon,
  Build as PracticeIcon,
  Bookmark as OtherIcon
} from '@mui/icons-material';

const getProgressTypeIcon = (type) => {
  switch (type) {
    case 'COURSE':
      return <SchoolIcon fontSize="small" />;
    case 'BOOK':
      return <BookIcon fontSize="small" />;
    case 'TUTORIAL':
      return <CodeIcon fontSize="small" />;
    case 'PROJECT':
      return <ProjectIcon fontSize="small" />;
    case 'CERTIFICATE':
      return <CertificateIcon fontSize="small" />;
    case 'PRACTICE':
      return <PracticeIcon fontSize="small" />;
    default:
      return <OtherIcon fontSize="small" />;
  }
};

export default function LearningProgressCard({ progress, isOwner, onEdit, onDelete }) {
  const navigate = useNavigate();

  // Format dates for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Paper sx={{ p: 3, height: '100%', position: 'relative', boxShadow: 1 }}>
      {/* Edit/Delete buttons */}
      {isOwner && (
        <Box sx={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 1 }}>
          <IconButton 
            size="small" 
            color="primary" 
            onClick={() => onEdit(progress)}
            aria-label="Edit progress"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            color="error"
            onClick={() => onDelete(progress.id)}
            aria-label="Delete progress"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
      
      {/* Title and Type */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Box sx={{ mr: 1, color: 'primary.main' }}>
          {getProgressTypeIcon(progress.type)}
        </Box>
        <Typography variant="h6" sx={{ pr: isOwner ? 6 : 0 }}>
          {progress.title}
        </Typography>
      </Box>
      
      {/* Dates */}
      <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
        {progress.type} • {formatDate(progress.startDate)}
        {progress.completionDate && ` → ${formatDate(progress.completionDate)}`}
      </Typography>
      
      {/* Description */}
      {progress.description && (
        <Typography variant="body2" sx={{ mb: 2 }}>
          {progress.description}
        </Typography>
      )}
      
      <Divider sx={{ my: 1.5 }} />
      
      {/* Progress bar */}
      <Box sx={{ mt: 2, mb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Typography variant="body2">Completion</Typography>
          <Typography variant="body2">{progress.completionPercentage || 0}%</Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={progress.completionPercentage || 0} 
          sx={{ height: 8, borderRadius: 1 }}
        />
      </Box>
      
      {/* Skills */}
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
      
      {/* Resource Link */}
      {progress.resourceUrl && (
        <Button 
          variant="text" 
          size="small" 
          href={progress.resourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ mt: 2 }}
        >
          View Resource
        </Button>
      )}
    </Paper>
  );
}
