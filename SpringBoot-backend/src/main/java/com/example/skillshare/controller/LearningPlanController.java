package com.example.skillshare.controller;

import com.example.skillshare.dto.LearningPlanDto;
import com.example.skillshare.model.LearningPlan;
import com.example.skillshare.model.LearningStep;
import com.example.skillshare.service.LearningPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/learning-plans")
@RequiredArgsConstructor
public class LearningPlanController {

    private final LearningPlanService learningPlanService;

    @GetMapping
    public ResponseEntity<Page<LearningPlan>> getCurrentUserLearningPlans(
            @AuthenticationPrincipal UserDetails currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(learningPlanService.getLearningPlansByEmail(currentUser.getUsername(), pageable));
    }

    @GetMapping("/{planId}")
    public ResponseEntity<LearningPlan> getLearningPlanById(@PathVariable String planId) {
        return ResponseEntity.ok(learningPlanService.getLearningPlanById(planId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<LearningPlan>> getUserLearningPlans(
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(learningPlanService.getLearningPlansByUserId(userId, pageable));
    }

    @PostMapping
    public ResponseEntity<LearningPlan> createLearningPlan(
            @AuthenticationPrincipal UserDetails currentUser,
            @RequestBody LearningPlanDto learningPlanDto) {

        LearningPlan learningPlan = learningPlanService.createLearningPlan(currentUser.getUsername(), learningPlanDto);
        return ResponseEntity.ok(learningPlan);
    }

    @PutMapping("/{planId}")
    public ResponseEntity<LearningPlan> updateLearningPlan(
            @AuthenticationPrincipal UserDetails currentUser,
            @PathVariable String planId,
            @RequestBody LearningPlanDto learningPlanDto) {

        LearningPlan learningPlan = learningPlanService.updateLearningPlan(currentUser.getUsername(), planId,
                learningPlanDto);
        return ResponseEntity.ok(learningPlan);
    }

    @DeleteMapping("/{planId}")
    public ResponseEntity<?> deleteLearningPlan(
            @AuthenticationPrincipal UserDetails currentUser,
            @PathVariable String planId) {

        learningPlanService.deleteLearningPlan(currentUser.getUsername(), planId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{planId}/progress")
    public ResponseEntity<LearningPlan> updateLearningPlanProgress(
            @AuthenticationPrincipal UserDetails currentUser,
            @PathVariable String planId,
            @RequestBody Map<String, Integer> payload) {

        int progress = payload.getOrDefault("progress", 0);
        LearningPlan learningPlan = learningPlanService.updateLearningPlanProgress(currentUser.getUsername(), planId,
                progress);
        return ResponseEntity.ok(learningPlan);
    }

    @PostMapping("/{planId}/steps")
    public ResponseEntity<LearningPlan> addLearningStep(
            @AuthenticationPrincipal UserDetails currentUser,
            @PathVariable String planId,
            @RequestBody LearningStep step) {

        LearningPlan learningPlan = learningPlanService.addLearningStep(currentUser.getUsername(), planId, step);
        return ResponseEntity.ok(learningPlan);
    }

    @PutMapping("/{planId}/steps/{stepId}")
    public ResponseEntity<LearningPlan> updateLearningStep(
            @AuthenticationPrincipal UserDetails currentUser,
            @PathVariable String planId,
            @PathVariable String stepId,
            @RequestBody LearningStep step) {

        LearningPlan learningPlan = learningPlanService.updateLearningStep(currentUser.getUsername(), planId, stepId,
                step);
        return ResponseEntity.ok(learningPlan);
    }

    @DeleteMapping("/{planId}/steps/{stepId}")
    public ResponseEntity<LearningPlan> deleteLearningStep(
            @AuthenticationPrincipal UserDetails currentUser,
            @PathVariable String planId,
            @PathVariable String stepId) {

        LearningPlan learningPlan = learningPlanService.deleteLearningStep(currentUser.getUsername(), planId, stepId);
        return ResponseEntity.ok(learningPlan);
    }

    @PutMapping("/{planId}/steps/{stepId}/reorder")
    public ResponseEntity<LearningPlan> reorderLearningStep(
            @AuthenticationPrincipal UserDetails currentUser,
            @PathVariable String planId,
            @PathVariable String stepId,
            @RequestBody Map<String, String> payload) {

        String direction = payload.getOrDefault("direction", "up");
        LearningPlan learningPlan = learningPlanService.reorderLearningStep(currentUser.getUsername(), planId, stepId,
                direction);
        return ResponseEntity.ok(learningPlan);
    }
}
