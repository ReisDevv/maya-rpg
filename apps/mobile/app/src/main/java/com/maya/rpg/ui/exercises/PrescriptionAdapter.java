package com.maya.rpg.ui.exercises;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.maya.rpg.R;
import com.maya.rpg.model.Prescription;
import java.util.List;

public class PrescriptionAdapter extends RecyclerView.Adapter<PrescriptionAdapter.ViewHolder> {

    private List<Prescription> prescriptions;
    private OnPrescriptionClickListener listener;

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
        TextView tvTitle, tvDescription, tvFrequency;
        TextView chipExercises, chipSets, chipReps, chipTime;
        android.widget.Button btnStart;

        ViewHolder(View itemView) {
            super(itemView);
            cardRoot = itemView.findViewById(R.id.cardRoot);
            ivIllustration = itemView.findViewById(R.id.ivIllustration);
            tvTitle = itemView.findViewById(R.id.tvTitle);
            tvDescription = itemView.findViewById(R.id.tvDescription);
            tvFrequency = itemView.findViewById(R.id.tvFrequency);
            chipExercises = itemView.findViewById(R.id.chipExercises);
            chipSets = itemView.findViewById(R.id.chipSets);
            chipReps = itemView.findViewById(R.id.chipReps);
            chipTime = itemView.findViewById(R.id.chipTime);
            btnStart = itemView.findViewById(R.id.btnStart);
        }

        void bind(Prescription prescription, OnPrescriptionClickListener listener, int position) {
            tvTitle.setText(prescription.getTitle());
            
            // Logic for illustration and description based on title/content
            if (prescription.getTitle().toLowerCase().contains("postural")) {
                ivIllustration.setImageResource(R.drawable.ombro_maya);
                tvDescription.setText("Foco: Mobilidade, Consciência, Alinhamento");
            } else if (prescription.getTitle().toLowerCase().contains("equilíbrio") || 
                       prescription.getTitle().toLowerCase().contains("postura")) {
                ivIllustration.setImageResource(R.drawable.ic_spine);
                tvDescription.setText("Foco: Equilíbrio, Alongamento");
            } else {
                ivIllustration.setImageResource(R.drawable.ic_nav_exercises);
                tvDescription.setText(prescription.getDescription() != null ? prescription.getDescription() : "");
            }

            // Alternating card colors
            if (position % 2 == 0) {
                cardRoot.setBackgroundResource(R.drawable.bg_card_beige_light);
            } else {
                cardRoot.setBackgroundResource(R.drawable.bg_card_beige_dark);
            }

            btnStart.setOnClickListener(v -> listener.onStartClick(prescription));
            itemView.setOnClickListener(v -> listener.onStartClick(prescription));
        }
    }
}
