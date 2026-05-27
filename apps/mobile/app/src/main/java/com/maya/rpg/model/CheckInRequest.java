package com.maya.rpg.model;

import com.google.gson.annotations.SerializedName;

public class CheckInRequest {
 @SerializedName("prescriptionId")
 private String prescriptionId;

 @SerializedName("exerciseId")
 private String exerciseId;

 @SerializedName("painLevel")
 private int painLevel;

 @SerializedName("feelingLevel")
 private Integer feelingLevel;

 @SerializedName("notes")
 private String notes;

 @SerializedName("isCompleted")
 private boolean isCompleted;

 @SerializedName("executedAt")
 private String executedAt;

 public CheckInRequest(String prescriptionId, String exerciseId,
 int painLevel, Integer feelingLevel, String notes,
 boolean isCompleted, String executedAt) {
 this.prescriptionId = prescriptionId;
 this.exerciseId = exerciseId;
 this.painLevel = painLevel;
 this.feelingLevel = feelingLevel;
 this.notes = notes;
 this.isCompleted = isCompleted;
 this.executedAt = executedAt;
 }

 public String getPrescriptionId() { return prescriptionId; }
 public void setPrescriptionId(String prescriptionId) { this.prescriptionId = prescriptionId; }

 public String getExerciseId() { return exerciseId; }
 public void setExerciseId(String exerciseId) { this.exerciseId = exerciseId; }

 public int getPainLevel() { return painLevel; }
 public void setPainLevel(int painLevel) { this.painLevel = painLevel; }

 public Integer getFeelingLevel() { return feelingLevel; }
 public void setFeelingLevel(Integer feelingLevel) { this.feelingLevel = feelingLevel; }

 public String getNotes() { return notes; }
 public void setNotes(String notes) { this.notes = notes; }

 public boolean isCompleted() { return isCompleted; }
 public void setCompleted(boolean completed) { isCompleted = completed; }

 public String getExecutedAt() { return executedAt; }
 public void setExecutedAt(String executedAt) { this.executedAt = executedAt; }
}
