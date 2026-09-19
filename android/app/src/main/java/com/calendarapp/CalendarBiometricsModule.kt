package com.calendarapp

import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.ViewManager

class CalendarBiometricsModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  private var pending: Promise? = null
  private var prompt: BiometricPrompt? = null
  override fun getName() = "CalendarBiometrics"

  @ReactMethod
  fun availability(promise: Promise) {
    val available = BiometricManager.from(reactApplicationContext)
      .canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)
    promise.resolve(if (available == BiometricManager.BIOMETRIC_SUCCESS) "Biometrics" else null)
  }

  @ReactMethod
  fun authenticate(promise: Promise) {
    UiThreadUtil.runOnUiThread {
      if (pending != null) {
        promise.reject("E_BUSY", "Authentication is already running.")
        return@runOnUiThread
      }
      val activity = reactApplicationContext.currentActivity as? FragmentActivity
      if (activity == null || activity.isFinishing) {
        promise.reject("E_UNAVAILABLE", "No foreground activity.")
        return@runOnUiThread
      }
      pending = promise
      try {
        prompt = BiometricPrompt(activity, ContextCompat.getMainExecutor(activity),
          object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
              if (pending !== promise) return
              finish(true)
            }
            override fun onAuthenticationError(code: Int, message: CharSequence) {
              if (pending !== promise) return
              if (code == BiometricPrompt.ERROR_USER_CANCELED || code == BiometricPrompt.ERROR_NEGATIVE_BUTTON || code == BiometricPrompt.ERROR_CANCELED) {
                finish(false)
              } else {
                val request = pending
                pending = null
                prompt = null
                request?.reject("E_BIOMETRIC", "Biometric authentication is unavailable or locked out.")
              }
            }
            // A mismatch leaves the native dialog open for another attempt.
          })
        prompt!!.authenticate(BiometricPrompt.PromptInfo.Builder()
          .setTitle("Unlock Calendar")
          .setSubtitle("Confirm your identity to continue")
          .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)
          .setNegativeButtonText("Cancel")
          .build())
      } catch (error: Exception) {
        pending = null
        prompt = null
        promise.reject("E_BIOMETRIC", "Biometric authentication could not start.", error)
      }
    }
  }

  private fun finish(success: Boolean) {
    val request = pending
    pending = null
    prompt = null
    request?.resolve(success)
  }

  @ReactMethod
  fun cancel() {
    UiThreadUtil.runOnUiThread {
      val activePrompt = prompt
      finish(false)
      activePrompt?.cancelAuthentication()
    }
  }

  override fun invalidate() {
    cancel()
    super.invalidate()
  }
}

class CalendarBiometricsPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(CalendarBiometricsModule(context))
  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
