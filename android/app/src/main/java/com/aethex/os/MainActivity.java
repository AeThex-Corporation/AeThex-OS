package com.aethex.os;

import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

public class MainActivity extends BridgeActivity {
	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);

		// Enable fullscreen immersive mode
		enableImmersiveMode();

		// Ensure Firebase is ready before any Capacitor plugin requests it; stay resilient if config is missing
		try {
			if (FirebaseApp.getApps(this).isEmpty()) {
				FirebaseOptions options = null;
				try {
					options = FirebaseOptions.fromResource(this);
				} catch (Exception ignored) {
					// No google-services.json resources, we'll fall back below
				}

				if (options != null) {
					FirebaseApp.initializeApp(getApplicationContext(), options);
				} else {
					// Minimal placeholder so Firebase-dependent plugins don't crash when config is absent
					FirebaseOptions fallback = new FirebaseOptions.Builder()
						.setApplicationId("1:000000000000:android:placeholder")
						.setApiKey("FAKE_API_KEY")
						.setProjectId("aethex-placeholder")
						.build();
					FirebaseApp.initializeApp(getApplicationContext(), fallback);
				}
			}
		} catch (Exception e) {
			Log.w("MainActivity", "Firebase init skipped: " + e.getMessage());
		}
	}

	@Override
	public void onWindowFocusChanged(boolean hasFocus) {
		super.onWindowFocusChanged(hasFocus);
		if (hasFocus) {
			enableImmersiveMode();
		}
	}

	private void enableImmersiveMode() {
		View decorView = getWindow().getDecorView();
		
		// Full immersive mode - hide everything
		WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
		
		WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), decorView);
		if (controller != null) {
			// Hide BOTH status bar and navigation bar completely
			controller.hide(WindowInsetsCompat.Type.systemBars());
			// Swipe from edge to temporarily show bars
			controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
		}

		// Set bars to transparent when they do show
		getWindow().setStatusBarColor(android.graphics.Color.TRANSPARENT);
		getWindow().setNavigationBarColor(android.graphics.Color.TRANSPARENT);

		// Keep screen on + extend into cutout areas
		getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
		
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
			getWindow().getAttributes().layoutInDisplayCutoutMode = 
				WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
		}
	}
}

