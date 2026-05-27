package com.maya.rpg;

import static org.junit.Assert.*;

import android.content.Context;

import androidx.room.Room;
import androidx.test.core.app.ApplicationProvider;
import androidx.test.ext.junit.runners.AndroidJUnit4;

import com.maya.rpg.db.AppDatabase;
import com.maya.rpg.db.dao.CachedPrescriptionDao;
import com.maya.rpg.db.entity.CachedPrescription;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.Arrays;
import java.util.List;

/**
 * Teste de integração do CachedPrescriptionDao.
 *
 * Valida que o cache local de prescrições persiste e recupera dados
 * corretamente usando Room in-memory, incluindo inserção em lote,
 * consulta por paciente, substituição (REPLACE) e remoção de cache.
 */
@RunWith(AndroidJUnit4.class)
public class CachedPrescriptionDaoIntegrationTest {

    private AppDatabase db;
    private CachedPrescriptionDao dao;

    @Before
    public void createDb() {
        Context context = ApplicationProvider.getApplicationContext();
        db = Room.inMemoryDatabaseBuilder(context, AppDatabase.class)
                .allowMainThreadQueries() // Permitido apenas em testes
                .build();
        dao = db.cachedPrescriptionDao();
    }

    @After
    public void closeDb() {
        db.close();
    }

    // ---------------------------------------------------------------
    // Helper: cria uma CachedPrescription com valores para teste
    // ---------------------------------------------------------------
    private CachedPrescription buildPrescription(String id, String patientId,
                                                  String title, boolean active) {
        CachedPrescription cp = new CachedPrescription();
        cp.id = id;
        cp.patientId = patientId;
        cp.title = title;
        cp.description = "Descrição do plano " + title;
        cp.exercisesJson = "[{\"exerciseId\":\"ex-1\",\"sets\":3}]";
        cp.startDate = "2026-05-01";
        cp.endDate = "2026-06-01";
        cp.isActive = active;
        cp.cachedAt = System.currentTimeMillis();
        return cp;
    }

    // ---------------------------------------------------------------
    // 1. Inserir em lote e consultar por patientId
    // ---------------------------------------------------------------
    @Test
    public void insertAllAndQueryByPatient_returnsCorrectData() {
        CachedPrescription p1 = buildPrescription("rx-1", "patient-A", "RPG Semanal", true);
        CachedPrescription p2 = buildPrescription("rx-2", "patient-A", "Alongamento", false);
        CachedPrescription p3 = buildPrescription("rx-3", "patient-B", "Outro Plano", true);

        dao.insertAll(Arrays.asList(p1, p2, p3));

        List<CachedPrescription> resultA = dao.getByPatient("patient-A");
        assertEquals(2, resultA.size());

        List<CachedPrescription> resultB = dao.getByPatient("patient-B");
        assertEquals(1, resultB.size());
        assertEquals("Outro Plano", resultB.get(0).title);
    }

    // ---------------------------------------------------------------
    // 2. Verificar todos os campos persistidos
    // ---------------------------------------------------------------
    @Test
    public void insertedPrescription_hasAllFieldsIntact() {
        CachedPrescription original = buildPrescription(
                "rx-full", "patient-X", "Reeducação Postural", true
        );
        original.description = "Plano completo de RPG com 5 exercícios";
        original.exercisesJson = "[{\"exerciseId\":\"e1\"},{\"exerciseId\":\"e2\"}]";
        original.startDate = "2026-04-15";
        original.endDate = "2026-07-15";

        dao.insertAll(Arrays.asList(original));

        List<CachedPrescription> result = dao.getByPatient("patient-X");
        assertEquals(1, result.size());

        CachedPrescription loaded = result.get(0);
        assertEquals("rx-full", loaded.id);
        assertEquals("patient-X", loaded.patientId);
        assertEquals("Reeducação Postural", loaded.title);
        assertEquals("Plano completo de RPG com 5 exercícios", loaded.description);
        assertEquals("[{\"exerciseId\":\"e1\"},{\"exerciseId\":\"e2\"}]", loaded.exercisesJson);
        assertEquals("2026-04-15", loaded.startDate);
        assertEquals("2026-07-15", loaded.endDate);
        assertTrue(loaded.isActive);
        assertTrue(loaded.cachedAt > 0);
    }

    // ---------------------------------------------------------------
    // 3. deleteByPatient — remove apenas do paciente correto
    // ---------------------------------------------------------------
    @Test
    public void deleteByPatient_removesOnlyTargetPatient() {
        dao.insertAll(Arrays.asList(
                buildPrescription("rx-1", "patient-A", "Plano A1", true),
                buildPrescription("rx-2", "patient-A", "Plano A2", true),
                buildPrescription("rx-3", "patient-B", "Plano B1", true)
        ));

        dao.deleteByPatient("patient-A");

        List<CachedPrescription> remainingA = dao.getByPatient("patient-A");
        assertTrue("Cache do patient-A deveria estar vazio", remainingA.isEmpty());

        List<CachedPrescription> remainingB = dao.getByPatient("patient-B");
        assertEquals("Cache do patient-B deveria estar intacto", 1, remainingB.size());
    }

    // ---------------------------------------------------------------
    // 4. REPLACE strategy — atualiza prescrição existente (mesmo id)
    // ---------------------------------------------------------------
    @Test
    public void insertAll_replacesDuplicateIds() {
        CachedPrescription v1 = buildPrescription("rx-1", "patient-A", "Versão 1", true);
        dao.insertAll(Arrays.asList(v1));

        // Insere novamente com mesmo ID mas título diferente
        CachedPrescription v2 = buildPrescription("rx-1", "patient-A", "Versão 2 Atualizada", false);
        dao.insertAll(Arrays.asList(v2));

        List<CachedPrescription> result = dao.getByPatient("patient-A");
        assertEquals("Deve haver apenas 1 registro (REPLACE por PK)", 1, result.size());
        assertEquals("Versão 2 Atualizada", result.get(0).title);
        assertFalse("isActive deve refletir a versão mais recente", result.get(0).isActive);
    }

    // ---------------------------------------------------------------
    // 5. Consulta em paciente sem cache — retorna lista vazia
    // ---------------------------------------------------------------
    @Test
    public void getByPatient_returnsEmptyForUnknownPatient() {
        dao.insertAll(Arrays.asList(
                buildPrescription("rx-1", "patient-A", "Plano", true)
        ));

        List<CachedPrescription> result = dao.getByPatient("patient-inexistente");
        assertNotNull(result);
        assertTrue("Deve retornar lista vazia, não null", result.isEmpty());
    }
}
