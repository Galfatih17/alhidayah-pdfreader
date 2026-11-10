# Android TWA setup

The app's web content stays at `https://alhidayah-pdfreader.lovable.app`; Bubblewrap packages that published PWA as a Trusted Web Activity. This is separate from the existing Capacitor workflow.

## One-time Android project setup

Use Node.js 18 or newer, Java 17, and Android command-line tools on a computer with Bubblewrap installed:

```sh
npm install --global @bubblewrap/cli@1.27.0
bubblewrap init --manifest=https://alhidayah-pdfreader.lovable.app/manifest.webmanifest --directory=android-twa
```

Confirm the app values shown by Bubblewrap, use package ID `com.alhidayah.pdfreader`, and use key alias `android`. Create and protect a release signing key when prompted. Keep the generated `android-twa/android.keystore` private; `android-twa/.gitignore` excludes it. Commit the generated Android project files and the updated `android-twa/twa-manifest.json`, but never commit the keystore or its passwords.

## Connect GitHub Actions signing secrets

Add these repository Actions secrets in GitHub:

- `TWA_KEYSTORE_BASE64`: Base64-encoded contents of `android-twa/android.keystore`.
- `TWA_KEYSTORE_PASSWORD`: keystore password.
- `TWA_KEY_PASSWORD`: signing key password.

To prepare the encoded keystore value locally, run `base64 < android-twa/android.keystore` and paste its output directly into the GitHub secret. Do not paste it into chat or commit it. Then run **Build Android TWA** from the Actions tab; the workflow returns a signed APK for testing and an AAB for Play Console.

## Verify the app opens without browser controls

Digital Asset Links must contain the SHA-256 fingerprint of the same signing certificate used by the APK. Until that fingerprint is added, `public/.well-known/assetlinks.json` is intentionally an empty array and Android may open the site with browser controls.

Get the fingerprint using:

```sh
keytool -list -v -keystore android-twa/android.keystore -alias android
```

Replace the empty array in `public/.well-known/assetlinks.json` with the following structure, using the exact SHA-256 fingerprint printed by `keytool`:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.alhidayah.pdfreader",
      "sha256_cert_fingerprints": ["PASTE_REAL_SHA256_FINGERPRINT_HERE"]
    }
  }
]
```

Publish the website change, then confirm that `https://alhidayah-pdfreader.lovable.app/.well-known/assetlinks.json` returns that JSON. Do not leave the example fingerprint text in the published file. Keep the same signing key for future APK updates; changing it requires updating Digital Asset Links and may prevent updates over an existing installation.