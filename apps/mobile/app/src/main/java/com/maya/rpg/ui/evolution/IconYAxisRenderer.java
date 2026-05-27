package com.maya.rpg.ui.evolution;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Rect;
import com.github.mikephil.charting.components.YAxis;
import com.github.mikephil.charting.renderer.YAxisRenderer;
import com.github.mikephil.charting.utils.Transformer;
import com.github.mikephil.charting.utils.ViewPortHandler;
import com.maya.rpg.R;

public class IconYAxisRenderer extends YAxisRenderer {

    private final Bitmap[] icons;
    private final int iconSize;

    public IconYAxisRenderer(ViewPortHandler viewPortHandler, YAxis yAxis, Transformer trans, Context context) {
        super(viewPortHandler, yAxis, trans);
        
        icons = new Bitmap[5];
        icons[0] = BitmapFactory.decodeResource(context.getResources(), R.drawable.ic_face_1);
        icons[1] = BitmapFactory.decodeResource(context.getResources(), R.drawable.ic_face_2);
        icons[2] = BitmapFactory.decodeResource(context.getResources(), R.drawable.ic_face_3);
        icons[3] = BitmapFactory.decodeResource(context.getResources(), R.drawable.ic_face_4);
        icons[4] = BitmapFactory.decodeResource(context.getResources(), R.drawable.ic_face_5);
        
        iconSize = (int) (24 * context.getResources().getDisplayMetrics().density);
    }

    @Override
    protected void drawYLabels(Canvas c, float fixedPosition, float[] positions, float offset) {
        for (int i = 0; i < mYAxis.mEntryCount; i++) {
            if (i < icons.length && icons[i] != null) {
                float y = positions[i * 2 + 1];
                
                Rect dest = new Rect(
                        (int) (fixedPosition - iconSize - 10),
                        (int) (y - iconSize / 2f),
                        (int) (fixedPosition - 10),
                        (int) (y + iconSize / 2f)
                );
                c.drawBitmap(icons[i], null, dest, mAxisLabelPaint);
            }
        }
    }
}
