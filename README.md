# Onboarding

A dating app for people who would rather meet the right person than meet a lot of people. This repository holds the onboarding experience: everything a new user sees between opening the app for the first time and reaching their finished profile.

The interface language is Turkish — Turkey is the first market.

## Status

Early. The project skeleton is in place; screens land branch by branch.

## Requirements

- Node.js 20 or newer
- The Expo Go app on a physical phone, or an iOS Simulator / Android Emulator

## Running it

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go, or press `i` / `a` to open a simulator. No native toolchain is needed — no Xcode, no Android Studio, no CocoaPods.

## How this is built

**Expo, on Expo Go.** The app deliberately stays inside what Expo Go ships, so anyone can run it in under five minutes without a native build. Everything it needs — secure storage, the image picker, the keyboard controller — is already there.

**Nothing that can change is hardcoded.** Option lists, numeric thresholds and step requirements all come from the server. Gender, intent and interest taxonomies shift over time and by region, and a change to one of them should not require a new app release.

**Every answer is validated at the boundary.** Responses are parsed before they reach application code, so a `null` where an object was expected surfaces as a handled error rather than a crash.

**Every asynchronous action models four states.** Idle, loading, error, success — none of them skipped, and every error carries a way out written in plain language.

**Progress survives a restart.** Close the app halfway through onboarding and it reopens where it left off, with the answers intact.

## Structure

```
src/        application code
assets/     fonts, icons, images
design/     sketches and flow diagrams
mock-server/ a standalone fake API for local development
```

The app itself knows only a `BASE_URL`. There is no mock branch inside the application.
