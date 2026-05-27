package com.maya.rpg.model;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class Prescription {

    @SerializedName("id")
    private String id;

    @SerializedName("patientId")
    private String patientId;

    @SerializedName("title")
    private String title;

    @SerializedName("description")
    private String description;

    @SerializedName("exercises")
    private List<PrescriptionExercise> exercises;

    @SerializedName("startDate")
    private String startDate;

    @SerializedName("endDate")
    private String endDate;

    @SerializedName("isActive")
    private boolean isActive;

    public String getId() { return id; }
    public String getPatientId() { return patientId; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public List<PrescriptionExercise> getExercises() { return exercises; }
    public String getStartDate() { return startDate; }
    public String getEndDate() { return endDate; }
    public boolean isActive() { return isActive; }

    // Setters para reconstrução a partir do cache local
    public void setId(String id) { this.id = id; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public void setTitle(String title) { this.title = title; }
    public void setDescription(String description) { this.description = description; }
    public void setExercises(List<PrescriptionExercise> exercises) { this.exercises = exercises; }
    public void setStartDate(String startDate) { this.startDate = startDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }
    public void setActive(boolean active) { this.isActive = active; }

    public static class PrescriptionExercise {
        @SerializedName("exerciseId")
        private String exerciseId;

        @SerializedName("sets")
        private Integer sets;

        @SerializedName("repetitions")
        private Integer repetitions;

        @SerializedName("holdTimeSeconds")
        private Integer holdTimeSeconds;

        @SerializedName("frequency")
        private String frequency;

        @SerializedName("notes")
        private String notes;

        @SerializedName("order")
        private int order;

        @SerializedName("exercise")
        private Exercise exercise;

        public String getExerciseId() { return exerciseId; }
        public Integer getSets() { return sets; }
        public Integer getRepetitions() { return repetitions; }
        public Integer getHoldTimeSeconds() { return holdTimeSeconds; }
        public String getFrequency() { return frequency; }
        public String getNotes() { return notes; }
        public int getOrder() { return order; }
        public Exercise getExercise() { return exercise; }
    }
}
