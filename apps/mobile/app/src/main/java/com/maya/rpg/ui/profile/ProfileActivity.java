package com.maya.rpg.ui.profile;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;

import com.bumptech.glide.Glide;
import com.google.android.material.bottomsheet.BottomSheetDialog;
import com.maya.rpg.R;
import com.maya.rpg.api.RetrofitClient;
import com.maya.rpg.api.TokenManager;
import com.maya.rpg.model.Patient;
import com.maya.rpg.ui.BaseAuthActivity;
import com.maya.rpg.ui.evolution.EvolutionActivity;
import com.maya.rpg.ui.home.HomeActivity;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ProfileActivity extends BaseAuthActivity {

    private TextView tvProfileName, tvEmail;
    private ImageView ivProfileAvatar;

    private final ActivityResultLauncher<Intent> pickImageLauncher =
            registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), result -> {
                if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
                    Uri uri = result.getData().getData();
                    if (uri != null) {
                        Glide.with(this).load(uri)
                                .circleCrop()
                                .into(ivProfileAvatar);
                        // Foto apenas local por enquanto — upload futuro via multipart
                        Toast.makeText(this, "Foto atualizada localmente", Toast.LENGTH_SHORT).show();
                    }
                }
            });

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_profile);

        tvProfileName = findViewById(R.id.tvProfileName);
        tvEmail = findViewById(R.id.tvEmail);
        ivProfileAvatar = findViewById(R.id.ivProfileAvatar);

        findViewById(R.id.btnBack).setOnClickListener(v -> finish());
        findViewById(R.id.btnLogout).setOnClickListener(v -> showLogoutConfirmation());

        View.OnClickListener comingSoon = v -> Toast.makeText(this, "Funcionalidade em breve", Toast.LENGTH_SHORT).show();
        findViewById(R.id.rowEditProfile).setOnClickListener(v -> startActivity(new Intent(this, EditProfileActivity.class)));
        findViewById(R.id.rowSecurity).setOnClickListener(comingSoon);
        findViewById(R.id.rowPrivacy).setOnClickListener(comingSoon);
        findViewById(R.id.rowDelete).setOnClickListener(comingSoon);
        findViewById(R.id.rowNotifications).setOnClickListener(comingSoon);
        findViewById(R.id.rowLanguage).setOnClickListener(comingSoon);
        findViewById(R.id.rowTheme).setOnClickListener(comingSoon);

        // Pré-preenche com dados do token enquanto a API carrega
        String cachedName = TokenManager.getUserName();
        if (cachedName != null && !cachedName.isEmpty()) {
            tvProfileName.setText(cachedName);
        }

        loadPatientFromApi();
        setupBottomNav();
    }

    private void openImagePicker() {
        Intent intent = new Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI);
        intent.setType("image/*");
        pickImageLauncher.launch(intent);
    }

    private void loadPatientFromApi() {
        RetrofitClient.getApiService().getMyPatient().enqueue(new Callback<Patient>() {
            @Override
            public void onResponse(Call<Patient> call, Response<Patient> response) {
                if (response.isSuccessful() && response.body() != null) {
                    bindPatient(response.body());
                }
            }

            @Override
            public void onFailure(Call<Patient> call, Throwable t) {
                // mantém dados do cache
            }
        });
    }

    private void bindPatient(Patient patient) {
        if (patient.getName() != null) tvProfileName.setText(patient.getName());
        if (patient.getEmail() != null) tvEmail.setText(patient.getEmail());

        // Foto de perfil — se a API retornar URL futuramente
        String photoUrl = patient.getProfilePhotoUrl();
        if (photoUrl != null && !photoUrl.isEmpty()) {
            Glide.with(this).load(photoUrl).circleCrop().into(ivProfileAvatar);
        }
    }

    private void showLogoutConfirmation() {
        BottomSheetDialog dialog = new BottomSheetDialog(this);
        View view = getLayoutInflater().inflate(R.layout.dialog_logout_confirmation, null);
        view.findViewById(R.id.btnCancelLogout).setOnClickListener(v -> dialog.dismiss());
        view.findViewById(R.id.btnConfirmLogout).setOnClickListener(v -> {
            dialog.dismiss();
            performLogout();
        });
        dialog.setContentView(view);
        dialog.show();
    }

    private void performLogout() {
        TokenManager.clearAll();
        Intent intent = new Intent(this, com.maya.rpg.ui.auth.LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }

    private void setupBottomNav() {
        findViewById(R.id.navMore).setAlpha(1.0f);
        findViewById(R.id.navHome).setOnClickListener(v -> startActivity(new Intent(this, HomeActivity.class)));
        findViewById(R.id.navExercises).setOnClickListener(v -> startActivity(new Intent(this, com.maya.rpg.ui.exercises.ExercisePlanActivity.class)));
        findViewById(R.id.navSchedule).setOnClickListener(v -> startActivity(new Intent(this, com.maya.rpg.ui.schedule.ScheduleActivity.class)));
        findViewById(R.id.navEvolution).setOnClickListener(v -> startActivity(new Intent(this, EvolutionActivity.class)));
        findViewById(R.id.navMore).setOnClickListener(v -> {});
    }
}
