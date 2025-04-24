package com.example.skillshare.repository;

import com.example.skillshare.model.LearningProgress;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LearningProgressRepository extends MongoRepository<LearningProgress, String> {
    List<LearningProgress> findByUserId(String userId);

    Page<LearningProgress> findByUserId(String userId, Pageable pageable);

    Page<LearningProgress> findBySkillsContaining(String skill, Pageable pageable);
}
