package com.maya.rpg;

import static org.junit.Assert.*;

import com.maya.rpg.model.LoginResponse;
import com.maya.rpg.model.Prescription;
import com.maya.rpg.model.Exercise;
import com.google.gson.Gson;

import org.junit.Test;

import java.util.Arrays;
import java.util.List;

public class TokenManagerTest {

    private final Gson gson = new Gson();

    @Test
    public void loginResponseParsesUserRoles() {
        String json = "{\"accessToken\":\"a\",\"refreshToken\":\"r\","
                + "\"user\":{\"id\":\"u1\",\"name\":\"Test\",\"email\":\"t@t.com\","
                + "\"role\":\"PATIENT\",\"lgpdAcceptedAt\":null,\"mustChangePassword\":false}}";

        LoginResponse response = gson.fromJson(json, LoginResponse.class);
        assertEquals("PATIENT", response.getUser().getRole());
        assertFalse(response.getUser().hasAcceptedLgpd());
    }

    @Test
    public void prescriptionExercisesDeserializeCorrectly() {
        String json = "{\"id\":\"p1\",\"title\":\"Plano 1\",\"description\":\"Desc\","
                + "\"exercises\":[{\"exerciseId\":\"e1\",\"sets\":3,\"repetitions\":10,"
                + "\"holdTimeSeconds\":30,\"frequency\":\"3x por semana\",\"notes\":\"Postura\",\"order\":1}],"
                + "\"startDate\":\"2026-05-03\",\"endDate\":\"2026-06-03\",\"isActive\":true}";

        Prescription p = gson.fromJson(json, Prescription.class);
        assertNotNull(p.getExercises());
        assertEquals(1, p.getExercises().size());
        assertEquals("e1", p.getExercises().get(0).getExerciseId());
        assertEquals(3, (int) p.getExercises().get(0).getSets());
        assertEquals(10, (int) p.getExercises().get(0).getRepetitions());
        assertEquals("3x por semana", p.getExercises().get(0).getFrequency());
        assertTrue(p.isActive());
    }

    @Test
    public void exerciseModelHasMediaFields() {
        String json = "{\"id\":\"ex1\",\"title\":\"Alongamento\",\"description\":\"Desc\","
                + "\"category\":\"STRETCHING\",\"tags\":\"coluna,lombar\","
                + "\"videoUrl\":\"https://example.com/video.mp4\","
                + "\"imageUrls\":[\"https://img1.jpg\",\"https://img2.jpg\"],"
                + "\"instructions\":\"Mantenha 30s\"}";

        Exercise exercise = gson.fromJson(json, Exercise.class);
        assertEquals("Alongamento", exercise.getTitle());
        assertEquals("STRETCHING", exercise.getCategory());
        assertNotNull(exercise.getImageUrls());
        assertEquals(2, exercise.getImageUrls().size());
        assertEquals("https://example.com/video.mp4", exercise.getVideoUrl());
    }

    @Test
    public void paginatedResponseCalculatesTotalPages() {
        String json = "{\"data\":[{\"id\":\"1\"},{\"id\":\"2\"}],\"total\":25,"
                + "\"page\":1,\"pageSize\":10,\"totalPages\":3}";

        com.maya.rpg.model.PaginatedResponse<Object> response = gson.fromJson(json,
                new com.google.gson.reflect.TypeToken<com.maya.rpg.model.PaginatedResponse<Object>>(){}.getType());
        assertEquals(3, response.getTotalPages());
        assertEquals(2, response.getData().size());
        assertEquals(25, response.getTotal());
    }
}
