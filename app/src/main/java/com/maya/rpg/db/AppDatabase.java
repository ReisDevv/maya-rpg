package com.maya.rpg.db;

import android.content.Context;

import androidx.annotation.NonNull;
import androidx.room.Database;
import androidx.room.Room;
import androidx.room.RoomDatabase;
import androidx.room.migration.Migration;
import androidx.sqlite.db.SupportSQLiteDatabase;

import com.maya.rpg.db.dao.CachedPrescriptionDao;
import com.maya.rpg.db.dao.ExerciseSessionDao;
import com.maya.rpg.db.entity.CachedPrescription;
import com.maya.rpg.db.entity.ExerciseSession;

@Database(
        entities = {CachedPrescription.class, ExerciseSession.class},
        version = 6,
        exportSchema = false
)
public abstract class AppDatabase extends RoomDatabase {

    private static volatile AppDatabase INSTANCE;

    public abstract CachedPrescriptionDao cachedPrescriptionDao();
    public abstract ExerciseSessionDao exerciseSessionDao();

    /**
     * Migrations declaradas explicitamente. A v3 → v4 originalmente subiu sem
     * rota explícita (estava sob fallbackToDestructiveMigration). Para evitar
     * perda de dados em upgrades futuros, removemos o destrutivo e exigimos
     * migration declarada para cada bump de versão.
     */
    static final Migration MIGRATION_3_4 = new Migration(3, 4) {
        @Override
        public void migrate(@NonNull SupportSQLiteDatabase database) {
            // Sem alterações estruturais entre v3 e v4 — apenas formaliza a transição.
        }
    };

    static final Migration MIGRATION_4_5 = new Migration(4, 5) {
        @Override
        public void migrate(@NonNull SupportSQLiteDatabase database) {
            database.execSQL("ALTER TABLE exercise_sessions ADD COLUMN exerciseId TEXT");
        }
    };

    static final Migration MIGRATION_5_6 = new Migration(5, 6) {
        @Override
        public void migrate(@NonNull SupportSQLiteDatabase database) {
            database.execSQL("ALTER TABLE exercise_sessions ADD COLUMN feelingLevel INTEGER NOT NULL DEFAULT 0");
        }
    };

    public static AppDatabase getInstance(Context context) {
        if (INSTANCE == null) {
            synchronized (AppDatabase.class) {
                if (INSTANCE == null) {
                    INSTANCE = Room.databaseBuilder(
                                    context.getApplicationContext(),
                                    AppDatabase.class,
                                    "maya_db"
                            )
                            .addMigrations(MIGRATION_3_4, MIGRATION_4_5, MIGRATION_5_6)
                            // Em apps em produção: NUNCA usar destructive migration.
                            // Em dev (instalações fresh) o Room recria automaticamente,
                            // então só caímos no fallback quando o desenvolvedor esquecer
                            // de declarar uma migration nova — failOnMissingMigration ajuda.
                            .fallbackToDestructiveMigrationOnDowngrade()
                            .build();
                }
            }
        }
        return INSTANCE;
    }
}
