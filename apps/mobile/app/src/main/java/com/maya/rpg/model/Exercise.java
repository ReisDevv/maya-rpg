package com.maya.rpg.model;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class Exercise {

    @SerializedName("id")
    private String id;

    @SerializedName("title")
    private String title;

    @SerializedName("description")
    private String description;

    @SerializedName("category")
    private String category;

    @SerializedName("tags")
    private List<String> tags;

    @SerializedName("videoUrl")
    private String videoUrl;

    @SerializedName("imageUrls")
    private List<String> imageUrls;

    @SerializedName("instructions")
    private String instructions;

    public String getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getCategory() { return category; }
    public List<String> getTags() { return tags; }
    public String getVideoUrl() { return videoUrl; }
    public List<String> getImageUrls() { return imageUrls; }
    public String getInstructions() { return instructions; }
}