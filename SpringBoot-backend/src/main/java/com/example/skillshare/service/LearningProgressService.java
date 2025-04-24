package com.example.skillshare.service;

import com.example.skillshare.dto.LearningProgressDto;
import com.example.skillshare.model.LearningProgress;
import com.example.skillshare.model.User;
import com.example.skillshare.repository.LearningProgressRepository;
import com.example.skillshare.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
public class LearningProgressService {

    @Autowired
    private LearningProgressRepository learningProgressRepository;

    @Autowired
    private UserRepository userRepository;

    public LearningProgress createLearningProgress(String email, LearningProgressDto progressDto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LearningProgress progress = new LearningProgress();
        progress.setUserId(user.getId());
        progress.setTitle(progressDto.getTitle());
        progress.setDescription(progressDto.getDescription());
        progress.setType(progressDto.getType());

        // Handle both single skill and multiple skills
        if (progressDto.getSkills() != null && !progressDto.getSkills().isEmpty()) {
            progress.setSkills(progressDto.getSkills());
            // Also set the single skill field for backward compatibility
            if (!progressDto.getSkills().isEmpty()) {
                progress.setSkill(progressDto.getSkills().get(0));
            }
        } else if (progressDto.getSkill() != null && !progressDto.getSkill().isEmpty()) {
            // If only single skill is provided
            progress.setSkill(progressDto.getSkill());
            List<String> skillsList = new ArrayList<>();
            skillsList.add(progressDto.getSkill());
            progress.setSkills(skillsList);
        }

        progress.setResourceUrl(progressDto.getResourceUrl());
        progress.setCompletionPercentage(progressDto.getCompletionPercentage());
        progress.setStartDate(progressDto.getStartDate());
        progress.setCompletionDate(progressDto.getCompletionDate());
        progress.setUserName(user.getName());
        progress.setUserProfilePicture(user.getProfilePicture());

        progress.setCreatedAt(new Date());
        progress.setUpdatedAt(new Date());

        return learningProgressRepository.save(progress);
    }

    public LearningProgress updateLearningProgress(String email, String progressId, LearningProgressDto progressDto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LearningProgress progress = learningProgressRepository.findById(progressId)
                .orElseThrow(() -> new RuntimeException("Learning progress not found"));

        if (!progress.getUserId().equals(user.getId())) {
            throw new RuntimeException("You are not authorized to update this learning progress");
        }

        progress.setTitle(progressDto.getTitle());
        progress.setDescription(progressDto.getDescription());
        progress.setType(progressDto.getType());

        // Handle both single skill and multiple skills
        if (progressDto.getSkills() != null && !progressDto.getSkills().isEmpty()) {
            progress.setSkills(progressDto.getSkills());
            // Also set the single skill field for backward compatibility
            if (!progressDto.getSkills().isEmpty()) {
                progress.setSkill(progressDto.getSkills().get(0));
            }
        } else if (progressDto.getSkill() != null && !progressDto.getSkill().isEmpty()) {
            // If only single skill is provided
            progress.setSkill(progressDto.getSkill());
            List<String> skillsList = new ArrayList<>();
            skillsList.add(progressDto.getSkill());
            progress.setSkills(skillsList);
        }

        progress.setResourceUrl(progressDto.getResourceUrl());
        progress.setCompletionPercentage(progressDto.getCompletionPercentage());
        progress.setStartDate(progressDto.getStartDate());
        progress.setCompletionDate(progressDto.getCompletionDate());
        progress.setUpdatedAt(new Date());

        return learningProgressRepository.save(progress);
    }

    public void deleteLearningProgress(String email, String progressId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LearningProgress progress = learningProgressRepository.findById(progressId)
                .orElseThrow(() -> new RuntimeException("Learning progress not found"));

        if (!progress.getUserId().equals(user.getId())) {
            throw new RuntimeException("You are not authorized to delete this learning progress");
        }

        learningProgressRepository.delete(progress);
    }

    public List<LearningProgress> getUserLearningProgress(String userId) {
        List<LearningProgress> progressList = learningProgressRepository.findByUserId(userId);

        // Populate user information
        progressList.forEach(progress -> {
            userRepository.findById(progress.getUserId()).ifPresent(user -> {
                progress.setUserName(user.getName());
                progress.setUserProfilePicture(user.getProfilePicture());
            });
        });

        return progressList;
    }

    public Page<LearningProgress> getUserLearningProgressPaginated(String userId, Pageable pageable) {
        Page<LearningProgress> progressPage = learningProgressRepository.findByUserId(userId, pageable);

        // Populate user information
        progressPage.forEach(progress -> {
            userRepository.findById(progress.getUserId()).ifPresent(user -> {
                progress.setUserName(user.getName());
                progress.setUserProfilePicture(user.getProfilePicture());
            });
        });

        return progressPage;
    }

    public LearningProgress getLearningProgressById(String progressId) {
        LearningProgress progress = learningProgressRepository.findById(progressId)
                .orElseThrow(() -> new RuntimeException("Learning progress not found"));

        // Populate user information
        userRepository.findById(progress.getUserId()).ifPresent(user -> {
            progress.setUserName(user.getName());
            progress.setUserProfilePicture(user.getProfilePicture());
        });

        return progress;
    }

    public Page<LearningProgress> getLearningProgressBySkill(String skill, Pageable pageable) {
        Page<LearningProgress> progressPage = learningProgressRepository.findBySkillsContaining(skill, pageable);

        // Populate user information
        progressPage.forEach(progress -> {
            userRepository.findById(progress.getUserId()).ifPresent(user -> {
                progress.setUserName(user.getName());
                progress.setUserProfilePicture(user.getProfilePicture());
            });
        });

        return progressPage;
    }
}
