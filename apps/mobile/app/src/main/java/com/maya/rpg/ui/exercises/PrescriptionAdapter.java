package com.maya.rpg.ui.exercises;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.google.android.material.button.MaterialButton;
import com.maya.rpg.R;
import com.maya.rpg.api.TokenManager;
import com.maya.rpg.db.AppDatabase;
import com.maya.rpg.model.Prescription;
import java.util.Calendar;
import java.util.List;
import java.util.concurrent.Executors;

public class PrescriptionAdapter extends RecyclerView.Adapter<PrescriptionAdapter.ViewHolder> {

    private List<Prescription> prescriptions;
    private final OnPrescriptionClickListener listener;

    public interface OnPrescriptionClickListener {
        void onStartClick(Prescription prescription);
    }

    public PrescriptionAdapter(List<Prescription> prescriptions, OnPrescriptionClickListener listener) {
        this.prescriptions = prescriptions;
        this.listener = listener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_prescription, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        holder.bind(prescriptions.get(position), listener, position);
    }

    @Override
    public int getItemCount() {
        return prescriptions.size();
    }

    public void updateList(List<Prescription> newList) {
        this.prescriptions = newList;
        notifyDataSetChanged();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        View cardRoot;
        android.widget.ImageView ivIllustration;
        TextView tvTitle, tvDescription, tvLockStatus;
        TextView tvFrequency, chipExercises, chipSets, chipReps, chipTime;
        MaterialButton btnStart;

        ViewHolder(View itemView) {
            super(itemView);
            cardRoot       = itemView.findViewById(R.id.cardRoot);
            ivIllustration = itemView.findViewById(R.id.ivIllustration);
            tvTitle        = itemView.findViewById(R.id.tvTitle);
            tvDescription  = itemView.findViewById(R.id.tvDescription);
            tvLockStatus   = itemView.findViewById(R.id.tvLockStatus);
            tvFrequency    = itemView.findViewById(R.id.tvFrequency);
            chipExercises  = itemView.findViewById(R.id.chipExercises);
            chipSets       = itemView.findViewById(R.id.chipSets);
            chipReps       = itemView.findViewById(R.id.chipReps);
            chipTime       = itemView.findViewById(R.id.chipTime);
            btnStart       = itemView.findViewById(R.id.btnStart);
        }

        void bind(Prescription prescription, OnPrescriptionClickListener listener, int position) {
            tvTitle.setText(prescription.getTitle());

            tvDescription.setText(prescription.getDescription() != null && !prescription.getDescription().isEmpty()
                    ? prescription.getDescription()
                    : formatExerciseCount(prescription));

            // Estado inicial: habilitado enquanto consulta o Room
            applyUnlocked(prescription, listener);
            tvLockStatus.setVisibility(View.GONE);

            checkLockState(itemView.getContext(), prescription, listener);
        }

        private String formatExerciseCount(Prescription prescription) {
            if (prescription.getExercises() == null || prescription.getExercises().isEmpty()) {
                return "Plano de exercícios";
            }
            int count = prescription.getExercises().size();
            return count + " exercício" + (count != 1 ? "s" : "");
        }

        private void applyUnlocked(Prescription prescription, OnPrescriptionClickListener listener) {
            btnStart.setEnabled(true);
            btnStart.setAlpha(1.0f);
            btnStart.setText("INICIAR");
            btnStart.setOnClickListener(v -> listener.onStartClick(prescription));
            itemView.setOnClickListener(v -> listener.onStartClick(prescription));
            itemView.setClickable(true);
            itemView.setFocusable(true);
        }

        private void applyLocked(String lockLabel) {
            btnStart.setEnabled(false);
            btnStart.setAlpha(0.45f);
            btnStart.setText("Já feito");
            btnStart.setOnClickListener(null);
            itemView.setOnClickListener(null);
            itemView.setClickable(false);
            itemView.setFocusable(false);
            tvLockStatus.setText(lockLabel);
            tvLockStatus.setVisibility(View.VISIBLE);
        }

        private void checkLockState(Context context, Prescription prescription, OnPrescriptionClickListener listener) {
            String patientId = TokenManager.getPatientId();
            if (patientId == null || prescription.getId() == null) return;

            String frequency = resolveFrequency(prescription);
            long since = getSince(frequency);

            Executors.newSingleThreadExecutor().execute(() -> {
                int count = AppDatabase.getInstance(context)
                        .exerciseSessionDao()
                        .countCompletedSince(patientId, prescription.getId(), since);

                itemView.post(() -> {
                    if (count > 0) {
                        String label = "weekly".equalsIgnoreCase(frequency)
                                ? "✓ Concluído esta semana"
                                : "✓ Concluído hoje";
                        applyLocked(label);
                    } else {
                        tvLockStatus.setVisibility(View.GONE);
                        applyUnlocked(prescription, listener);
                    }
                });
            });
        }

        /** Determina a frequência do plano a partir dos exercícios (campo frequency). */
        private String resolveFrequency(Prescription prescription) {
            if (prescription.getExercises() == null || prescription.getExercises().isEmpty()) {
                return "daily";
            }
            for (Prescription.PrescriptionExercise pe : prescription.getExercises()) {
                if (pe.getFrequency() != null && !pe.getFrequency().isEmpty()) {
                    return pe.getFrequency();
                }
            }
            return "daily";
        }

        /** Timestamp de início do período: meia-noite de hoje (diário) ou início da semana (semanal). */
        private long getSince(String frequency) {
            Calendar cal = Calendar.getInstance();
            cal.set(Calendar.HOUR_OF_DAY, 0);
            cal.set(Calendar.MINUTE, 0);
            cal.set(Calendar.SECOND, 0);
            cal.set(Calendar.MILLISECOND, 0);

            if ("weekly".equalsIgnoreCase(frequency)) {
                cal.set(Calendar.DAY_OF_WEEK, cal.getFirstDayOfWeek());
            }
            return cal.getTimeInMillis();
        }
    }
}
