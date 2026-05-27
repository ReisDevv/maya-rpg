package com.maya.rpg.ui.exercises;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.os.Bundle;
import android.os.CountDownTimer;
import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

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
    private ImageView ivMedia, btnPrev, btnNext;
    private WebView wvVideo;
    private TextView btnOpenMedia;
    private ProgressBar pbTimer;
    private MaterialButton btnFinish;
    private int timerTotal = 60;

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

    @SuppressLint("SetJavaScriptEnabled")
    private void initUI() {
        tvName        = findViewById(R.id.tvExerciseName);
        tvIndex       = findViewById(R.id.tvExerciseIndex);
        tvInstructions = findViewById(R.id.tvInstructions);
        tvMaintainLabel = findViewById(R.id.tvMaintainLabel);
        tvCountdown   = findViewById(R.id.tvCountdown);
        tvTipText     = findViewById(R.id.tvTipText);
        ivMedia       = findViewById(R.id.ivExerciseMedia);
        wvVideo       = findViewById(R.id.wvVideo);
        btnOpenMedia  = findViewById(R.id.btnOpenMedia);
        btnPrev       = findViewById(R.id.btnPrev);
        btnNext       = findViewById(R.id.btnNext);
        pbTimer       = findViewById(R.id.pbTimer);
        btnFinish     = findViewById(R.id.btnCheckIn);

        // Configura WebView para reproduzir YouTube embed
        WebSettings ws = wvVideo.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setMediaPlaybackRequiresUserGesture(false);
        ws.setLoadWithOverviewMode(true);
        ws.setUseWideViewPort(true);
        ws.setDomStorageEnabled(true);
        wvVideo.setWebChromeClient(new WebChromeClient());
        wvVideo.setWebViewClient(new WebViewClient());

        findViewById(R.id.btnBack).setOnClickListener(v -> finish());

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

        // Dica de execução: usa notes da prescrição ou descrição do exercício
        String tip = null;
        if (pe.getNotes() != null && !pe.getNotes().isEmpty()) {
            tip = pe.getNotes();
        } else if (ex != null && ex.getDescription() != null && !ex.getDescription().isEmpty()) {
            tip = ex.getDescription();
        }
        tvTipText.setText(tip != null ? tip : "Mantenha a respiração calma e o movimento controlado durante todo o exercício.");

        // Duração
        int durationSeconds = (pe.getHoldTimeSeconds() != null) ? pe.getHoldTimeSeconds() : 60;
        tvMaintainLabel.setText(String.format(Locale.getDefault(),
                "Mantenha por %d:%02d min", durationSeconds / 60, durationSeconds % 60));
        timerTotal = durationSeconds;
        startTimer(durationSeconds);

        // Mídia: vídeo tem prioridade sobre imagem
        String videoUrl = (ex != null) ? ex.getVideoUrl() : null;
        List<String> imageUrls = (ex != null) ? ex.getImageUrls() : null;
        boolean hasVideo = videoUrl != null && !videoUrl.isEmpty();
        boolean hasImages = imageUrls != null && !imageUrls.isEmpty();

        if (hasVideo) {
            // Converte URL de embed do YouTube para formato nocookie com autoplay
            String embedUrl = toYouTubeEmbedUrl(videoUrl);
            String html = "<html><body style='margin:0;padding:0;background:#000;'>"
                    + "<iframe width='100%' height='100%' src='" + embedUrl
                    + "' frameborder='0' allowfullscreen allow='autoplay'></iframe>"
                    + "</body></html>";
            wvVideo.loadDataWithBaseURL("https://www.youtube.com", html, "text/html", "utf-8", null);
            wvVideo.setVisibility(View.VISIBLE);
            ivMedia.setVisibility(View.GONE);
            btnOpenMedia.setVisibility(View.GONE);
        } else if (hasImages) {
            // Carrega primeira imagem no ImageView e mostra botão para galeria completa
            com.bumptech.glide.Glide.with(this)
                    .load(imageUrls.get(0))
                    .placeholder(R.drawable.img_varias_foto3)
                    .into(ivMedia);
            ivMedia.setVisibility(View.VISIBLE);
            wvVideo.setVisibility(View.GONE);
            if (imageUrls.size() > 1) {
                btnOpenMedia.setText("Ver " + imageUrls.size() + " imagens");
                btnOpenMedia.setVisibility(View.VISIBLE);
            } else {
                btnOpenMedia.setVisibility(View.GONE);
            }
            // Abre galeria completa ao tocar
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
            ivMedia.setImageResource(R.drawable.img_varias_foto3);
            ivMedia.setVisibility(View.VISIBLE);
            wvVideo.setVisibility(View.GONE);
            btnOpenMedia.setVisibility(View.GONE);
        }

        // Estados dos botões de navegação
        btnPrev.setAlpha(currentExerciseIndex == 0 ? 0.3f : 1.0f);
        btnPrev.setEnabled(currentExerciseIndex > 0);
        btnNext.setAlpha(currentExerciseIndex == exerciseList.size() - 1 ? 0.3f : 1.0f);
        btnNext.setEnabled(currentExerciseIndex < exerciseList.size() - 1);

        boolean isLast = currentExerciseIndex == exerciseList.size() - 1;
        btnFinish.setText(isLast ? "Concluir Sessão" : "Próximo Exercício");
    }

    private String toYouTubeEmbedUrl(String url) {
        // Aceita: youtube.com/embed/ID, youtube-nocookie.com/embed/ID, youtu.be/ID, youtube.com/watch?v=ID
        if (url.contains("youtube.com/embed/") || url.contains("youtube-nocookie.com/embed/")) {
            // Garante nocookie
            return url.replace("www.youtube.com/embed/", "www.youtube-nocookie.com/embed/")
                      .replace("youtube.com/embed/", "www.youtube-nocookie.com/embed/");
        }
        if (url.contains("youtu.be/")) {
            String id = url.substring(url.lastIndexOf('/') + 1);
            return "https://www.youtube-nocookie.com/embed/" + id;
        }
        if (url.contains("watch?v=")) {
            String id = url.substring(url.indexOf("watch?v=") + 8);
            if (id.contains("&")) id = id.substring(0, id.indexOf('&'));
            return "https://www.youtube-nocookie.com/embed/" + id;
        }
        return url;
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
                int progress = (int) ((remaining * 100f) / timerTotal);
                pbTimer.setProgress(progress);
            }

            @Override
            public void onFinish() {
                tvCountdown.setText("00:00");
                pbTimer.setProgress(0);
                Toast.makeText(ExerciseDetailActivity.this,
                        "Exercício concluído! ✓", Toast.LENGTH_SHORT).show();
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
    public void onBackPressed() {
        if (wvVideo.getVisibility() == View.VISIBLE && wvVideo.canGoBack()) {
            wvVideo.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (countDownTimer != null) countDownTimer.cancel();
        wvVideo.destroy();
    }
}
