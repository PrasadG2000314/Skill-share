package com.example.skillshare.repository;

import com.example.skillshare.model.LearningPlan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface LearningPlanRepository extends MongoRepository<LearningPlan, String> {
    Page<LearningPlan> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);
}
