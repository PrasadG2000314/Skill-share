package com.example.skillshare.repository;

import com.example.skillshare.model.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface PostRepository extends MongoRepository<Post, String> {
    Page<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Post> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    List<Post> findByUserIdInOrderByCreatedAtDesc(List<String> userIds, Pageable pageable);
}
