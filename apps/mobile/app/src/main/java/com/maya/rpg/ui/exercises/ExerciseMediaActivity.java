package com.maya.rpg.ui.exercises;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.MenuItem;
import android.view.View;
import android.widget.Button;
import android.widget.MediaController;
import android.widget.TextView;
import android.widget.Toast;
import android.widget.VideoView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.viewpager2.widget.ViewPager2;

import com.maya.rpg.R;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Tela dedicada à exibição de mídia do exercício:
 *  - VideoView nativo para reprodução in-app de vídeos por URL HTTP/HTTPS.
 *  - Botão "Abrir player externo" usando Intent implícito (ACTION_VIEW) — atende
 *    requisitos de Programação Mobile sobre uso de Intents implícitas e fallback
 *    para qualquer player de vídeo instalado no aparelho.
 *  - ViewPager2 com Glide para a sequência de imagens prescrita pelo profissional.
 */
public class ExerciseMediaActivity extends AppCompatActivity {

    public static final String EXTRA_TITLE = "extra_title";
    public static final String EXTRA_VIDEO_URL = "extra_video_url";
    public static final String EXTRA_IMAGE_URLS = "extra_image_urls";

    private VideoView videoView;
    private View videoFrame;
    private Button btnOpenExternal;
    private ViewPager2 imagesPager;
    private TextView tvImageCounter;
    private TextView tvImagesLabel;
    private TextView tvEmptyState;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_exercise_media);

        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        }

        String title = getIntent().getStringExtra(EXTRA_TITLE);
        if (title != null && getSupportActionBar() != null) {
            getSupportActionBar().setTitle(title);
        }

        videoFrame = findViewById(R.id.videoFrame);
        videoView = findViewById(R.id.videoView);
        btnOpenExternal = findViewById(R.id.btnOpenExternal);
        imagesPager = findViewById(R.id.imagesPager);
        tvImageCounter = findViewById(R.id.tvImageCounter);
        tvImagesLabel = findViewById(R.id.tvImagesLabel);
        tvEmptyState = findViewById(R.id.tvEmptyState);

        String videoUrl = getIntent().getStringExtra(EXTRA_VIDEO_URL);
        String[] imageUrlsArr = getIntent().getStringArrayExtra(EXTRA_IMAGE_URLS);
        List<String> imageUrls = imageUrlsArr != null
                ? new ArrayList<>(Arrays.asList(imageUrlsArr))
                : new ArrayList<>();

        boolean hasVideo = videoUrl != null && !videoUrl.isEmpty();
        boolean hasImages = !imageUrls.isEmpty();

        if (hasVideo) {
            setupVideo(videoUrl);
        }
        if (hasImages) {
            setupImagesCarousel(imageUrls);
        }
        if (!hasVideo && !hasImages) {
            tvEmptyState.setVisibility(View.VISIBLE);
        }
    }

    private void setupVideo(String videoUrl) {
        videoFrame.setVisibility(View.VISIBLE);
        btnOpenExternal.setVisibility(View.VISIBLE);

        MediaController controller = new MediaController(this);
        controller.setAnchorView(videoView);
        videoView.setMediaController(controller);
        videoView.setVideoURI(Uri.parse(videoUrl));
        videoView.setOnPreparedListener(mp -> mp.setLooping(false));
        videoView.setOnErrorListener((mp, what, extra) -> {
            Toast.makeText(this,
                    "Não foi possível reproduzir aqui. Toque em 'Abrir no player externo'.",
                    Toast.LENGTH_LONG).show();
            return true;
        });
        videoView.start();

        btnOpenExternal.setOnClickListener(v -> openVideoExternally(videoUrl));
    }

    private void openVideoExternally(String videoUrl) {
        // Intent implícita: deixa o usuário escolher YouTube/Chrome/etc.
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(videoUrl));
        if (intent.resolveActivity(getPackageManager()) != null) {
            startActivity(Intent.createChooser(intent, "Abrir vídeo com"));
        } else {
            Toast.makeText(this, "Nenhum aplicativo encontrado para abrir o vídeo.",
                    Toast.LENGTH_SHORT).show();
        }
    }

    private void setupImagesCarousel(List<String> imageUrls) {
        tvImagesLabel.setVisibility(View.VISIBLE);
        imagesPager.setVisibility(View.VISIBLE);
        tvImageCounter.setVisibility(View.VISIBLE);

        ExerciseImagesAdapter adapter = new ExerciseImagesAdapter(imageUrls);
        imagesPager.setAdapter(adapter);
        updateImageCounter(0, imageUrls.size());

        imagesPager.registerOnPageChangeCallback(new ViewPager2.OnPageChangeCallback() {
            @Override
            public void onPageSelected(int position) {
                updateImageCounter(position, imageUrls.size());
            }
        });
    }

    private void updateImageCounter(int position, int total) {
        tvImageCounter.setText((position + 1) + " / " + total);
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (videoView != null && videoView.isPlaying()) {
            videoView.pause();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (videoView != null) {
            videoView.stopPlayback();
        }
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == android.R.id.home) {
            finish();
            return true;
        }
        return super.onOptionsItemSelected(item);
    }
}
