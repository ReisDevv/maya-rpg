package com.maya.rpg.ui.exercises;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.CountDownTimer;
import android.view.View;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import com.bumptech.glide.Glide;
import com.google.android.material.button.MaterialButton;
import com.google.gson.Gson;
import com.maya.rpg.R;
import com.maya.rpg.model.Exercise;
import com.maya.rpg.model.Prescription;
import com.maya.rpg.ui.BaseAuthActivity;

import java.util.List;
import java.util.Locale;

public class ExerciseDetailActivity extends BaseAuthActivity {

    private Prescription prescription;
    private int currentExerciseIndex = 0;
    private List<Prescription.PrescriptionExercise> exerciseList;

    private TextView tvName, tvIndex, tvInstructions, tvMaintainLabel, tvCountdown, tvTipText;
    private ImageView ivMedia, btnPrev, btnNext, ivPlayButton;
    private TextView btnOpenMedia;
    private ProgressBar pbTimer;
    private MaterialButton btnFinish;
    private int timerTotal = 60;
    private String currentVideoUrl = null;

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
        updateExerciseUI();
    }

    private void initUI() {
        tvName          = findViewById(R.id.tvExerciseName);
        tvIndex         = findViewById(R.id.tvExerciseIndex);
        tvInstructions  = findViewById(R.id.tvInstructions);
        tvMaintainLabel = findViewById(R.id.tvMaintainLabel);
        tvCountdown     = findViewById(R.id.tvCountdown);
        tvTipText       = findViewById(R.id.tvTipText);
        ivMedia         = findViewById(R.id.ivExerciseMedia);
        ivPlayButton    = findViewById(R.id.ivPlayButton);
        btnOpenMedia    = findViewById(R.id.btnOpenMedia);
        btnPrev         = findViewById(R.id.btnPrev);
        btnNext         = findViewById(R.id.btnNext);
        pbTimer         = findViewById(R.id.pbTimer);
        btnFinish       = findViewById(R.id.btnCheckIn);

        findViewById(R.id.btnBack).setOnClickListener(v -> finish());

        // Toca no thumbnail → abre YouTube
        ivMedia.setOnClickListener(v -> openVideoExternally());
        ivPlayButton.setOnClickListener(v -> openVideoExternally());

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
        Exercise ex = pe.getExercise();

        // Nome e índice
        tvName.setText(ex != null ? ex.getTitle() : prescription.getTitle());
        tvIndex.setText(String.format(Locale.getDefault(),
                "exercício %d de %d", currentExerciseIndex + 1, exerciseList.size()));

        // Instruções completas
        String instructions = (ex != null && ex.getInstructions() != null)
                ? ex.getInstructions()
                : "Realize conforme orientação do profissional.";
        tvInstructions.setText(instructions);

        // Dica: notes da prescrição > descrição do exercício > texto padrão
        String tip = null;
        if (pe.getNotes() != null && !pe.getNotes().isEmpty()) {
            tip = pe.getNotes();
        } else if (ex != null && ex.getDescription() != null && !ex.getDescription().isEmpty()) {
            tip = ex.getDescription();
        }
        tvTipText.setText(tip != null ? tip
                : "Mantenha a respiração calma e o movimento controlado durante todo o exercício.");

        // Duração — formato inteligente
        int durationSeconds = (pe.getHoldTimeSeconds() != null) ? pe.getHoldTimeSeconds() : 60;
        tvMaintainLabel.setText(formatDuration(durationSeconds));
        timerTotal = durationSeconds;
        startTimer(durationSeconds);

        // Mídia
        currentVideoUrl = (ex != null) ? ex.getVideoUrl() : null;
        List<String> imageUrls = (ex != null) ? ex.getImageUrls() : null;
        boolean hasVideo  = currentVideoUrl != null && !currentVideoUrl.isEmpty();
        boolean hasImages = imageUrls != null && !imageUrls.isEmpty();

        if (hasVideo) {
            // Carrega thumbnail do YouTube como preview clicável
            String thumbnailUrl = getYouTubeThumbnail(currentVideoUrl);
            Glide.with(this)
                    .load(thumbnailUrl)
                    .placeholder(R.drawable.img_varias_foto3)
                    .error(R.drawable.img_varias_foto3)
                    .centerCrop()
                    .into(ivMedia);
            ivMedia.setClickable(true);
            ivPlayButton.setVisibility(View.VISIBLE);
            btnOpenMedia.setVisibility(View.GONE);
        } else if (hasImages) {
            Glide.with(this)
                    .load(imageUrls.get(0))
                    .placeholder(R.drawable.img_varias_foto3)
                    .centerCrop()
                    .into(ivMedia);
            ivMedia.setClickable(false);
            ivPlayButton.setVisibility(View.GONE);
            if (imageUrls.size() > 1) {
                btnOpenMedia.setText("Ver " + imageUrls.size() + " imagens");
                btnOpenMedia.setVisibility(View.VISIBLE);
                final List<String> urls = imageUrls;
                final String title = ex != null ? ex.getTitle() : "";
                btnOpenMedia.setOnClickListener(v -> {
                    Intent intent = new Intent(this, ExerciseMediaActivity.class);
                    intent.putExtra(ExerciseMediaActivity.EXTRA_TITLE, title);
                    intent.putExtra(ExerciseMediaActivity.EXTRA_IMAGE_URLS,
                            urls.toArray(new String[0]));
                    startActivity(intent);
                });
            } else {
                btnOpenMedia.setVisibility(View.GONE);
            }
        } else {
            ivMedia.setImageResource(R.drawable.img_varias_foto3);
            ivMedia.setClickable(false);
            ivPlayButton.setVisibility(View.GONE);
            btnOpenMedia.setVisibility(View.GONE);
        }

        // Navegação
        btnPrev.setAlpha(currentExerciseIndex == 0 ? 0.3f : 1.0f);
        btnPrev.setEnabled(currentExerciseIndex > 0);
        btnNext.setAlpha(currentExerciseIndex == exerciseList.size() - 1 ? 0.3f : 1.0f);
        btnNext.setEnabled(currentExerciseIndex < exerciseList.size() - 1);

        boolean isLast = currentExerciseIndex == exerciseList.size() - 1;
        btnFinish.setText(isLast ? "Concluir Sessão" : "Próximo Exercício");
    }

    private String formatDuration(int seconds) {
        if (seconds < 60) {
            return "Mantenha por " + seconds + " segundo" + (seconds != 1 ? "s" : "");
        }
        int minutes = seconds / 60;
        int remaining = seconds % 60;
        if (remaining == 0) {
            return "Mantenha por " + minutes + " minuto" + (minutes != 1 ? "s" : "");
        }
        return String.format(Locale.getDefault(),
                "Mantenha por %d min e %d seg", minutes, remaining);
    }

    /** Extrai o ID do YouTube e monta URL do thumbnail em alta qualidade. */
    private String getYouTubeThumbnail(String url) {
        String id = extractYouTubeId(url);
        if (id == null) return "";
        return "https://img.youtube.com/vi/" + id + "/hqdefault.jpg";
    }

    private String extractYouTubeId(String url) {
        if (url == null) return null;
        if (url.contains("youtu.be/")) {
            String id = url.substring(url.lastIndexOf('/') + 1);
            return id.contains("?") ? id.substring(0, id.indexOf('?')) : id;
        }
        if (url.contains("watch?v=")) {
            String id = url.substring(url.indexOf("watch?v=") + 8);
            return id.contains("&") ? id.substring(0, id.indexOf('&')) : id;
        }
        if (url.contains("/embed/")) {
            String id = url.substring(url.lastIndexOf('/') + 1);
            return id.contains("?") ? id.substring(0, id.indexOf('?')) : id;
        }
        return null;
    }

    private void openVideoExternally() {
        if (currentVideoUrl == null || currentVideoUrl.isEmpty()) return;

        // Tenta abrir no app do YouTube primeiro
        String youtubeAppUrl = currentVideoUrl;
        if (currentVideoUrl.contains("/embed/")) {
            String id = extractYouTubeId(currentVideoUrl);
            if (id != null) youtubeAppUrl = "https://www.youtube.com/watch?v=" + id;
        }

        try {
            Intent ytIntent = new Intent(Intent.ACTION_VIEW,
                    Uri.parse("vnd.youtube:" + extractYouTubeId(currentVideoUrl)));
            startActivity(ytIntent);
        } catch (Exception e) {
            // Fallback: abre no navegador
            Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(youtubeAppUrl));
            if (browserIntent.resolveActivity(getPackageManager()) != null) {
                startActivity(Intent.createChooser(browserIntent, "Abrir vídeo com"));
            } else {
                Toast.makeText(this, "Nenhum aplicativo encontrado.", Toast.LENGTH_SHORT).show();
            }
        }
    }

    private void startTimer(int seconds) {
        if (countDownTimer != null) countDownTimer.cancel();

        pbTimer.setMax(100);
        pbTimer.setProgress(100);
        tvCountdown.setText(String.format(Locale.getDefault(), "%02d:%02d",
                seconds / 60, seconds % 60));

        countDownTimer = new CountDownTimer(seconds * 1000L, 1000) {
            @Override
            public void onTick(long millisUntilFinished) {
                int remaining = (int) (millisUntilFinished / 1000);
                tvCountdown.setText(String.format(Locale.getDefault(), "%02d:%02d",
                        remaining / 60, remaining % 60));
                pbTimer.setProgress((int) ((remaining * 100f) / timerTotal));
            }

            @Override
            public void onFinish() {
                tvCountdown.setText("00:00");
                pbTimer.setProgress(0);
                Toast.makeText(ExerciseDetailActivity.this,
                        "Exercício concluído!", Toast.LENGTH_SHORT).show();
            }
        }.start();
    }

    private void performCheckIn() {
        if (prescription == null || exerciseList == null) return;

        if (currentExerciseIndex < exerciseList.size() - 1) {
            currentExerciseIndex++;
            updateExerciseUI();
        } else {
            Intent intent = new Intent(this, RegisterPlanActivity.class);
            intent.putExtra("prescription_json", new Gson().toJson(prescription));
            startActivity(intent);
            finish();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (countDownTimer != null) countDownTimer.cancel();
    }
}
