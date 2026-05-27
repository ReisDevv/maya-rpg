package com.maya.rpg.ui.profile;

import android.app.DatePickerDialog;
import android.content.Intent;
import android.os.Bundle;
import android.text.InputType;
import android.view.View;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;

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

    // Estado local dos campos editáveis
    private String currentFullName = "";
    private String currentPhone = "";
    private String currentBirthDate = "";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_edit_profile);

        tvProfileName = findViewById(R.id.tvProfileName);
        tvEmail = findViewById(R.id.tvEmail);
        tvDisplayFullName = findViewById(R.id.tvDisplayFullName);
        tvDisplayBirthDate = findViewById(R.id.tvDisplayBirthDate);

        findViewById(R.id.btnBack).setOnClickListener(v -> finish());
        findViewById(R.id.btnLogout).setOnClickListener(v -> showLogoutConfirmation());

        // Edição de nome via AlertDialog
        View.OnClickListener editNameListener = v -> showEditNameDialog();
        findViewById(R.id.tvActionEditName).setOnClickListener(editNameListener);
        findViewById(R.id.rowEditName).setOnClickListener(editNameListener);

        // Edição de data de nascimento via DatePickerDialog
        findViewById(R.id.rowEditBirthDate).setOnClickListener(v -> showDatePicker());

        // Campos não editáveis nesta tela
        View.OnClickListener readOnly = v ->
                Toast.makeText(this, "Este campo não pode ser alterado aqui", Toast.LENGTH_SHORT).show();
        findViewById(R.id.rowEmailDisplay).setOnClickListener(readOnly);
        findViewById(R.id.rowEditPhoto).setOnClickListener(readOnly);
        findViewById(R.id.rowNotifications).setOnClickListener(readOnly);
        findViewById(R.id.rowLanguage).setOnClickListener(readOnly);
        findViewById(R.id.rowTheme).setOnClickListener(readOnly);

        loadProfile();
        setupBottomNav();
    }

    private void loadProfile() {
        RetrofitClient.getApiService().getMyPatient().enqueue(new Callback<Patient>() {
            @Override
            public void onResponse(Call<Patient> call, Response<Patient> response) {
                if (response.isSuccessful() && response.body() != null) {
                    Patient p = response.body();
                    currentFullName = p.getFullName() != null ? p.getFullName() : "";
                    currentPhone = p.getPhone() != null ? p.getPhone() : "";
                    currentBirthDate = p.getBirthDate() != null ? p.getBirthDate() : "";

                    tvProfileName.setText(currentFullName);
                    tvEmail.setText(p.getEmail());
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

        // Pré-preenche com a data atual do paciente se disponível (formato YYYY-MM-DD)
        if (!currentBirthDate.isEmpty()) {
            try {
                String[] parts = currentBirthDate.split("T")[0].split("-");
                cal.set(Integer.parseInt(parts[0]), Integer.parseInt(parts[1]) - 1, Integer.parseInt(parts[2]));
            } catch (Exception ignored) { }
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
        // Limita seleção até hoje
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
            String datePart = isoDate.split("T")[0];
            String[] parts = datePart.split("-");
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
        findViewById(R.id.navHome).setOnClickListener(v -> startActivity(new Intent(this, HomeActivity.class)));
        findViewById(R.id.navExercises).setOnClickListener(v -> startActivity(new Intent(this, com.maya.rpg.ui.exercises.ExercisePlanActivity.class)));
        findViewById(R.id.navEvolution).setOnClickListener(v -> startActivity(new Intent(this, EvolutionActivity.class)));
        findViewById(R.id.navMore).setOnClickListener(v -> {
            startActivity(new Intent(this, ProfileActivity.class));
            finish();
        });
    }
}
