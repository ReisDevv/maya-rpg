package com.maya.rpg.ui.evolution;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.maya.rpg.R;
import java.util.List;

public class ReportAdapter extends RecyclerView.Adapter<ReportAdapter.ViewHolder> {

    private final List<ReportItem> reports;

    public ReportAdapter(List<ReportItem> reports) {
        this.reports = reports;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_report_card, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        ReportItem item = reports.get(position);
        holder.tvDate.setText(item.date);
        holder.tvTitle.setText(item.title);
        if (item.body != null && !item.body.isEmpty()) {
            holder.tvBody.setText(item.body);
            holder.tvBody.setVisibility(View.VISIBLE);
        } else {
            holder.tvBody.setVisibility(View.GONE);
        }
    }

    @Override
    public int getItemCount() {
        return reports.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvDate, tvTitle, tvBody;

        ViewHolder(View itemView) {
            super(itemView);
            tvDate = itemView.findViewById(R.id.tvReportDate);
            tvTitle = itemView.findViewById(R.id.tvReportTitle);
            tvBody = itemView.findViewById(R.id.tvReportBody);
        }
    }

    public static class ReportItem {
        String title;
        String body;
        String date;

        public ReportItem(String title, String body, String date) {
            this.title = title;
            this.body = body;
            this.date = date;
        }
    }
}
