package com.maya.rpg.ui.exercises;

import android.content.Intent;
import android.os.Bundle;
import android.os.CountDownTimer;
import android.view.View;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import com.google.android.material.button.MaterialButton;
import com.google.gson.Gson;
import com.maya.rpg.R;
import com.maya.rpg.model.Prescription;
import com.maya.rpg.ui.BaseAuthActivity;
import com.maya.rpg.ui.evolution.EvolutionActivity;
import com.maya.rpg.ui.home.HomeActivity;
import com.maya.rpg.ui.profile.ProfileActivity;

import java.util.List;
import java.util.Locale;

public class ExerciseDetailActivity extends BaseAuthActivity {

    private Prescription prescription;
    private int currentExerciseIndex = 0;
    private List<Prescription.PrescriptionExercise> exerciseList;

    private TextView tvName, tvIndex, tvPosition, tvAction, tvDuration, tvCountdown, tvTipText;
    private ImageView ivMedia, btnPrev, btnNext;
    private ProgressBar pbTimer;
    private MaterialButton btnFinish;

    private CountDownTimer countDownTimer;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_exercise_detail);

        String json = getIntent().getStringExtra("prescription_json");
        if (json != null) {
            prescription = new Gson().fromJson(json, Prescription.class);
            exerciseList = prescription.getExercises();
        }

        initUI();
        setupBottomNav();
        updateExerciseUI();
    }

    private void initUI() {
        tvName = findViewById(R.id.tvExerciseName);
        tvIndex = findViewById(R.id.tvExerciseIndex);
        tvPosition = findViewById(R.id.tvPosition);
        tvAction = findViewById(R.id.tvAction);
        tvDuration = findViewById(R.id.tvMaintainLabel);
        tvCountdown = findViewById(R.id.tvCountdown);
        tvTipText = findViewById(R.id.tvTipText);
        ivMedia = findViewById(R.id.ivExerciseMedia);
        btnPrev = findViewById(R.id.btnPrev);
        btnNext = findViewById(R.id.btnNext);
        pbTimer = findViewById(R.id.pbTimer);
        btnFinish = findViewById(R.id.btnCheckIn);

        btnPrev.setOnClickListener(v -> {
            if (currentExerciseIndex > 0) {
                currentExerciseIndex--;
                updateExerciseUI();
            }
        });

        btnNext.setOnClickListener(v -> {
            if (currentExerciseIndex < exerciseList.size() - 1) {
                currentExerciseIndex++;
                updateExerciseUI();
            }
        });

        btnFinish.setOnClickListener(v -> performCheckIn());
    }

    private void updateExerciseUI() {
        if (exerciseList == null || exerciseList.isEmpty()) return;

        Prescription.PrescriptionExercise pe = exerciseList.get(currentExerciseIndex);
        com.maya.rpg.model.Exercise ex = pe.getExercise();

        tvName.setText(ex != null ? ex.getTitle() : prescription.getTitle());
        tvIndex.setText(String.format(Locale.getDefault(), "exercício %d de %d", 
                currentExerciseIndex + 1, exerciseList.size()));
        
        // Mocking Position and Action as they might not be in the basic Exercise model
        tvPosition.setText("Posição: " + (ex != null && ex.getInstructions() != null ? ex.getInstructions().split("\n")[0] : "Conforme orientação"));
        tvAction.setText("Ação: " + (ex != null && ex.getInstructions() != null && ex.getInstructions().contains("\n") ? ex.getInstructions().split("\n")[1] : "Realize o movimento controlado"));
        
        int durationSeconds = (pe.getHoldTimeSeconds() != null) ? pe.getHoldTimeSeconds() : 60;
        tvDuration.setText(String.format(Locale.getDefault(), "Mantenha por %d:%02d min", 
                durationSeconds / 60, durationSeconds % 60));

        // Start Timer
        startTimer(durationSeconds);

        // Update illustrations or media
        if (ex != null && ex.getImageUrls() != null && !ex.getImageUrls().isEmpty()) {
            com.bumptech.glide.Glide.with(this).load(ex.getImageUrls().get(0)).into(ivMedia);
        } else {
            // Fallback
            ivMedia.setImageResource(R.drawable.img_varias_foto3);
        }

        // Navigation button states
        btnPrev.setAlpha(currentExerciseIndex == 0 ? 0.3f : 1.0f);
        btnPrev.setEnabled(currentExerciseIndex > 0);
        btnNext.setAlpha(currentExerciseIndex == exerciseList.size() - 1 ? 0.3f : 1.0f);
        btnNext.setEnabled(currentExerciseIndex < exerciseList.size() - 1);

        boolean isLast = currentExerciseIndex == exerciseList.size() - 1;
        btnFinish.setText(isLast ? "Concluir Sessão" : "Próximo Exercício");
    }

    private void startTimer(int seconds) {
        if (countDownTimer != null) countDownTimer.cancel();

        long millisInFuture = seconds * 1000L;
        pbTimer.setMax(seconds);
        pbTimer.setProgress(seconds);

        countDownTimer = new CountDownTimer(millisInFuture, 1000) {
            @Override
            public void onTick(long millisUntilFinished) {
                int remaining = (int) (millisUntilFinished / 1000);
                tvCountdown.setText(String.format(Locale.getDefault(), "%02d:%02d", 
                        remaining / 60, remaining % 60));
                pbTimer.setProgress(remaining);
            }

            @Override
            public void onFinish() {
                tvCountdown.setText("00:00");
                pbTimer.setProgress(0);
                Toast.makeText(ExerciseDetailActivity.this, "Exercício concluído!", Toast.LENGTH_SHORT).show();
            }
        }.start();
    }

    private void performCheckIn() {
        if (prescription == null || exerciseList == null) return;

        if (currentExerciseIndex < exerciseList.size() - 1) {
            currentExerciseIndex++;
            updateExerciseUI();
        } else {
            // Todos os exercícios revisados: coleta dor/sentimento reais antes de salvar
            Intent intent = new Intent(this, RegisterPlanActivity.class);
            intent.putExtra("prescription_json", new Gson().toJson(prescription));
            startActivity(intent);
            finish();
        }
    }

    private void setupBottomNav() {
        findViewById(R.id.navHome).setOnClickListener(v -> {
            startActivity(new Intent(this, HomeActivity.class));
            finish();
        });
        findViewById(R.id.navExercises).setOnClickListener(v -> finish());
        findViewById(R.id.navEvolution).setOnClickListener(v -> startActivity(new Intent(this, EvolutionActivity.class)));
        findViewById(R.id.navMore).setOnClickListener(v -> startActivity(new Intent(this, ProfileActivity.class)));
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (countDownTimer != null) countDownTimer.cancel();
    }
}
