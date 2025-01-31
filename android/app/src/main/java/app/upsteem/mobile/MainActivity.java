package app.upsteem.mobile;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;
import android.content.Intent;
import android.content.res.Configuration;
import android.os.Bundle;
import com.zoontek.rnbootsplash.RNBootSplash;

public class MainActivity extends ReactActivity {
  /**
   * Returns the name of the main component registered from JavaScript. This is
   * used to schedule rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "upsteem";
  }

  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new MainActivityDelegate(this, getMainComponentName());
  }

  @Override
  public void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    setIntent(intent);
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    RNBootSplash.init(this); // <- initialize the splash screen
    super.onCreate(null); //https://stackoverflow.com/questions/57709742/unable-to-instantiate-fragment-com-swmansion-rnscreens-screen
  }

  //native side reference: https://github.com/facebook/react-native/issues/28823#issuecomment-642032481
  @Override
  public void onConfigurationChanged(Configuration newConfig) {
    super.onConfigurationChanged(newConfig);
    getReactInstanceManager().onConfigurationChanged(this, newConfig);
    Intent intent = new Intent("onConfigurationChanged");
    intent.putExtra("newConfig", newConfig);
    this.sendBroadcast(intent);   
  }


    public static class MainActivityDelegate extends ReactActivityDelegate {
      public MainActivityDelegate(ReactActivity activity, String mainComponentName) {
        super(activity, mainComponentName);
      }

      @Override
      protected ReactRootView createRootView() {
        ReactRootView reactRootView = new ReactRootView(getContext());
        // If you opted-in for the New Architecture, we enable the Fabric Renderer.
        reactRootView.setIsFabric(BuildConfig.IS_NEW_ARCHITECTURE_ENABLED);
        return reactRootView;
      }

      @Override
      protected boolean isConcurrentRootEnabled() {
        // If you opted-in for the New Architecture, we enable Concurrent Root (i.e. React 18).
        // More on this on https://reactjs.org/blog/2022/03/29/react-v18.html
        return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
      }
  }
}
