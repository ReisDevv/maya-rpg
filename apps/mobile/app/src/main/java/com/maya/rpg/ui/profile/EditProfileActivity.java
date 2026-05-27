package com.maya.rpg.ui.profile;

import android.app.Activity;
import android.app.DatePickerDialog;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.text.InputType;
import android.view.View;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatDelegate;

import com.bumptech.glide.Glide;
import com.google.android.material.bottomsheet.BottomSheetDialog;
import com.maya.rpg.R;
import com.maya.rpg.api.RetrofitClient;
import com.maya.rpg.api.TokenManager;
import com.maya.rpg.model.Patient;
import com.maya.rpg.model.ProfileUpdateRequest;
import com.maya.rpg.ui.BaseAuthActivity;
import com.maya.rpg.ui.evolution.EvolutionActivity;
import com.maya.rpg.ui.home.HomeActivity;

import java.util.Calendar;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class EditProfileActivity extends BaseAuthActivity {

    private TextView tvProfileName, tvEmail, tvDisplayFullName, tvDisplayBirthDate;
    private ImageView ivProfileAvatar;

    private String currentFullName = "";
    private String currentPhone = "";
    private String currentBirthDate = "";

    private final ActivityResultLauncher<Intent> pickImageLauncher =
            registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), result -> {
                if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
                    Uri uri = result.getData().getData();
                    if (uri != null) {
                        // Persiste permissão de leitura para que a URI continue acessível após reinicialização
                        try {
                            getContentResolver().takePersistableUriPermission(uri,
                                    Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        } catch (Exception ignored) {}
                        TokenManager.saveProfilePhotoUri(uri.toString());
                        Glide.with(this).load(uri).circleCrop().into(ivProfileAvatar);
                        Toast.makeText(this, "Foto atualizada", Toast.LENGTH_SHORT).show();
                    }
                }
            });

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_edit_profile);

        ivProfileAvatar = findViewById(R.id.ivProfileAvatar);
        tvProfileName = findViewById(R.id.tvProfileName);
        tvEmail = findViewById(R.id.tvEmail);
        tvDisplayFullName = findViewById(R.id.tvDisplayFullName);
        tvDisplayBirthDate = findViewById(R.id.tvDisplayBirthDate);

        findViewById(R.id.btnBack).setOnClickListener(v -> finish());
        findViewById(R.id.btnLogout).setOnClickListener(v -> showLogoutConfirmation());

        // Foto: clique no avatar, no lápis ou na linha "Alterar foto"
        View.OnClickListener pickPhoto = v -> openImagePicker();
        findViewById(R.id.frameAvatar).setOnClickListener(pickPhoto);
        findViewById(R.id.ivEditPhoto).setOnClickListener(pickPhoto);
        findViewById(R.id.rowEditPhoto).setOnClickListener(pickPhoto);

        // Edição de nome
        View.OnClickListener editName = v -> showEditNameDialog();
        findViewById(R.id.tvActionEditName).setOnClickListener(editName);
        findViewById(R.id.rowEditName).setOnClickListener(editName);

        // Data de nascimento
        findViewById(R.id.rowEditBirthDate).setOnClickListener(v -> showDatePicker());

        // Tema
        findViewById(R.id.rowTheme).setOnClickListener(v -> showThemePicker());

        // Campos informativos (não editáveis aqui)
        View.OnClickListener readOnly = v ->
                Toast.makeText(this, "Este campo não pode ser alterado aqui", Toast.LENGTH_SHORT).show();
        findViewById(R.id.rowEmailDisplay).setOnClickListener(readOnly);
        findViewById(R.id.rowNotifications).setOnClickListener(readOnly);
        findViewById(R.id.rowLanguage).setOnClickListener(readOnly);

        loadProfile();
        setupBottomNav();
    }

    private void openImagePicker() {
        Intent intent = new Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI);
        intent.setType("image/*");
        pickImageLauncher.launch(intent);
    }

    private void showThemePicker() {
        int currentMode = AppCompatDelegate.getDefaultNightMode();
        String[] options = {"Seguir o sistema", "Claro (Light)", "Escuro (Dark)"};
        int[] modes = {
            AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM,
            AppCompatDelegate.MODE_NIGHT_NO,
            AppCompatDelegate.MODE_NIGHT_YES
        };

        int checkedItem = 0;
        for (int i = 0; i < modes.length; i++) {
            if (modes[i] == currentMode) { checkedItem = i; break; }
        }

        new AlertDialog.Builder(this)
                .setTitle("Tema do aplicativo")
                .setSingleChoiceItems(options, checkedItem, (dialog, which) -> {
                    AppCompatDelegate.setDefaultNightMode(modes[which]);
                    getSharedPreferences("maya_prefs", MODE_PRIVATE)
                            .edit()
                            .putInt("night_mode", modes[which])
                            .apply();
                    dialog.dismiss();
                    recreate();
                })
                .setNegativeButton("Cancelar", null)
                .show();
    }

    private void loadProfile() {
        // Carrega foto salva localmente
        String savedPhotoUri = TokenManager.getProfilePhotoUri();
        if (savedPhotoUri != null && !savedPhotoUri.isEmpty()) {
            Glide.with(this).load(Uri.parse(savedPhotoUri)).circleCrop()
                    .error(R.drawable.ic_person).into(ivProfileAvatar);
        }

        // Pré-preenche com cache do token enquanto API responde
        String cached = TokenManager.getUserName();
        if (cached != null && !cached.isEmpty()) {
            tvProfileName.setText(cached);
            tvDisplayFullName.setText(cached);
        }

        RetrofitClient.getApiService().getMyPatient().enqueue(new Callback<Patient>() {
            @Override
            public void onResponse(Call<Patient> call, Response<Patient> response) {
                if (response.isSuccessful() && response.body() != null) {
                    Patient p = response.body();
                    currentFullName = p.getFullName() != null ? p.getFullName() : "";
                    currentPhone = p.getPhone() != null ? p.getPhone() : "";
                    currentBirthDate = p.getBirthDate() != null ? p.getBirthDate() : "";

                    tvProfileName.setText(currentFullName);
                    tvEmail.setText(p.getEmail() != null ? p.getEmail() : "");
                    tvDisplayFullName.setText(currentFullName);
                    tvDisplayBirthDate.setText(formatBirthDate(currentBirthDate));
                }
            }

            @Override
            public void onFailure(Call<Patient> call, Throwable t) {
                Toast.makeText(EditProfileActivity.this, "Erro ao carregar dados", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void showEditNameDialog() {
        EditText input = new EditText(this);
        input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_WORDS);
        input.setText(currentFullName);
        input.setSelection(currentFullName.length());
        int padding = (int) (16 * getResources().getDisplayMetrics().density);
        input.setPadding(padding, padding, padding, padding);

        new AlertDialog.Builder(this)
                .setTitle("Editar nome")
                .setView(input)
                .setPositiveButton("Salvar", (dialog, which) -> {
                    String newName = input.getText().toString().trim();
                    if (newName.isEmpty()) {
                        Toast.makeText(this, "Nome não pode ser vazio", Toast.LENGTH_SHORT).show();
                        return;
                    }
                    currentFullName = newName;
                    saveProfile();
                })
                .setNegativeButton("Cancelar", null)
                .show();
    }

    private void showDatePicker() {
        Calendar cal = Calendar.getInstance();
        if (!currentBirthDate.isEmpty()) {
            try {
                String[] parts = currentBirthDate.split("T")[0].split("-");
                cal.set(Integer.parseInt(parts[0]), Integer.parseInt(parts[1]) - 1, Integer.parseInt(parts[2]));
            } catch (Exception ignored) {}
        }

        DatePickerDialog picker = new DatePickerDialog(
                this,
                (view, year, month, dayOfMonth) -> {
                    currentBirthDate = String.format("%04d-%02d-%02d", year, month + 1, dayOfMonth);
                    tvDisplayBirthDate.setText(String.format("%02d/%02d/%04d", dayOfMonth, month + 1, year));
                    saveProfile();
                },
                cal.get(Calendar.YEAR),
                cal.get(Calendar.MONTH),
                cal.get(Calendar.DAY_OF_MONTH)
        );
        picker.getDatePicker().setMaxDate(System.currentTimeMillis());
        picker.show();
    }

    private void saveProfile() {
        ProfileUpdateRequest request = new ProfileUpdateRequest(
                currentFullName,
                currentPhone,
                currentBirthDate.isEmpty() ? null : currentBirthDate
        );

        RetrofitClient.getApiService().updateMyPatient(request).enqueue(new Callback<Patient>() {
            @Override
            public void onResponse(Call<Patient> call, Response<Patient> response) {
                if (response.isSuccessful() && response.body() != null) {
                    Patient p = response.body();
                    currentFullName = p.getFullName() != null ? p.getFullName() : currentFullName;
                    currentBirthDate = p.getBirthDate() != null ? p.getBirthDate() : currentBirthDate;

                    tvProfileName.setText(currentFullName);
                    tvDisplayFullName.setText(currentFullName);
                    tvDisplayBirthDate.setText(formatBirthDate(currentBirthDate));
                    Toast.makeText(EditProfileActivity.this, "Dados atualizados!", Toast.LENGTH_SHORT).show();
                } else {
                    Toast.makeText(EditProfileActivity.this, "Erro ao salvar dados", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<Patient> call, Throwable t) {
                Toast.makeText(EditProfileActivity.this, "Sem conexão. Tente novamente.", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private String formatBirthDate(String isoDate) {
        if (isoDate == null || isoDate.isEmpty()) return "Não informado";
        try {
            String[] parts = isoDate.split("T")[0].split("-");
            return String.format("%s/%s/%s", parts[2], parts[1], parts[0]);
        } catch (Exception e) {
            return isoDate;
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
        findViewById(R.id.navMore).setOnClickListener(v -> { startActivity(new Intent(this, ProfileActivity.class)); finish(); });
    }
}
