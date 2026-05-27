package com.maya.rpg.ui.exercises;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.EditText;
import android.widget.TextView;

import androidx.constraintlayout.widget.ConstraintLayout;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.slider.Slider;
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
    private int selectedFeel = 3;
    private int selectedPain = 3;

    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    private static final String[] FEEL_LABELS = {"Exaustivo", "Desafiador", "Neutro", "Ideal", "Muito Leve"};
    private static final String[] PAIN_LABELS = {"Muita Dor", "Incômodo", "Neutro", "Bem", "Muito Bem"};

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

        setupSliders();
        findViewById(R.id.btnFinalize).setOnClickListener(v -> finalizeRegistration());
    }

    private void setupSliders() {
        // Feel slider — emojis: triste (esq) → feliz (dir)
        View feelView = findViewById(R.id.layoutScaleFeel);
        Slider feelSlider = feelView.findViewById(R.id.slider);
        TextView feelValue = feelView.findViewById(R.id.tvSliderValue);
        TextView feelLabel = feelView.findViewById(R.id.tvSliderLabel);
        TextView feelLeft = feelView.findViewById(R.id.tvLabelLeft);
        TextView feelRight = feelView.findViewById(R.id.tvLabelRight);
        feelLeft.setText("😣");
        feelRight.setText("😄");
        feelSlider.setValue(3);
        feelLabel.setText(FEEL_LABELS[2]);
        feelValue.setText("3");
        feelSlider.addOnChangeListener((slider, value, fromUser) -> {
            int v = (int) value;
            selectedFeel = v;
            feelValue.setText(String.valueOf(v));
            feelLabel.setText(FEEL_LABELS[v - 1]);
        });

        // Pain slider — emojis: dor (esq) → sem dor (dir)
        View painView = findViewById(R.id.layoutScalePain);
        Slider painSlider = painView.findViewById(R.id.slider);
        TextView painValue = painView.findViewById(R.id.tvSliderValue);
        TextView painLabel = painView.findViewById(R.id.tvSliderLabel);
        TextView painLeft = painView.findViewById(R.id.tvLabelLeft);
        TextView painRight = painView.findViewById(R.id.tvLabelRight);
        painLeft.setText("😣");
        painRight.setText("😊");
        painSlider.setValue(3);
        painLabel.setText(PAIN_LABELS[2]);
        painValue.setText("3");
        painSlider.addOnChangeListener((slider, value, fromUser) -> {
            int v = (int) value;
            selectedPain = v;
            painValue.setText(String.valueOf(v));
            painLabel.setText(PAIN_LABELS[v - 1]);
        });
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
                session.setPainLevel(selectedPain * 2); // normaliza 1-5 para 0-10
                session.setNotes(notes);
                session.setSynced(false);
                db.exerciseSessionDao().insert(session);
            }

            runOnUiThread(() -> {
                layoutSuccess.setVisibility(View.VISIBLE);
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
