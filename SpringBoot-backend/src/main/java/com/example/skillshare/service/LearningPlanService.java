package com.example.skillshare.service;

import com.example.skillshare.dto.LearningPlanDto;
import com.example.skillshare.model.LearningPlan;
import com.example.skillshare.model.LearningStep;
import com.example.skillshare.model.Notification;
import com.example.skillshare.model.User;
import com.example.skillshare.repository.LearningPlanRepository;
import com.example.skillshare.repository.NotificationRepository;
import com.example.skillshare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LearningPlanService {

    private final LearningPlanRepository learningPlanRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    public LearningPlan getLearningPlanById(String planId) {
        return learningPlanRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Learning plan not found"));
    }

    public Page<LearningPlan> getLearningPlansByEmail(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return learningPlanRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);
    }

    public Page<LearningPlan> getLearningPlansByUserId(String userId, Pageable pageable) {
        return learningPlanRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    // In the createLearningPlan method
    public LearningPlan createLearningPlan(String email, LearningPlanDto learningPlanDto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LearningPlan learningPlan = new LearningPlan();
        learningPlan.setUserId(user.getId());
        learningPlan.setTitle(learningPlanDto.getTitle());
        learningPlan.setDescription(learningPlanDto.getDescription());

        // Handle both single skill and multiple skills
        if (learningPlanDto.getSkills() != null && !learningPlanDto.getSkills().isEmpty()) {
            learningPlan.setSkills(learningPlanDto.getSkills());
            // Also set the single skill field for backward compatibility
            if (!learningPlanDto.getSkills().isEmpty()) {
                learningPlan.setSkill(learningPlanDto.getSkills().get(0));
            }
        } else if (learningPlanDto.getSkill() != null && !learningPlanDto.getSkill().isEmpty()) {
            // If only single skill is provided
            learningPlan.setSkill(learningPlanDto.getSkill());
            List<String> skillsList = new ArrayList<>();
            skillsList.add(learningPlanDto.getSkill());
            learningPlan.setSkills(skillsList);
        }

        learningPlan.setDeadline(learningPlanDto.getDeadline());
        learningPlan.setUserName(user.getName());
        learningPlan.setUserProfilePicture(user.getProfilePicture());

        // Add unique IDs to learning steps
        if (learningPlanDto.getSteps() != null) {
            for (LearningStep step : learningPlanDto.getSteps()) {
                step.setId(UUID.randomUUID().toString());
            }
            learningPlan.setSteps(learningPlanDto.getSteps());
        } else {
            learningPlan.setSteps(new ArrayList<>());
        }

        learningPlan.setCreatedAt(new Date());
        learningPlan.setUpdatedAt(new Date());

        return learningPlanRepository.save(learningPlan);
    }

    // Similarly update the updateLearningPlan method
    public LearningPlan updateLearningPlan(String email, String planId, LearningPlanDto learningPlanDto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LearningPlan learningPlan = learningPlanRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Learning plan not found"));

        if (!learningPlan.getUserId().equals(user.getId())) {
            throw new RuntimeException("You are not authorized to update this learning plan");
        }

        learningPlan.setTitle(learningPlanDto.getTitle());
        learningPlan.setDescription(learningPlanDto.getDescription());

        // Handle both single skill and multiple skills
        if (learningPlanDto.getSkills() != null && !learningPlanDto.getSkills().isEmpty()) {
            learningPlan.setSkills(learningPlanDto.getSkills());
            // Also set the single skill field for backward compatibility
            if (!learningPlanDto.getSkills().isEmpty()) {
                learningPlan.setSkill(learningPlanDto.getSkills().get(0));
            }
        } else if (learningPlanDto.getSkill() != null && !learningPlanDto.getSkill().isEmpty()) {
            // If only single skill is provided
            learningPlan.setSkill(learningPlanDto.getSkill());
            List<String> skillsList = new ArrayList<>();
            skillsList.add(learningPlanDto.getSkill());
            learningPlan.setSkills(skillsList);
        }

        learningPlan.setDeadline(learningPlanDto.getDeadline());

        // Only update steps if they are explicitly provided in the DTO
        if (learningPlanDto.getSteps() != null && !learningPlanDto.getSteps().isEmpty()) {
            // Add unique IDs to new learning steps
            for (LearningStep step : learningPlanDto.getSteps()) {
                if (step.getId() == null || step.getId().isEmpty()) {
                    step.setId(UUID.randomUUID().toString());
                }
            }
            learningPlan.setSteps(learningPlanDto.getSteps());
        }
        // Otherwise, keep the existing steps

        learningPlan.setUpdatedAt(new Date());

        // Recalculate progress
        updateProgressBasedOnSteps(learningPlan);

        return learningPlanRepository.save(learningPlan);
    }

    public void deleteLearningPlan(String email, String planId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LearningPlan learningPlan = learningPlanRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Learning plan not found"));

        if (!learningPlan.getUserId().equals(user.getId())) {
            throw new RuntimeException("You are not authorized to delete this learning plan");
        }

        learningPlanRepository.delete(learningPlan);
    }

    public LearningPlan updateLearningPlanProgress(String email, String planId, int progress) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LearningPlan learningPlan = learningPlanRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Learning plan not found"));

        if (!learningPlan.getUserId().equals(user.getId())) {
            throw new RuntimeException("You are not authorized to update this learning plan");
        }

        // Validate progress percentage
        if (progress < 0 || progress > 100) {
            throw new RuntimeException("Progress must be between 0 and 100");
        }

        int oldProgress = learningPlan.getProgress();
        learningPlan.setProgress(progress);
        learningPlan.setUpdatedAt(new Date());

        LearningPlan updatedPlan = learningPlanRepository.save(learningPlan);

        // Create learning update notification for followers if significant progress is
        // made
        if (progress > oldProgress && (progress == 100 || progress % 25 == 0)) {
            createLearningUpdateNotification(user, learningPlan);
        }

        return updatedPlan;
    }

    public LearningPlan addLearningStep(String email, String planId, LearningStep step) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LearningPlan learningPlan = learningPlanRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Learning plan not found"));

        if (!learningPlan.getUserId().equals(user.getId())) {
            throw new RuntimeException("You are not authorized to update this learning plan");
        }

        // Generate a new ID for the step
        step.setId(UUID.randomUUID().toString());

        // Initialize completed status if not set
        if (step.isCompleted()) {
            step.setCompleted(false);
        }

        // Add the step to the plan
        List<LearningStep> steps = learningPlan.getSteps();
        if (steps == null) {
            steps = new ArrayList<>();
            learningPlan.setSteps(steps);
        }
        steps.add(step);

        learningPlan.setUpdatedAt(new Date());

        // Recalculate progress
        updateProgressBasedOnSteps(learningPlan);

        return learningPlanRepository.save(learningPlan);
    }

    public LearningPlan updateLearningStep(String email, String planId, String stepId, LearningStep updatedStep) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LearningPlan learningPlan = learningPlanRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Learning plan not found"));

        if (!learningPlan.getUserId().equals(user.getId())) {
            throw new RuntimeException("You are not authorized to update this learning plan");
        }

        boolean stepFound = false;
        for (LearningStep step : learningPlan.getSteps()) {
            if (step.getId().equals(stepId)) {
                // Update step properties
                if (updatedStep.getTitle() != null) {
                    step.setTitle(updatedStep.getTitle());
                }
                if (updatedStep.getDescription() != null) {
                    step.setDescription(updatedStep.getDescription());
                }
                step.setCompleted(updatedStep.isCompleted());
                if (updatedStep.getDeadline() != null) {
                    step.setDeadline(updatedStep.getDeadline());
                }
                stepFound = true;
                break;
            }
        }

        if (!stepFound) {
            throw new RuntimeException("Learning step not found");
        }

        learningPlan.setUpdatedAt(new Date());

        // Recalculate progress
        updateProgressBasedOnSteps(learningPlan);

        LearningPlan updatedPlan = learningPlanRepository.save(learningPlan);

        return updatedPlan;
    }

    public LearningPlan deleteLearningStep(String email, String planId, String stepId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LearningPlan learningPlan = learningPlanRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Learning plan not found"));

        if (!learningPlan.getUserId().equals(user.getId())) {
            throw new RuntimeException("You are not authorized to update this learning plan");
        }

        List<LearningStep> steps = learningPlan.getSteps();
        boolean removed = steps.removeIf(step -> step.getId().equals(stepId));

        if (!removed) {
            throw new RuntimeException("Learning step not found");
        }

        learningPlan.setUpdatedAt(new Date());

        // Recalculate progress
        updateProgressBasedOnSteps(learningPlan);

        return learningPlanRepository.save(learningPlan);
    }

    public LearningPlan reorderLearningStep(String email, String planId, String stepId, String direction) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LearningPlan learningPlan = learningPlanRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Learning plan not found"));

        if (!learningPlan.getUserId().equals(user.getId())) {
            throw new RuntimeException("You are not authorized to update this learning plan");
        }

        List<LearningStep> steps = learningPlan.getSteps();
        int stepIndex = -1;

        // Find the index of the step to reorder
        for (int i = 0; i < steps.size(); i++) {
            if (steps.get(i).getId().equals(stepId)) {
                stepIndex = i;
                break;
            }
        }

        if (stepIndex == -1) {
            throw new RuntimeException("Learning step not found");
        }

        // Reorder the step
        if ("up".equalsIgnoreCase(direction) && stepIndex > 0) {
            Collections.swap(steps, stepIndex, stepIndex - 1);
        } else if ("down".equalsIgnoreCase(direction) && stepIndex < steps.size() - 1) {
            Collections.swap(steps, stepIndex, stepIndex + 1);
        } else {
            // No change needed or invalid direction
            return learningPlan;
        }

        learningPlan.setUpdatedAt(new Date());
        return learningPlanRepository.save(learningPlan);
    }

    public LearningPlan updateLearningStepStatus(String email, String planId, String stepId, boolean completed) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LearningPlan learningPlan = learningPlanRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Learning plan not found"));

        if (!learningPlan.getUserId().equals(user.getId())) {
            throw new RuntimeException("You are not authorized to update this learning plan");
        }

        boolean stepFound = false;
        for (LearningStep step : learningPlan.getSteps()) {
            if (step.getId().equals(stepId)) {
                step.setCompleted(completed);
                stepFound = true;
                break;
            }
        }

        if (!stepFound) {
            throw new RuntimeException("Learning step not found");
        }

        // Recalculate progress
        updateProgressBasedOnSteps(learningPlan);

        learningPlan.setUpdatedAt(new Date());

        LearningPlan updatedPlan = learningPlanRepository.save(learningPlan);

        // Create learning update notification for followers if significant progress is
        // made
        int progress = updatedPlan.getProgress();
        if (progress == 100 || progress % 25 == 0) {
            createLearningUpdateNotification(user, learningPlan);
        }

        return updatedPlan;
    }

    private void updateProgressBasedOnSteps(LearningPlan learningPlan) {
        List<LearningStep> steps = learningPlan.getSteps();
        if (steps == null || steps.isEmpty()) {
            learningPlan.setProgress(0);
            return;
        }

        int completedSteps = 0;
        for (LearningStep step : steps) {
            if (step.isCompleted()) {
                completedSteps++;
            }
        }

        int totalSteps = steps.size();
        int newProgress = (completedSteps * 100) / totalSteps;
        learningPlan.setProgress(newProgress);
    }

    private void createLearningUpdateNotification(User user, LearningPlan learningPlan) {
        if (user.getFollowers() == null || user.getFollowers().isEmpty()) {
            return;
        }

        for (String followerId : user.getFollowers()) {
            Notification notification = new Notification();
            notification.setUserId(followerId);
            notification.setSenderId(user.getId());
            notification.setType("LEARNING_UPDATE");

            String progressMessage = learningPlan.getProgress() == 100
                    ? "completed"
                    : "reached " + learningPlan.getProgress() + "% progress on";

            notification
                    .setContent(user.getName() + " " + progressMessage + " learning plan: " + learningPlan.getTitle());
            notification.setEntityId(learningPlan.getId());
            notification.setCreatedAt(new Date());

            notificationRepository.save(notification);
        }
    }
}
