package com.maya.rpg.model;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class AvailabilityResponse {
    @SerializedName("month")
    private String month;

    @SerializedName("workingHours")
    private List<String> workingHours;

    @SerializedName("reserved")
    private List<ReservedSlot> reserved;

    public String getMonth() { return month; }
    public List<String> getWorkingHours() { return workingHours; }
    public List<ReservedSlot> getReserved() { return reserved; }

    public static class ReservedSlot {
        @SerializedName("id")
        private String id;

        @SerializedName("dateTime")
        private String dateTime;

        @SerializedName("status")
        private String status;

        public String getId() { return id; }
        public String getDateTime() { return dateTime; }
        public String getStatus() { return status; }
    }
}
