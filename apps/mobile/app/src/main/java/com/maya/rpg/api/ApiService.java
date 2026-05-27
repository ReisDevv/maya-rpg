package com.maya.rpg.api;

import com.maya.rpg.model.LoginRequest;
import com.maya.rpg.model.LoginResponse;
import com.maya.rpg.model.Appointment;
import com.maya.rpg.model.AppointmentRequest;
import com.maya.rpg.model.AvailabilityResponse;
import com.maya.rpg.model.ChatMessage;
import com.maya.rpg.model.Conversation;
import com.maya.rpg.model.FullPrescriptionsResponse;
import com.maya.rpg.model.MessageRequest;
import com.maya.rpg.model.NotificationItem;
import com.maya.rpg.model.Patient;
import com.maya.rpg.model.PaginatedResponse;
import com.maya.rpg.model.ProfileUpdateRequest;
import com.maya.rpg.model.Prescription;
import com.maya.rpg.model.Exercise;
import com.maya.rpg.model.CheckInRequest;
import com.maya.rpg.model.CheckInHistoryResponse;
import com.maya.rpg.model.RecoverPasswordResponse;
import com.maya.rpg.model.ResetPasswordRequest;

import java.util.List;
import java.util.Map;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.POST;
import retrofit2.http.Path;
import retrofit2.http.Query;
import retrofit2.http.PATCH;

public interface ApiService {

    @POST("auth/login")
    Call<LoginResponse> login(@Body LoginRequest request);

    @POST("auth/password-reset/request-code")
    Call<RecoverPasswordResponse> recoverPassword(@Body Map<String, String> body);

    @POST("auth/password-reset/confirm-code")
    Call<Map<String, String>> resetPassword(@Body ResetPasswordRequest request);

    @POST("auth/accept-lgpd")
    Call<Map<String, String>> acceptLgpd(@Body Map<String, String> body);

    @GET("patients/me")
    Call<Patient> getMyPatient();

    @GET("prescriptions/me/full")
    Call<FullPrescriptionsResponse> getMyFullPrescriptions();

    @GET("appointments/me/upcoming")
    Call<List<Appointment>> getMyUpcomingAppointments(@Query("limit") int limit);

    @GET("appointments/me")
    Call<PaginatedResponse<Appointment>> getMyAppointments(@Query("filter") String filter);

    @GET("appointments/me/availability")
    Call<AvailabilityResponse> getAppointmentAvailability(@Query("month") String month);

    @POST("appointments/me/request")
    Call<Appointment> requestAppointment(@Body AppointmentRequest request);

    @GET("chat/conversations")
    Call<List<Conversation>> getChatConversations();

    @GET("chat/conversations/{id}/messages")
    Call<List<ChatMessage>> getChatMessages(@Path("id") String conversationId);

    @POST("chat/conversations/{id}/messages")
    Call<ChatMessage> sendChatMessage(
            @Path("id") String conversationId,
            @Body MessageRequest request
    );

    @PATCH("patients/me")
    Call<Patient> updateMyPatient(@Body ProfileUpdateRequest request);

    @GET("exercises/{id}")
    Call<Exercise> getExerciseById(@Path("id") String id);

    @POST("check-ins")
    Call<Void> performCheckIn(@Body CheckInRequest request);

    @POST("check-ins/sync")
    Call<List<Void>> syncCheckIns(@Body List<CheckInRequest> requests);

 @GET("check-ins/my-history")
 Call<PaginatedResponse<CheckInHistoryResponse>> getMyHistory(@Query("pageSize") int pageSize);

 @GET("medical-records/my")
 Call<PaginatedResponse<com.maya.rpg.model.MedicalRecord>> getMyMedicalRecords();

    @PATCH("auth/fcm-token")
    Call<Void> updateFcmToken(@Body com.maya.rpg.model.FcmTokenRequest request);

    @POST("auth/change-password")
    Call<Void> changePassword(@Body Map<String, String> body);

    @GET("notifications")
    Call<PaginatedResponse<NotificationItem>> getMyNotifications(@Query("pageSize") int pageSize);

    @POST("notifications/mark-all-read")
    Call<Void> markAllNotificationsRead(@Body Map<String, String> body);
}
