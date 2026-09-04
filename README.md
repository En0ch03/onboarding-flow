# Onboarding

A dating app for people who would rather meet the right person than meet a lot of people. This repository holds the onboarding experience: everything a new user sees between opening the app for the first time and reaching their finished profile.

The interface language is Turkish. Turkey is the first market.

## What you need

- **Node.js 20 or newer.** Developed on 24.18.0.
- **A way to see the app:** the Expo Go app on a phone, or an iOS Simulator, or an Android Emulator.

That is the whole list. No Xcode project, no Android Studio, no CocoaPods, no native build, no account, no API key, no `.env` file.

## Running it

Two terminals. In the first:

```bash
npm install
npm run mock
```

`pnpm install` works too if that is your habit; both were run from a clean
checkout before this was written. The committed lockfile is npm's.

In the second:

```bash
npx expo start
```

Then press `i` for the iOS Simulator, `a` for the Android Emulator, or scan the QR code with Expo Go on a phone.

That is all. The app finds the mock server by itself; the next section explains why that matters. On a clean checkout `npm install` takes about a minute, and the first bundle another twenty seconds or so.

### The address, and why you do not have to configure it

This is where local setups usually break, so it is worth a paragraph.

The mock server runs on your development machine, on port 4000. The app runs somewhere else: in a simulator, in an emulator, or on a phone. `localhost` means a different machine in each of those three cases. On a phone it means the phone, and inside an Android emulator it means the emulator, so any address you write down by hand is wrong in at least two of the three.

So the app does not ask. Expo is already serving the JavaScript bundle from your machine, and the app knows the address it is being served from. It reuses that host and swaps in port 4000. The result is correct in all three cases without configuration:

| Where the app runs         | What it resolves to                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------ |
| iOS Simulator              | `http://127.0.0.1:4000/api/v1`                                                                               |
| Android Emulator           | the host Expo reports; if that comes back as loopback, `10.0.2.2`, which is how an emulator reaches its host |
| Physical phone, same Wi-Fi | `http://<your machine's LAN IP>:4000/api/v1`                                                                 |

If you want to point the app somewhere else, at a staging host or a real backend, set `EXPO_PUBLIC_API_URL` and it wins over everything above. `.env.example` shows the shape. Nothing in the app branches on environment; there is one address and one code path.

One requirement remains for the phone case, and it is the only one: the phone and the computer must be on the same network, and the network must allow them to talk to each other. Guest Wi-Fi and client isolation break this. If the app loads but every request fails, that is almost always the cause.

## The mock server

`npm run mock` starts a standalone Express server on port 4000. It implements the six contract endpoints, keeps everything in memory, and forgets it all when you restart it, which is exactly what you want before a demo.

```
POST /api/v1/auth/register        201, or 409 if taken, or 422 with per-field reasons
POST /api/v1/auth/login           200, or 401
POST /api/v1/auth/refresh         200 with a fresh access token, or 401
GET  /api/v1/profile              200
PATCH /api/v1/profile             200; preferences are merged, not replaced
POST /api/v1/onboarding/complete  200
```

Two more endpoints exist that the contract does not define. `GET /api/v1/config/options` serves the option lists, and `POST /api/v1/upload` accepts an image. Both are placeholders for mechanisms that have not been specified yet, and on the app side each one sits behind a single function so that there is exactly one file to change when they are.

There is no mock code inside the app. The app knows a base address and nothing else.

### Injecting faults

Every endpoint can fail, and the interesting parts of an onboarding flow are the parts where it does. Rather than making you restart the server or edit the app, the mock server takes a header, so you can break one request and leave the next one alone:

```bash
curl -H 'x-chaos: 500' http://localhost:4000/api/v1/profile
```

| `x-chaos`      | What happens                                                                                                               |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `500`          | Server error.                                                                                                              |
| `slow`         | The response is never sent, so the client's own timeout has to catch it. Sending a late response would not test a timeout. |
| `malformed`    | A body that does not match the contract, so you can see boundary validation actually fire.                                 |
| `expire-token` | The request succeeds, then the access token is invalidated, so the _next_ request has to be rescued by a silent refresh.   |
| `end-session`  | Both tokens are invalidated: the session really is over, and the app has to end it politely with the draft intact.         |

The header breaks exactly one request, which is what you want from `curl`. But the app does not send that header, deliberately: doing so would ship a dependency on something that will not exist in production. So the header alone cannot reach the app running on a phone.

For that, throw the switch instead. It applies to every request until you turn it off, and you throw it from your machine while the app carries on knowing nothing:

```bash
curl -X POST http://localhost:4000/api/v1/__chaos \
  -H 'content-type: application/json' -d '{"mode":"500"}'

curl -X POST http://localhost:4000/api/v1/__chaos \
  -H 'content-type: application/json' -d '{"mode":"off"}'
```

It takes the same modes. Add `"once": true` to have it fire on a single request and disarm itself. That is the one you want for `expire-token`, where exactly one request should be rescued by a silent refresh rather than all of them.

To reach a token expiry through the app rather than with `curl`, shorten the lifetime instead. It defaults to 900 seconds:

```bash
MOCK_TOKEN_TTL_SECONDS=20 npm run mock
```

On Windows PowerShell:

```powershell
$env:MOCK_TOKEN_TTL_SECONDS = "20"; npm run mock
```

## Checking it

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # jest
```

## How this is built

**Expo, on Expo Go.** The app deliberately stays inside what Expo Go ships, so anyone can run it in a few minutes without a native build. Everything it needs is already there: secure storage, the image picker, image processing, fonts.

The cost of that choice is the keyboard. The library that handles keyboard motion best needs a native build, which would undo the reason for choosing Expo Go in the first place. So keyboard behaviour is solved with core APIs inside a single screen shell that every screen is built within. That makes it one thing to get right and one thing to test by hand, on both platforms, instead of a problem spread across nine screens.

Inside that shell the action button stays at the foot of the page rather than riding above the keyboard. A button that moves every time the keyboard opens puts the target somewhere new under a thumb that was already going somewhere. The requirement the brief actually states is that the keyboard must not cover an input field, and that is what the shell guarantees: the scrollable area shortens by the height of the keyboard, so the focused field stays in view and the button is a scroll away.

**Nothing that can change is hardcoded.** Option lists, their rules and step requirements all come from the server. Gender, intent and interest taxonomies shift over time and by region, and a change to one of them should not require a new app release. The numeric limits that are not taxonomy stay in the app: the photo minimum, the age gate and the password length each sit next to the rule they serve, with the reason written beside them.

That holds in both directions. No option id appears anywhere in the app: an option carries which options it covers, which conditional list it unlocks, and whether its group must be answered, so adding one, renaming one or removing one is a change to the data alone. When an answer the user gave is no longer offered, the app drops it and asks that step again rather than carrying a value nothing on screen can show.

**Nothing that is a date is typed.** Day, month and year are three separate fields, each opening a sheet with only its own question. Nothing about a date is easier on a keyboard, and a keyboard covers half the screen to collect it. The day list is only as long as the chosen month allows, so an impossible date cannot be assembled rather than being refused after the fact. The wheel the two platforms offer natively was not used, because each gives a different one: a rolling wheel on iOS, a calendar dialog on Android, which is two gestures for one question.

**Steps are data, not routes.** The flow is a list the app walks, so inserting a step, reordering two, or making one conditional is an edit to that list rather than a change to the navigator.

**Every response is validated at the boundary.** Bodies are parsed against a schema before they reach application code, so a `null` where an object was expected surfaces as a handled error instead of a crash three screens later.

**Every asynchronous action models four states.** Idle, loading, error, success, none of them skipped. Errors are written for someone who does not know what a status code is, and every one of them offers a way forward.

**A failed save does not stop the flow.** If a step cannot be sent, the user keeps going and the step is remembered as unsent; the app retries before it will let the profile be completed. Losing the connection for a moment should not cost someone their progress or their place.

**Touch is answered, sparingly.** Three moments carry a haptic and nothing else does: a selection changes, a step advances, a step refuses to. Vibrating on every touch turns feedback into noise. A device with no motor, or one whose owner has turned haptics off, loses nothing but the feel.

**Progress survives a restart.** Close the app halfway through and it reopens on the same step, with the answers still in the fields. Tokens live in the device keystore, never in plain storage. Passwords are never stored at all.

## Structure

```
src/api/          the client, endpoints, schemas, the error taxonomy
src/state/        auth and onboarding stores, the boot sequence
src/theme/        design tokens: colour, spacing, type, radius, motion
src/components/   the hand-written UI primitives
src/navigation/   three macro phases: auth, onboarding, app
src/features/     the screens, and the step engine that drives them
mock-server/      a standalone fake API, run separately
design/           the flow diagram, screen sketches and token sheet
assets/           icons and images
```

No UI kit and no onboarding template: the components are written by hand against the design tokens.
