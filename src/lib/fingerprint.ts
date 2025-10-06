// 🛡️ DEVICE FINGERPRINTING - Anti-Multi-Accounting
// Uses FingerprintJS to generate unique device identifier

import FingerprintJS from '@fingerprintjs/fingerprintjs';

let fpPromise: Promise<any> | null = null;

/**
 * Initialize FingerprintJS (call once on app load)
 */
export async function initFingerprint() {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load();
  }
  return fpPromise;
}

/**
 * Get device fingerprint (unique browser/device ID)
 * @returns Promise<string> - Fingerprint hash
 */
export async function getDeviceFingerprint(): Promise<string> {
  try {
    const fp = await initFingerprint();
    const result = await fp.get();
    return result.visitorId; // Unique visitor ID
  } catch (error) {
    console.error('Fingerprint error:', error);
    return 'unknown'; // Fallback if fingerprinting fails
  }
}

/**
 * Get detailed device info (for admin debugging)
 */
export async function getDeviceDetails(): Promise<{
  fingerprint: string;
  components: Record<string, any>;
}> {
  try {
    const fp = await initFingerprint();
    const result = await fp.get();
    
    return {
      fingerprint: result.visitorId,
      components: result.components, // Browser, OS, screen resolution, etc.
    };
  } catch (error) {
    console.error('Device details error:', error);
    return {
      fingerprint: 'unknown',
      components: {},
    };
  }
}
