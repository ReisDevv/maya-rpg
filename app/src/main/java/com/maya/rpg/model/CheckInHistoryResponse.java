package com.maya.rpg.model;

import com.google.gson.annotations.SerializedName;

public class CheckInHistoryResponse {
 @SerializedName("id")
 private String id;

 @SerializedName("patientId")
 private String patientId;

 @SerializedName("prescriptionId")
 private String prescriptionId;

 @SerializedName("exerciseId")
 private String exerciseId;

 @SerializedName("painLevel")
 private int painLevel;

 @SerializedName("notes")
 private String notes;

 @SerializedName("isCompleted")
 private boolean isCompleted;

 @SerializedName("executedAt")
 private String executedAt;

 public String getId() { return id; }
 public String getPatientId() { return patientId; }
 public String getPrescriptionId() { return prescriptionId; }
 public String getExerciseId() { return exerciseId; }
 public int getPainLevel() { return painLevel; }
 public String getNotes() { return notes; }
 public boolean isCompleted() { return isCompleted; }
 public String getExecutedAt() { return executedAt; }
}
