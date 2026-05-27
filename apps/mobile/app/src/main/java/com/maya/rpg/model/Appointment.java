package com.maya.rpg.model;

import com.google.gson.annotations.SerializedName;

public class Appointment {
    @SerializedName("id")
    private String id;

    @SerializedName("dateTime")
    private String dateTime;

    @SerializedName("durationMinutes")
    private int durationMinutes;

    @SerializedName("type")
    private String type;

    @SerializedName("status")
    private String status;

    @SerializedName("notes")
    private String notes;

    public String getId() {
        return id;
    }

    public String getDateTime() {
        return dateTime;
    }

    public int getDurationMinutes() {
        return durationMinutes;
    }

    public String getType() {
        return type;
    }

    public String getStatus() {
        return status;
    }

    public String getNotes() {
        return notes;
    }
}
