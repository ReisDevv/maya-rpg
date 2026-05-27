package com.maya.rpg.ui.exercises;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.CheckBox;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.maya.rpg.R;
import com.maya.rpg.model.Prescription;
import java.util.List;

public class RegisterExerciseAdapter extends RecyclerView.Adapter<RegisterExerciseAdapter.ViewHolder> {

    private final List<Prescription.PrescriptionExercise> exercises;

    public RegisterExerciseAdapter(List<Prescription.PrescriptionExercise> exercises) {
        this.exercises = exercises;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_register_exercise, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Prescription.PrescriptionExercise item = exercises.get(position);
        holder.tvTitle.setText(item.getExercise() != null ? item.getExercise().getTitle() : "Exercício");
        holder.cbCompleted.setChecked(true); // Default checked as per design
    }

    @Override
    public int getItemCount() {
        return exercises.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvTitle;
        CheckBox cbCompleted;

        ViewHolder(View itemView) {
            super(itemView);
            tvTitle = itemView.findViewById(R.id.tvExerciseTitle);
            cbCompleted = itemView.findViewById(R.id.cbCompleted);
        }
    }
}
