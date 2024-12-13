package com.reactnativemaps

import android.os.PowerManager
import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class BatteryStatusModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String {
        return "BatteryStatusModule"
    }

    @ReactMethod
    fun getBatteryOptimizationStatus(promise: Promise) {
        try {
            val powerManager = reactApplicationContext.getSystemService(Context.POWER_SERVICE) as PowerManager
            val isPowerSaveMode = powerManager.isPowerSaveMode
            promise.resolve(isPowerSaveMode)
        } catch (e: Exception) {
            promise.reject("BATTERY_STATUS_ERROR", e.message)
        }
    }
}