package com.example.skillshare.dto;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class PostDto {
    private String content;
    private String skillCategory;
    private List<String> mediaUrls = new ArrayList<>();
}
