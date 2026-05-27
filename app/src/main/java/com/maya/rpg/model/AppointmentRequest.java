package com.maya.rpg.model;

import com.google.gson.annotations.SerializedName;

public class AppointmentRequest {
    @SerializedName("dateTime")
    private final String dateTime;

    @SerializedName("type")
    private final String type;

    @SerializedName("notes")
    private final String notes;

    public AppointmentRequest(String dateTime, String type, String notes) {
        this.dateTime = dateTime;
        this.type = type;
        this.notes = notes;
    }
}
