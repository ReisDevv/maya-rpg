package com.maya.rpg;

import static org.junit.Assert.*;

import android.content.Context;

import androidx.room.Room;
import androidx.test.core.app.ApplicationProvider;
import androidx.test.ext.junit.runners.AndroidJUnit4;

import com.maya.rpg.db.AppDatabase;
import com.maya.rpg.db.dao.ExerciseSessionDao;
import com.maya.rpg.db.entity.ExerciseSession;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.Arrays;
import java.util.List;

/**
 * Teste de integração do ExerciseSessionDao.
 *
 * Valida que as operações reais de persistência (insert, query, update, delete)
 * funcionam corretamente com o banco Room in-memory, garantindo a integridade
 * do contrato entre a camada de dados e o SQLite.
 */
@RunWith(AndroidJUnit4.class)
public class ExerciseSessionDaoIntegrationTest {

    private AppDatabase db;
    private ExerciseSessionDao dao;

    @Before
    public void createDb() {
        Context context = ApplicationProvider.getApplicationContext();
        db = Room.inMemoryDatabaseBuilder(context, AppDatabase.class)
                .allowMainThreadQueries() // Permitido apenas em testes
                .build();
        dao = db.exerciseSessionDao();
    }

    @After
    public void closeDb() {
        db.close();
    }

    // ---------------------------------------------------------------
    // Helper: cria uma ExerciseSession com valores padrão para testes
    // ---------------------------------------------------------------
    private ExerciseSession buildSession(String patientId, String prescriptionId,
                                         String exerciseId, int painLevel,
                                         String notes, boolean synced) {
        ExerciseSession session = new ExerciseSession();
        session.setPatientId(patientId);
        session.setPrescriptionId(prescriptionId);
        session.setExerciseId(exerciseId);
        session.setCompletedAt(System.currentTimeMillis());
        session.setCompleted(true);
        session.setPainLevel(painLevel);
        session.setFeelingLevel(3);
        session.setNotes(notes);
        session.setSynced(synced);
        return session;
    }

    // ---------------------------------------------------------------
    // 1. Inserir e consultar — campos principais
    // ---------------------------------------------------------------
    @Test
    public void insertAndQuerySession_returnsSameFields() {
        ExerciseSession session = buildSession(
                "patient-abc", "prescription-123", "exercise-xyz",
                4, "Leve desconforto no ombro", false
        );

        dao.insert(session);

        List<ExerciseSession> result = dao.getByPatient("patient-abc");

        assertEquals(1, result.size());

        ExerciseSession loaded = result.get(0);
        assertEquals("patient-abc", loaded.getPatientId());
        assertEquals("prescription-123", loaded.getPrescriptionId());
        assertEquals("exercise-xyz", loaded.getExerciseId());
        assertEquals(4, loaded.getPainLevel());
        assertEquals("Leve desconforto no ombro", loaded.getNotes());
        assertTrue(loaded.isCompleted());
        assertFalse(loaded.isSynced());
        assertTrue(loaded.getCompletedAt() > 0);
    }

    // ---------------------------------------------------------------
    // 2. getUnsyncedSessions — retorna apenas não sincronizadas
    // ---------------------------------------------------------------
    @Test
    public void getUnsyncedSessions_filtersCorrectly() {
        dao.insert(buildSession("p1", "rx1", "ex1", 2, "nota 1", false));
        dao.insert(buildSession("p1", "rx1", "ex2", 5, "nota 2", true));
        dao.insert(buildSession("p2", "rx2", "ex3", 7, null, false));

        List<ExerciseSession> unsynced = dao.getUnsyncedSessions();

        assertEquals(2, unsynced.size());
        for (ExerciseSession s : unsynced) {
            assertFalse("Sessão deveria ser não sincronizada", s.isSynced());
        }
    }

    // ---------------------------------------------------------------
    // 3. markAsSynced — atualiza flag isSynced para true
    // ---------------------------------------------------------------
    @Test
    public void markAsSynced_updatesFlag() {
        dao.insert(buildSession("p1", "rx1", "ex1", 3, null, false));
        dao.insert(buildSession("p1", "rx1", "ex2", 6, null, false));

        List<ExerciseSession> before = dao.getUnsyncedSessions();
        assertEquals(2, before.size());

        // Marca apenas a primeira como sincronizada
        List<Integer> idsToSync = Arrays.asList(before.get(0).id);
        dao.markAsSynced(idsToSync);

        List<ExerciseSession> after = dao.getUnsyncedSessions();
        assertEquals(1, after.size());
        assertEquals(before.get(1).id, after.get(0).id);
    }

    // ---------------------------------------------------------------
    // 4. countByPrescription — contagem correta por prescrição
    // ---------------------------------------------------------------
    @Test
    public void countByPrescription_returnsCorrectCount() {
        dao.insert(buildSession("p1", "rx-A", "ex1", 1, null, true));
        dao.insert(buildSession("p1", "rx-A", "ex2", 2, null, true));
        dao.insert(buildSession("p1", "rx-B", "ex3", 3, null, true));

        assertEquals(2, dao.countByPrescription("p1", "rx-A"));
        assertEquals(1, dao.countByPrescription("p1", "rx-B"));
        assertEquals(0, dao.countByPrescription("p1", "rx-C"));
    }

    // ---------------------------------------------------------------
    // 5. deleteByPatient — remove apenas sincronizadas, mantém pendentes
    // ---------------------------------------------------------------
    @Test
    public void deleteByPatient_keepsUnsyncedSessions() {
        dao.insert(buildSession("p1", "rx1", "ex1", 2, null, true));
        dao.insert(buildSession("p1", "rx1", "ex2", 4, "pendente", false));
        dao.insert(buildSession("p2", "rx2", "ex3", 1, null, true));

        dao.deleteByPatient("p1");

        // Sessão não sincronizada do p1 deve sobreviver
        List<ExerciseSession> p1Sessions = dao.getByPatient("p1");
        assertEquals(1, p1Sessions.size());
        assertFalse(p1Sessions.get(0).isSynced());
        assertEquals("pendente", p1Sessions.get(0).getNotes());

        // Sessões do p2 não devem ser afetadas
        List<ExerciseSession> p2Sessions = dao.getByPatient("p2");
        assertEquals(1, p2Sessions.size());
    }

    // ---------------------------------------------------------------
    // 6. getByPatientSince — filtra por data corretamente
    // ---------------------------------------------------------------
    @Test
    public void getByPatientSince_filtersOlderSessions() {
        long now = System.currentTimeMillis();
        long oneWeekAgo = now - (7L * 24 * 60 * 60 * 1000);
        long twoWeeksAgo = now - (14L * 24 * 60 * 60 * 1000);

        ExerciseSession recent = buildSession("p1", "rx1", "ex1", 3, "recente", false);
        recent.setCompletedAt(now);
        dao.insert(recent);

        ExerciseSession old = buildSession("p1", "rx1", "ex2", 5, "antiga", false);
        old.setCompletedAt(twoWeeksAgo);
        dao.insert(old);

        List<ExerciseSession> lastWeek = dao.getByPatientSince("p1", oneWeekAgo);

        assertEquals(1, lastWeek.size());
        assertEquals("recente", lastWeek.get(0).getNotes());
    }
}
