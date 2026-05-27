package com.maya.rpg.model;

import com.google.gson.annotations.SerializedName;

public class MessageRequest {
    @SerializedName("body")
    private final String body;

    public MessageRequest(String body) {
        this.body = body;
    }
}
