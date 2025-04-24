package com.example.skillshare.controller;

import com.example.skillshare.dto.LearningProgressDto;
import com.example.skillshare.model.LearningProgress;
import com.example.skillshare.service.LearningProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/learning-progress")
@RequiredArgsConstructor
public class LearningProgressController {

    private final LearningProgressService learningProgressService;

    @PostMapping
    public ResponseEntity<?> createLearningProgress(
            @AuthenticationPrincipal UserDetails currentUser,
            @RequestBody LearningProgressDto progressDto) {
        try {
            LearningProgress progress = learningProgressService.createLearningProgress(
                    currentUser.getUsername(), progressDto);

            return ResponseEntity.ok(progress);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/{progressId}")
    public ResponseEntity<?> updateLearningProgress(
            @AuthenticationPrincipal UserDetails currentUser,
            @PathVariable String progressId,
            @RequestBody LearningProgressDto progressDto) {
        try {
            LearningProgress progress = learningProgressService.updateLearningProgress(
                    currentUser.getUsername(), progressId, progressDto);

            return ResponseEntity.ok(progress);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/{progressId}")
    public ResponseEntity<?> deleteLearningProgress(
            @AuthenticationPrincipal UserDetails currentUser,
            @PathVariable String progressId) {
        try {
            learningProgressService.deleteLearningProgress(currentUser.getUsername(), progressId);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Learning progress deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/{progressId}")
    public ResponseEntity<?> getLearningProgressById(@PathVariable String progressId) {
        try {
            LearningProgress progress = learningProgressService.getLearningProgressById(progressId);

            return ResponseEntity.ok(progress);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<LearningProgress>> getUserLearningProgress(
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        return ResponseEntity.ok(learningProgressService.getUserLearningProgressPaginated(userId, pageable));
    }

    @GetMapping("/skill/{skill}")
    public ResponseEntity<Page<LearningProgress>> getLearningProgressBySkill(
            @PathVariable String skill,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        return ResponseEntity.ok(learningProgressService.getLearningProgressBySkill(skill, pageable));
    }
}
