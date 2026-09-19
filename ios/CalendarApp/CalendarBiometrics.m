#import <React/RCTBridgeModule.h>
#import <LocalAuthentication/LocalAuthentication.h>

@interface CalendarBiometrics : NSObject <RCTBridgeModule>
@property(nonatomic, strong) LAContext *context;
@property(nonatomic, copy) RCTPromiseResolveBlock pending;
@end

@implementation CalendarBiometrics
RCT_EXPORT_MODULE();
+ (BOOL)requiresMainQueueSetup { return YES; }
- (dispatch_queue_t)methodQueue { return dispatch_get_main_queue(); }

RCT_REMAP_METHOD(availability, availabilityWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  LAContext *context = [LAContext new];
  NSError *error = nil;
  if (![context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics error:&error]) {
    resolve([NSNull null]);
    return;
  }
  resolve(context.biometryType == LABiometryTypeFaceID ? @"Face ID" : @"Touch ID");
}

RCT_REMAP_METHOD(authenticate, authenticateWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  if (self.pending) {
    reject(@"E_BUSY", @"Authentication is already running.", nil);
    return;
  }
  LAContext *context = [LAContext new];
  // New context, no reuse of an earlier successful device unlock.
  context.touchIDAuthenticationAllowableReuseDuration = 0;
  context.localizedFallbackTitle = @"";
  context.localizedCancelTitle = @"Cancel";
  NSError *error = nil;
  if (![context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics error:&error]) {
    reject(@"E_UNAVAILABLE", @"Biometrics are unavailable or not enrolled.", error);
    return;
  }
  self.context = context;
  self.pending = resolve;
  [context evaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics
         localizedReason:@"Unlock your calendar"
                   reply:^(BOOL success, NSError *error) {
    dispatch_async(dispatch_get_main_queue(), ^{
      if (self.context != context) { return; }
      self.context = nil;
      self.pending = nil;
      if (success) { resolve(@YES); }
      else if (error.code == LAErrorUserCancel || error.code == LAErrorAppCancel || error.code == LAErrorSystemCancel) { resolve(@NO); }
      else { reject(@"E_BIOMETRIC", @"Biometric authentication failed. Use your password or try again.", error); }
    });
  }];
}

RCT_EXPORT_METHOD(cancel) {
  LAContext *context = self.context;
  RCTPromiseResolveBlock resolve = self.pending;
  self.context = nil;
  self.pending = nil;
  [context invalidate];
  if (resolve) { resolve(@NO); }
}

- (void)invalidate {
  dispatch_async(dispatch_get_main_queue(), ^{ [self cancel]; });
}
@end
