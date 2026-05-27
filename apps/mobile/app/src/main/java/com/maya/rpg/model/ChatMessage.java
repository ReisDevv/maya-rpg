package com.maya.rpg.model;

import com.google.gson.annotations.SerializedName;

public class ChatMessage {
    @SerializedName("id")
    private String id;

    @SerializedName("senderRole")
    private String senderRole;

    @SerializedName("body")
    private String body;

    @SerializedName("createdAt")
    private String createdAt;

    public String getId() { return id; }
    public String getSenderRole() { return senderRole; }
    public String getBody() { return body; }
    public String getCreatedAt() { return createdAt; }
}
