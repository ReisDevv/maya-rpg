package com.maya.rpg.model;

import com.google.gson.annotations.SerializedName;

public class Conversation {
    @SerializedName("id")
    private String id;

    @SerializedName("title")
    private String title;

    @SerializedName("kind")
    private String kind;

    @SerializedName("updatedAt")
    private String updatedAt;

    public String getId() { return id; }
    public String getTitle() { return title; }
    public String getKind() { return kind; }
    public String getUpdatedAt() { return updatedAt; }
}
