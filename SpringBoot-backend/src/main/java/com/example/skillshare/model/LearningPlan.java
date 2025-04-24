package com.example.skillshare.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "learningPlans")
public class LearningPlan {
    @Id
    private String id;
    private String userId;
    private String userName;
    private String userProfilePicture;
    private String title;
    private String description;
    // Change from single skill to list of skills
    private List<String> skills = new ArrayList<>();
    private String skill; // Keep for backward compatibility
    private List<LearningStep> steps = new ArrayList<>();
    private Date deadline;
    private int progress = 0;
    private Date createdAt = new Date();
    private Date updatedAt = new Date();
}
