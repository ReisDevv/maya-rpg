package com.maya.rpg;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.maya.rpg.model.CheckInRequest;
import com.maya.rpg.model.LoginResponse;
import com.maya.rpg.model.PaginatedResponse;
import com.maya.rpg.model.RefreshResponse;
import com.maya.rpg.model.ResetPasswordRequest;
import java.lang.reflect.Type;
import org.junit.Test;

public class ModelContractTest {
    private final Gson gson = new Gson();

    @Test
    public void checkInRequestKeepsApiPayloadFields() {
 CheckInRequest request = new CheckInRequest(
 "prescription-1",
 "exercise-1",
 7,
 "Dor leve no final",
 true,
 "2026-05-03T10:00:00.000Z"
 );

        assertEquals("prescription-1", request.getPrescriptionId());
        assertEquals("exercise-1", request.getExerciseId());
        assertEquals(7, request.getPainLevel());
        assertEquals("Dor leve no final", request.getNotes());
        assertEquals("2026-05-03T10:00:00.000Z", request.getExecutedAt());
    }

    @Test
    public void paginatedResponseMatchesNestPaginationShape() {
        Type responseType = new TypeToken<PaginatedResponse<Object>>() {}.getType();
        PaginatedResponse<Object> response = gson.fromJson(
                "{\"data\":[{}],\"total\":1,\"page\":1,\"pageSize\":10,\"totalPages\":1}",
                responseType
        );

        assertEquals(1, response.getData().size());
        assertEquals(response.getData(), response.getContent());
        assertEquals(1, response.getTotal());
        assertEquals(10, response.getPageSize());
    }

    @Test
    public void loginResponseDetectsLgpdAcceptance() {
        LoginResponse accepted = gson.fromJson(
                "{\"accessToken\":\"a\",\"refreshToken\":\"r\",\"user\":{\"lgpdAcceptedAt\":\"2026-05-03T00:00:00.000Z\"}}",
                LoginResponse.class
        );
        LoginResponse pending = gson.fromJson(
                "{\"accessToken\":\"a\",\"refreshToken\":\"r\",\"user\":{\"lgpdAcceptedAt\":null}}",
                LoginResponse.class
        );

        assertTrue(accepted.getUser().hasAcceptedLgpd());
        assertFalse(pending.getUser().hasAcceptedLgpd());
    }

    @Test
    public void resetAndRefreshResponsesMatchAuthContract() {
        ResetPasswordRequest reset = new ResetPasswordRequest("request-1", "code-1", "novaSenha");
        RefreshResponse refresh = gson.fromJson(
                "{\"accessToken\":\"new-access\",\"refreshToken\":\"new-refresh\"}",
                RefreshResponse.class
        );

        assertEquals("request-1", reset.getRequestId());
        assertEquals("code-1", reset.getCode());
        assertEquals("novaSenha", reset.getNewPassword());
        assertEquals("new-access", refresh.getAccessToken());
        assertEquals("new-refresh", refresh.getRefreshToken());
    }
}
