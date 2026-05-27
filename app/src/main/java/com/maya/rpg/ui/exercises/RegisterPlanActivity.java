package com.maya.rpg.ui.exercises;

import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.constraintlayout.widget.ConstraintLayout;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.gson.Gson;
import com.maya.rpg.R;
import com.maya.rpg.api.TokenManager;
import com.maya.rpg.db.AppDatabase;
import com.maya.rpg.db.entity.ExerciseSession;
import com.maya.rpg.model.Prescription;
import com.maya.rpg.ui.BaseAuthActivity;
import com.maya.rpg.ui.home.HomeActivity;

import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class RegisterPlanActivity extends BaseAuthActivity {

    private Prescription prescription;
    private RecyclerView rvExercises;
    private EditText etNotes;
    private ConstraintLayout layoutSuccess;
    private int selectedFeel = 3; // Neutral default
    private int selectedPain = 3; // Neutral default
    
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_register_plan);

        String json = getIntent().getStringExtra("prescription_json");
        if (json != null) {
            prescription = new Gson().fromJson(json, Prescription.class);
        }

        initUI();
    }

    private void initUI() {
        rvExercises = findViewById(R.id.rvExercises);
        etNotes = findViewById(R.id.etNotes);
        layoutSuccess = findViewById(R.id.layoutSuccessOverlay);

        TextView tvSubtitle = findViewById(R.id.tvSubtitle);
        if (prescription != null) {
            tvSubtitle.setText(prescription.getTitle());
            
            RegisterExerciseAdapter adapter = new RegisterExerciseAdapter(prescription.getExercises());
            rvExercises.setLayoutManager(new LinearLayoutManager(this));
            rvExercises.setAdapter(adapter);
        }

        findViewById(R.id.btnClose).setOnClickListener(v -> finish());
        findViewById(R.id.btnSuccessClose).setOnClickListener(v -> {
            startActivity(new Intent(this, HomeActivity.class));
            finishAffinity();
        });

        setupScaleListeners();

        findViewById(R.id.btnFinalize).setOnClickListener(v -> finalizeRegistration());
    }

    private void setupScaleListeners() {
        // Feel Scale
        int[] feelIds = {R.id.btnFeel1, R.id.btnFeel2, R.id.btnFeel3, R.id.btnFeel4, R.id.btnFeel5};
        for (int i = 0; i < feelIds.length; i++) {
            final int level = i + 1;
            findViewById(feelIds[i]).setOnClickListener(v -> {
                selectedFeel = level;
                updateScaleUI(feelIds, selectedFeel);
            });
        }

        // Pain Scale
        int[] painIds = {R.id.btnPain1, R.id.btnPain2, R.id.btnPain3, R.id.btnPain4, R.id.btnPain5};
        for (int i = 0; i < painIds.length; i++) {
            final int level = i + 1;
            findViewById(painIds[i]).setOnClickListener(v -> {
                selectedPain = level;
                updateScaleUI(painIds, selectedPain);
            });
        }
        
        // Initialize UI
        updateScaleUI(feelIds, selectedFeel);
        updateScaleUI(painIds, selectedPain);
    }

    private void updateScaleUI(int[] ids, int selected) {
        for (int i = 0; i < ids.length; i++) {
            View v = findViewById(ids[i]);
            if (i + 1 == selected) {
                v.setBackgroundResource(R.drawable.bg_badge_active);
                v.setAlpha(1.0f);
            } else {
                v.setBackground(null);
                v.setAlpha(0.5f);
            }
        }
    }

    private void finalizeRegistration() {
        if (prescription == null) return;

        String patientId = TokenManager.getPatientId();
        String notes = etNotes.getText().toString();
        long now = System.currentTimeMillis();

        executor.execute(() -> {
            AppDatabase db = AppDatabase.getInstance(this);
            for (Prescription.PrescriptionExercise pe : prescription.getExercises()) {
                ExerciseSession session = new ExerciseSession();
                session.setPatientId(patientId);
                session.setPrescriptionId(prescription.getId());
                session.setExerciseId(pe.getExerciseId());
                session.setCompletedAt(now);
                session.setCompleted(true);
                session.setFeelingLevel(selectedFeel);
                // Normaliza escala 1-5 para 0-10 conforme contrato da API
                session.setPainLevel(selectedPain * 2);
                session.setNotes(notes);
                session.setSynced(false);
                
                db.exerciseSessionDao().insert(session);
            }

            runOnUiThread(() -> {
                layoutSuccess.setVisibility(View.VISIBLE);
                // Trigger Sync
                com.maya.rpg.db.OfflineManager.triggerSync(this);
            });
        });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        executor.shutdown();
    }
}
