package io.dropwireless.dropmedia;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
// import com.facebook.react.ReactRootView;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;
import android.os.Bundle;
import org.devio.rn.splashscreen.SplashScreen; // here
import android.content.Intent;
import android.content.res.Configuration;


public class MainActivity extends ReactActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    SplashScreen.show(this);  // here
    super.onCreate(null);
  }

  @Override
  public void onConfigurationChanged(Configuration newConfig) {
    super.onConfigurationChanged(newConfig);
    Intent intent = new Intent("onConfigurationChanged");
    intent.putExtra("newConfig", newConfig);
    this.sendBroadcast(intent);
  }


  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "Drop Media";
  }

  /**
   * Returns the instance of the {@link ReactActivityDelegate}. Here we use a util class {@link
   * DefaultReactActivityDelegate} which allows you to easily enable Fabric and Concurrent React
   * (aka React 18) with two boolean flags.
   */
  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    // return new MainActivityDelegate(this, getMainComponentName());
    return new DefaultReactActivityDelegate(
        this,
        getMainComponentName(),
        // If you opted-in for the New Architecture, we enable the Fabric Renderer.
        DefaultNewArchitectureEntryPoint.getFabricEnabled());
  }

  // public static class MainActivityDelegate extends ReactActivityDelegate {
  //   public MainActivityDelegate(ReactActivity activity, String mainComponentName) {
  //     super(activity, mainComponentName);
  //   }

  //   @Override
  //   protected ReactRootView createRootView() {
  //     ReactRootView reactRootView = new ReactRootView(getContext());
  //     // If you opted-in for the New Architecture, we enable the Fabric Renderer.
  //     reactRootView.setIsFabric(BuildConfig.IS_NEW_ARCHITECTURE_ENABLED);
  //     return reactRootView;
  //   }

  //   @Override
  //   protected boolean isConcurrentRootEnabled() {
  //     // If you opted-in for the New Architecture, we enable Concurrent Root (i.e. React 18).
  //     // More on this on https://reactjs.org/blog/2022/03/29/react-v18.html
  //     return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
  //   }
  // }
}
