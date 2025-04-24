package com.example.skillshare.dto;

import com.example.skillshare.model.LearningStep;
import lombok.Data;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Data
public class LearningPlanDto {
    private String title;
    private String description;
    private String skill; // Keep for backward compatibility
    private List<String> skills = new ArrayList<>();
    private List<LearningStep> steps = new ArrayList<>();
    private Date deadline;
}
