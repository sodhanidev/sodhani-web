# Mobile Auth Integration Spec

Audience: mobile frontend developer or mobile coding agent.

Goal: implement mobile login using the existing Sodhani backend. Mobile must support:

1. MSG91 OTP login
2. Google login
3. Shared Mongo-backed user/session state

Important rule: the mobile app must not connect to MongoDB directly. The mobile app calls the backend API. The backend writes to MongoDB.

## 1. Architecture

```text
Mobile app
  -> calls Sodhani backend auth endpoints
  -> receives sessionToken
  -> stores sessionToken securely
  -> sends Authorization: Bearer <sessionToken>

Sodhani backend
  -> verifies MSG91 OTP or Google ID token
  -> writes users/auth_sessions into MongoDB
  -> returns app sessionToken for mobile

MongoDB
  -> same database for web and mobile auth
```

## 2. Backend Base URL

Use the deployed Sodhani backend URL in production.

Local examples:

| Environment | Base URL |
| --- | --- |
| Web/local machine | `http://localhost:3000` |
| iOS Simulator | `http://localhost:3000` usually works |
| Android Emulator | `http://10.0.2.2:3000` |
| Physical device | `http://<laptop-lan-ip>:3000`, for example `http://192.168.1.12:3000` |

All endpoint paths below are relative to this base URL.

## 3. Backend Env Keys

These keys are configured on the backend. Mention them to the deployment/backend agent exactly as written.

| Key | Required | Who uses it | Secret? | Purpose |
| --- | --- | --- | --- | --- |
| `MONGODB_URI` | yes | backend only | yes | MongoDB connection string for the shared auth DB |
| `MONGODB_DB` | yes | backend only | no | Mongo database name, currently `sodhani` |
| `MSG91_AUTH_KEY` | yes for OTP | backend only | yes | Server-side MSG91 auth key |
| `MSG91_WIDGET_ID` | yes for OTP | backend only | no-ish | MSG91 OTP widget id |
| `GOOGLE_CLIENT_ID` | yes for Google | backend and web OAuth | no | Google web OAuth client id |
| `GOOGLE_CLIENT_SECRET` | yes for Google web callback | backend only | yes | Google web OAuth client secret |
| `GOOGLE_REDIRECT_URI` | yes for Google web callback | backend only | no | Web OAuth callback URL |
| `GOOGLE_ALLOWED_CLIENT_IDS` | yes for mobile Google | backend only | no | Comma-separated Android/iOS Google client IDs accepted by backend |
| `AUTH_SESSION_COOKIE` | optional | backend web cookies | no | Cookie name, default `sodhani_session` |
| `AUTH_SESSION_DAYS` | optional | backend sessions | no | Session lifetime in days, default `30` |

Current `.env.example`:

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/sodhani
MONGODB_DB=sodhani

MSG91_AUTH_KEY=your_msg91_private_auth_key
MSG91_WIDGET_ID=your_msg91_otp_widget_id

GOOGLE_CLIENT_ID=your_google_web_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_web_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback/
GOOGLE_ALLOWED_CLIENT_IDS=

AUTH_SESSION_COOKIE=sodhani_session
AUTH_SESSION_DAYS=30
```

Mobile app must never bundle:

| Forbidden in mobile bundle |
| --- |
| `MONGODB_URI` |
| `MSG91_AUTH_KEY` |
| `GOOGLE_CLIENT_SECRET` |

Mobile app may contain:

| Allowed in mobile bundle | Notes |
| --- | --- |
| Google Android client ID | Needed by native Google SDK |
| Google iOS client ID | Needed by native Google SDK |
| MSG91 mobile SDK widget/token values | Only if using MSG91 SDK path |

## 4. Google Client IDs

The backend verifies Google ID tokens using:

```env
GOOGLE_CLIENT_ID=<web-client-id>
GOOGLE_ALLOWED_CLIENT_IDS=<android-client-id>,<ios-client-id>
```

Rules:

1. `GOOGLE_CLIENT_ID` is the web client ID.
2. Android/iOS client IDs must be added to `GOOGLE_ALLOWED_CLIENT_IDS`.
3. Backend accepts Google ID tokens only when the token `aud` matches one of these IDs.
4. Mobile must send the Google ID token to the backend; mobile must not create an app session locally.

Example:

```env
GOOGLE_CLIENT_ID=123-web.apps.googleusercontent.com
GOOGLE_ALLOWED_CLIENT_IDS=456-android.apps.googleusercontent.com,789-ios.apps.googleusercontent.com
```

## 5. MongoDB Collections

Database name: value of `MONGODB_DB`, currently `sodhani`.

The backend creates indexes automatically when auth endpoints run.

### 5.1 `users`

Purpose: one collection for all accounts, web and mobile.

Phone OTP user fields:

| Field | Type | Required | Example | Notes |
| --- | --- | --- | --- | --- |
| `_id` | `ObjectId` | yes | `ObjectId("...")` | Mongo id |
| `phoneE164` | `string` | OTP users | `+919876543210` | Unique when present |
| `phoneNational` | `string` | OTP users | `9876543210` | India 10-digit mobile |
| `displayName` | `string` | no | `Anant` | Optional |
| `createdAt` | `Date` | yes | `2026-06-07T...Z` | Created time |
| `updatedAt` | `Date` | yes | `2026-06-07T...Z` | Last updated |
| `lastLoginAt` | `Date` | no | `2026-06-07T...Z` | Last auth time |

Google user fields:

| Field | Type | Required | Example | Notes |
| --- | --- | --- | --- | --- |
| `_id` | `ObjectId` | yes | `ObjectId("...")` | Mongo id |
| `email` | `string` | Google users | `user@gmail.com` | Original email |
| `emailNorm` | `string` | Google users | `user@gmail.com` | Lowercased unique key |
| `googleSub` | `string` | Google users | `110248...` | Google stable subject id, unique |
| `displayName` | `string` | no | `User Name` | From Google profile |
| `avatarUrl` | `string` | no | `https://...` | From Google profile |
| `createdAt` | `Date` | yes | `2026-06-07T...Z` | Created time |
| `updatedAt` | `Date` | yes | `2026-06-07T...Z` | Last updated |
| `lastLoginAt` | `Date` | no | `2026-06-07T...Z` | Last auth time |

Indexes:

| Index name | Keys | Unique | Condition |
| --- | --- | --- | --- |
| `users_phoneE164_unique` | `{ phoneE164: 1 }` | yes | only when `phoneE164` is string |
| `users_emailNorm_unique` | `{ emailNorm: 1 }` | yes | only when `emailNorm` is string |
| `users_googleSub_unique` | `{ googleSub: 1 }` | yes | only when `googleSub` is string |

User upsert rules:

| Auth method | Lookup/upsert key |
| --- | --- |
| MSG91 OTP | `phoneE164` |
| Google | `googleSub` OR `emailNorm` |

### 5.2 `otp_challenges`

Purpose: records backend-created MSG91 OTP requests.

| Field | Type | Required | Example | Notes |
| --- | --- | --- | --- | --- |
| `_id` | `ObjectId` | yes | `ObjectId("...")` | Mongo id |
| `phoneE164` | `string` | yes | `+919876543210` | Normalized phone |
| `phoneNational` | `string` | yes | `9876543210` | 10-digit phone |
| `msg91Identifier` | `string` | yes | `919876543210` | No plus sign |
| `reqId` | `string` | yes | `MSG91_REQUEST_ID` | Returned by MSG91 |
| `createdAt` | `Date` | yes | `2026-06-07T...Z` | Created time |
| `expiresAt` | `Date` | yes | `2026-06-07T...Z` | TTL expiry |
| `consumedAt` | `Date` | no | `2026-06-07T...Z` | Set after successful verify |
| `attempts` | `number` | no | `1` | Incremented on verify attempts |
| `status` | `"sent" | "verified"` | yes | `sent` | OTP state |

Indexes:

| Keys | Type | Purpose |
| --- | --- | --- |
| `{ expiresAt: 1 }` | TTL `expireAfterSeconds: 0` | Auto-delete expired OTPs |
| `{ phoneE164: 1, createdAt: -1 }` | normal | Lookup/rate limiting |

### 5.3 `auth_sessions`

Purpose: app sessions for web and mobile.

Mobile receives the raw `sessionToken`. Mongo stores only `sha256(sessionToken)` in `tokenHash`.

| Field | Type | Required | Example | Notes |
| --- | --- | --- | --- | --- |
| `_id` | `ObjectId` | yes | `ObjectId("...")` | Mongo id |
| `userId` | `ObjectId` | yes | `ObjectId("...")` | References `users._id` |
| `tokenHash` | `string` | yes | `sha256 hex` | Unique hash of raw session token |
| `createdAt` | `Date` | yes | `2026-06-07T...Z` | Created time |
| `expiresAt` | `Date` | yes | `2026-07-07T...Z` | Session expiry |
| `lastSeenAt` | `Date` | yes | `2026-06-07T...Z` | Updated by `/api/auth/me/` |
| `revokedAt` | `Date` | no | `2026-06-07T...Z` | Set on logout |
| `userAgent` | `string` | no | `Sodhani iOS/1.0` | From request |
| `ip` | `string` | no | `203.0.113.10` | From request headers |

Indexes:

| Keys | Unique | Type | Purpose |
| --- | --- | --- | --- |
| `{ tokenHash: 1 }` | yes | normal | Session lookup |
| `{ expiresAt: 1 }` | no | TTL `expireAfterSeconds: 0` | Auto-delete expired sessions |
| `{ userId: 1, expiresAt: 1 }` | no | normal | User session lookup |

## 6. Shared Response Types

### 6.1 Auth user

```ts
type AuthUser = {
  id: string;
  phoneE164?: string;
  phoneNational?: string;
  email?: string;
  avatarUrl?: string;
  displayName?: string;
};
```

### 6.2 Mobile auth success

Mobile auth endpoints return `sessionToken` only when request body includes:

```json
{ "clientType": "mobile" }
```

Success response shape:

```ts
type MobileAuthSuccess = {
  ok: true;
  user: AuthUser;
  sessionToken: string;
  expiresAt: string; // ISO date
};
```

### 6.3 Error

```ts
type AuthError = {
  error: string;
};
```

Mobile should show `error` in a user-friendly way.

## 7. Session Token Rules

Mobile must store `sessionToken` in secure storage.

| Platform | Recommended storage |
| --- | --- |
| iOS native | Keychain |
| Android native | EncryptedSharedPreferences or Keystore-backed storage |
| React Native | Keychain/SecureStore equivalent |
| Flutter | `flutter_secure_storage` or equivalent |

All authenticated requests:

```http
Authorization: Bearer <sessionToken>
```

On app launch:

1. Read `sessionToken` from secure storage.
2. If missing, show signed-out state.
3. If present, call `GET /api/auth/me/`.
4. If user is null or request fails with auth-related error, delete local token and show signed-out state.

## 8. Endpoint Summary

| Flow | Method | Path | Auth header? | Body |
| --- | --- | --- | --- | --- |
| OTP send | `POST` | `/api/auth/otp/send/` | no | `{ phone }` |
| OTP verify | `POST` | `/api/auth/otp/verify/` | no | `{ phone, reqId, otp, name?, clientType: "mobile" }` |
| MSG91 SDK complete | `POST` | `/api/auth/msg91/complete/` | no | `{ accessToken, phone?, name?, clientType: "mobile" }` |
| Google native complete | `POST` | `/api/auth/google/complete/` | no | `{ idToken, nonce?, clientType: "mobile" }` |
| Current user | `GET` | `/api/auth/me/` | yes | none |
| Logout | `POST` | `/api/auth/logout/` | yes | none |

## 9. MSG91 OTP Flow

Recommended path: use backend send/verify endpoints. This keeps MSG91 secrets out of the app.

MSG91 widget requirement for this backend flow:

| Widget setting | Required value |
| --- | --- |
| Captcha / reCAPTCHA | Off |
| Invisible OTP | Off |
| Contact point | Mobile number |
| OTP length | 4 digits |
| Identifier format | Country code without plus, backend sends `91XXXXXXXXXX` |

Reason: MSG91's direct OTP Widget API accepts `widgetId` and `identifier`; captcha validation is not supported by that API path.

### 9.1 Send OTP

Request:

```http
POST /api/auth/otp/send/
Content-Type: application/json
```

```json
{
  "phone": "9876543210"
}
```

Accepted phone formats:

| Input | Accepted |
| --- | --- |
| `9876543210` | yes |
| `+919876543210` | yes |
| `919876543210` | yes |
| `1234567890` | no |

Success:

```json
{
  "ok": true,
  "reqId": "msg91-request-id",
  "phone": "+91 98••••3210"
}
```

Mobile state after success:

| State key | Value |
| --- | --- |
| `phone` | original user input or normalized local value |
| `reqId` | response `reqId` |
| `maskedPhone` | response `phone` |

### 9.2 Verify OTP

Request:

```http
POST /api/auth/otp/verify/
Content-Type: application/json
```

```json
{
  "phone": "9876543210",
  "reqId": "msg91-request-id",
  "otp": "1234",
  "name": "Optional Name",
  "clientType": "mobile"
}
```

Success:

```json
{
  "ok": true,
  "user": {
    "id": "mongo-object-id",
    "phoneE164": "+919876543210",
    "phoneNational": "9876543210",
    "displayName": "Optional Name"
  },
  "sessionToken": "raw-app-session-token",
  "expiresAt": "2026-07-07T12:00:00.000Z"
}
```

Mobile action after success:

1. Store `sessionToken` securely.
2. Store/cache `user` in app state.
3. Navigate to signed-in app.

### 9.3 MSG91 SDK Alternative

Only use this if the app wants MSG91's native SDK.

After the SDK verifies OTP and returns an MSG91 access token:

```http
POST /api/auth/msg91/complete/
Content-Type: application/json
```

```json
{
  "accessToken": "msg91-verified-access-token",
  "phone": "9876543210",
  "name": "Optional Name",
  "clientType": "mobile"
}
```

Success response is the same as OTP verify.

Security rule: mobile may use MSG91 SDK widget/token config, but must never include `MSG91_AUTH_KEY`.

## 10. Google Mobile Flow

Recommended path: native Google SDK in the mobile app, then backend completion.

### 10.1 Mobile SDK setup

Mobile app needs platform Google client IDs from Google Cloud:

| Platform | Mobile needs | Backend env also needs |
| --- | --- | --- |
| Android | Android Google client ID | Add to `GOOGLE_ALLOWED_CLIENT_IDS` |
| iOS | iOS Google client ID | Add to `GOOGLE_ALLOWED_CLIENT_IDS` |

### 10.2 Get Google ID token

Use the native Google Sign-In SDK and request an ID token.

Mobile must send the ID token to the backend. Do not trust the Google profile locally as an app login until backend returns `sessionToken`.

### 10.3 Complete Google login

Request:

```http
POST /api/auth/google/complete/
Content-Type: application/json
```

```json
{
  "idToken": "google-id-token-from-native-sdk",
  "clientType": "mobile"
}
```

If the mobile SDK uses a nonce:

```json
{
  "idToken": "google-id-token-from-native-sdk",
  "nonce": "same-nonce-used-in-google-request",
  "clientType": "mobile"
}
```

Success:

```json
{
  "ok": true,
  "user": {
    "id": "mongo-object-id",
    "email": "user@gmail.com",
    "avatarUrl": "https://...",
    "displayName": "User Name"
  },
  "sessionToken": "raw-app-session-token",
  "expiresAt": "2026-07-07T12:00:00.000Z"
}
```

Backend validates:

| Google token claim | Validation |
| --- | --- |
| signature | verified against Google JWKS |
| `iss` | must be `https://accounts.google.com` or `accounts.google.com` |
| `aud` | must match `GOOGLE_CLIENT_ID` or one entry in `GOOGLE_ALLOWED_CLIENT_IDS` |
| `exp` | must not be expired |
| `email_verified` | must be true |
| `nonce` | checked if request includes `nonce` |

## 11. Current User

Request:

```http
GET /api/auth/me/
Authorization: Bearer <sessionToken>
```

Success when signed in:

```json
{
  "ok": true,
  "user": {
    "id": "mongo-object-id",
    "phoneE164": "+919876543210",
    "phoneNational": "9876543210",
    "email": "optional@example.com",
    "avatarUrl": "https://...",
    "displayName": "Optional Name"
  }
}
```

Signed out:

```json
{
  "ok": true,
  "user": null
}
```

## 12. Logout

Request:

```http
POST /api/auth/logout/
Authorization: Bearer <sessionToken>
```

Success:

```json
{
  "ok": true
}
```

Mobile action:

1. Call logout.
2. Delete local `sessionToken`.
3. Clear local user state.
4. Navigate to signed-out screen.

If logout request fails because the token is already expired/invalid, still delete local token.

## 13. Required Mobile Screens/States

Implement these states:

| Screen/state | Required behavior |
| --- | --- |
| Signed out | Show Google login and phone OTP login |
| Phone input | Collect Indian mobile number |
| OTP input | Collect OTP after `/otp/send/` succeeds |
| Loading | Disable repeated submit while request is in flight |
| Error | Show backend `error` text in friendly copy |
| Signed in | Store user and token, navigate to app |
| App launch hydration | Call `/api/auth/me/` when token exists |
| Logout | Call `/api/auth/logout/`, remove token |

## 14. Exact Prompt For Mobile Coding Agent

```text
Implement Sodhani mobile auth using the existing backend.

Backend base URL: <insert backend URL>.

Never connect directly to MongoDB from mobile.
Never include MONGODB_URI, MSG91_AUTH_KEY, or GOOGLE_CLIENT_SECRET in the mobile app.

Use secure device storage for sessionToken.

Implement OTP:
1. POST /api/auth/otp/send/ with { phone }.
2. Save response reqId in local state.
3. POST /api/auth/otp/verify/ with { phone, reqId, otp, name?, clientType: "mobile" }.
4. Save response sessionToken securely.
5. Save response user in app auth state.

Implement Google:
1. Use native Google Sign-In SDK to get idToken.
2. POST /api/auth/google/complete/ with { idToken, nonce?, clientType: "mobile" }.
3. Save response sessionToken securely.
4. Save response user in app auth state.

For authenticated calls, send:
Authorization: Bearer <sessionToken>

On app launch:
1. Read sessionToken from secure storage.
2. If present, call GET /api/auth/me/ with bearer token.
3. If user is returned, hydrate auth state.
4. If user is null or request fails, delete token and show signed-out state.

On logout:
1. POST /api/auth/logout/ with bearer token.
2. Delete local token.
3. Clear auth state.

Expected user type:
{
  id: string;
  phoneE164?: string;
  phoneNational?: string;
  email?: string;
  avatarUrl?: string;
  displayName?: string;
}

Handle API errors shaped as:
{ error: string }
```

## 15. Backend Files For Reference

| Concern | File |
| --- | --- |
| Env config | `src/lib/auth/config.ts` |
| Mongo connection/indexes | `src/lib/auth/mongo.ts` |
| Session/user writes | `src/lib/auth/session.ts` |
| MSG91 calls | `src/lib/auth/msg91.ts` |
| Google token verification | `src/lib/auth/google.ts` |
| OTP send route | `src/app/api/auth/otp/send/route.ts` |
| OTP verify route | `src/app/api/auth/otp/verify/route.ts` |
| MSG91 SDK completion route | `src/app/api/auth/msg91/complete/route.ts` |
| Google mobile completion route | `src/app/api/auth/google/complete/route.ts` |
| Current user route | `src/app/api/auth/me/route.ts` |
| Logout route | `src/app/api/auth/logout/route.ts` |

## 16. External Docs

- MSG91 OTP Widget send API: https://docs.msg91.com/otp-widget/send-otp-1
- MSG91 OTP Widget integration guide: https://msg91.com/help/sendotp/how-to-integrate-the-new-login-with-otp-widget
- Google OpenID Connect ID token validation: https://developers.google.com/identity/openid-connect/openid-connect
- Google OAuth web-server flow: https://developers.google.com/identity/protocols/oauth2/web-server
