#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <react-native-orientation-locker/Orientation.h>
#import "RNSplashScreen.h"  // here



@implementation AppDelegate

- (UIInterfaceOrientationMask)application:(UIApplication *)application supportedInterfaceOrientationsForWindow:(UIWindow *)window {
  return [Orientation getOrientation];
}


- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"Drop Media";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};
  [super application:application didFinishLaunchingWithOptions:launchOptions];
  [RNSplashScreen show];  // here

//  return [super application:application didFinishLaunchingWithOptions:launchOptions];
   return YES;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
