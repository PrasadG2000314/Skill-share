package com.example.skillshare.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LearningStep {
    private String id;
    private String title;
    private String description;
    private boolean completed;
    private Date deadline;
}
