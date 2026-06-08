# E-KYC Flow for Sodhani

Last researched: 2026-06-08  
Scope: India-focused stock research / investing app

This is an engineering/product note, not legal advice. Production launch needs sign-off from the SEBI-registered entity or compliance counsel.

## Recommendation

Use a managed India KYC provider. Do not directly stitch together DigiLocker, UIDAI, CKYC, KRA, PAN, bank verification, video KYC, and eSign yourself.

Best default stack:

| Layer | Use |
| --- | --- |
| KYC orchestration | IDfy, HyperVerge, Signzy, Decentro, Digio, Karza, or similar |
| Identity documents | DigiLocker as default, UIDAI offline Aadhaar XML as fallback |
| Securities KYC | KRA check/upload plus CKYC search/download/upload where required |
| PAN | Provider-backed PAN verification and name/DOB match |
| Bank | Penny-drop, account-name match, or PAN-bank linkage |
| IPV/liveness | Vendor-hosted selfie liveness or video IPV |
| Signature | CCA-backed Aadhaar eSign via vendor/eSign provider |
| Storage | MongoDB for status, references, consents, audit trail; encrypted object storage for required documents |

For fastest secure launch: pick one hosted vendor flow from IDfy/HyperVerge/Signzy. Use Decentro/Digio/Karza style APIs only if Sodhani wants to own the entire UX and compliance ops.

## Product rule

Do not collect full KYC unless the product actually needs it.

| Product mode | KYC level |
| --- | --- |
| Free screener, watchlist, education | No full e-KYC. Normal auth is enough. |
| Paid SEBI Research Analyst service | KYC required for fee-paying clients. Use KRA/KYC process and signed client terms. |
| Trading/demat/broker onboarding | Full regulated onboarding. Must be handled by a SEBI-registered broker/DP or partner. |

So for Sodhani:

1. Keep normal login for free users.
2. Trigger e-KYC only before paid RA, advisory, demat, broker, or regulated investing flows.
3. Let the KYC vendor host sensitive document/liveness/eSign screens.
4. Store minimum status and references in Sodhani.

## Standard flow

### 1. Start KYC

Frontend calls backend:

```text
POST /api/kyc/session
```

Backend creates a KYC case and asks the vendor for a hosted SDK/redirect session.

Frontend/mobile receives:

```ts
{
  kycCaseId: string,
  providerSessionId: string,
  redirectUrl?: string,
  sdkToken?: string
}
```

Never expose vendor API secrets to web/mobile.

### 2. Consent

Show one short consent screen before vendor handoff:

- Why KYC is needed.
- Data requested: PAN, DigiLocker documents, CKYC/KRA, bank, liveness/video, eSign.
- Providers involved.
- Privacy policy link.

Store consent version, timestamp, IP, user agent, and device ID.

### 3. PAN first

Collect PAN + DOB first.

Backend/vendor verifies:

- PAN validity/status.
- Name and DOB match.
- PAN-Aadhaar seeding/operative status if required.
- KRA and CKYC lookup using PAN.

If existing KRA/CKYC is valid, prefill and avoid fresh document collection where allowed.

### 4. DigiLocker document fetch

Default path:

1. User opens vendor-hosted DigiLocker flow.
2. User logs into DigiLocker.
3. User gives explicit consent.
4. Vendor fetches issued documents directly from DigiLocker.
5. Vendor sends results to backend via signed webhook.

Use issued/API-fetched documents, not random uploaded PDFs.

Fallback:

- UIDAI Aadhaar Paperless Offline e-KYC XML.
- Backend/vendor verifies UIDAI digital signature.
- Never store the XML share phrase after processing.

### 5. Liveness / IPV

Use vendor selfie liveness for low-friction flows. Use video IPV if required by the regulated partner or product.

Store only:

- Pass/fail/manual-review status.
- Provider reference.
- Reviewer outcome if applicable.

Avoid storing raw selfie/video unless compliance requires it.

### 6. Bank verification

Ask for account number + IFSC, or use a supported UPI/bank flow.

Verify:

- Account exists.
- Name match score.
- PAN-bank linkage if available/required.

Store masked account number, IFSC, status, and provider reference.

### 7. eSign

Generate the final PDF/forms:

- KYC form.
- RA terms and conditions.
- Risk disclosure.
- Broker/demat/account forms if applicable.

User signs through CCA-backed Aadhaar eSign or another legally accepted provider flow.

Store signed document hash, provider reference, timestamp, and audit metadata.

### 8. KRA / CKYC submission

Vendor/regulated partner uploads or updates records:

- KRA for securities-market KYC.
- CKYC where applicable.
- Broker/DP account-opening systems if this is a trading/demat flow.

Sodhani should mark the user verified only after final vendor/partner success callback.

### 9. Final states

Use a strict state machine:

```ts
type KycStatus =
  | "not_started"
  | "in_progress"
  | "manual_review"
  | "verified"
  | "rejected"
  | "expired";
```

Do not let users trade, invest, or access paid regulated services on `in_progress`.

## Backend architecture

```text
Web / Mobile
  -> Sodhani backend creates KYC session
  -> Vendor hosted SDK / redirect
  -> Vendor sends signed webhooks
  -> Sodhani backend verifies webhook
  -> MongoDB stores case state, consents, references, audit log
  -> App reads KYC status from Sodhani backend
```

Frontend/mobile does not talk to vendor APIs directly except through vendor SDK/redirect tokens.

## MongoDB collections

### `kyc_cases`

Purpose: one row per user KYC attempt.

Fields:

- `userId`
- `purpose`: `ra_subscription | broker_onboarding | demat_onboarding`
- `status`
- `provider`
- `providerCaseId`
- `panEncrypted`
- `panLast4`
- `name`
- `dob`
- `kraStatus`
- `ckycStatus`
- `ckycIdMasked`
- `bankStatus`
- `ipvStatus`
- `esignStatus`
- `rejectionReason`
- `createdAt`
- `updatedAt`
- `verifiedAt`
- `expiresAt`

### `kyc_consents`

Purpose: prove user consent for every external check.

Fields:

- `userId`
- `kycCaseId`
- `consentType`: `digilocker | pan | ckyc | kra | bank | esign | privacy_notice`
- `consentTextVersion`
- `granted`
- `grantedAt`
- `ip`
- `userAgent`
- `deviceId`

### `kyc_documents`

Purpose: only documents that must be retained.

Fields:

- `userId`
- `kycCaseId`
- `type`: `aadhaar_xml | pan | signed_form | photo | video_ipv | bank_proof`
- `storageKey`
- `sha256`
- `source`: `digilocker | uidai_offline_xml | esign_provider | vendor`
- `providerDocumentId`
- `encrypted`
- `retainedUntil`
- `createdAt`

### `kyc_audit_events`

Purpose: append-only audit trail.

Fields:

- `userId`
- `kycCaseId`
- `actor`: `user | system | vendor | ops`
- `event`
- `metadata`
- `createdAt`

## Security rules

- Do not store full Aadhaar number unless compliance explicitly requires it.
- Do not store raw Aadhaar XML, PAN images, bank details, or video files unless required.
- Encrypt PAN, bank fields, provider payloads, and document storage references.
- Keep vendor secrets only on backend.
- Verify every webhook signature.
- Make webhook handlers idempotent.
- Keep KYC data out of analytics, logs, session replay, and AI tooling.
- Use role-based ops access and audit every access.
- Use short-lived signed URLs for any document review.
- Keep a retention/purge policy aligned with SEBI/PMLA/partner requirements.
- Support DPDP consent, notice, access, correction, and deletion flows where deletion is not blocked by regulatory retention.

## What not to build

- Do not build direct UIDAI online Aadhaar authentication unless the regulated entity is properly permitted/onboarded.
- Do not treat Google login, phone OTP, or PAN entry as KYC.
- Do not screen-scrape PAN, DigiLocker, UIDAI, KRA, or bank portals.
- Do not let the mobile app own KYC secrets.
- Do not use user-uploaded documents as the primary happy path.
- Do not bypass KRA just because CKYC exists.

## Vendor checklist

Ask every vendor:

- Do you support both web and mobile hosted KYC?
- Do you support DigiLocker document fetch?
- Do you support UIDAI offline XML fallback?
- Do you support PAN verification, name/DOB match, and PAN status?
- Do you support KRA check/upload for securities KYC?
- Do you support CKYC search/download/upload?
- Do you support bank penny-drop or PAN-bank linkage?
- Do you support selfie liveness and video IPV?
- Do you provide CCA-backed eSign or eSign integration?
- Do you provide signed webhooks, sandbox, dashboard, manual review, and audit logs?
- Where is data hosted and how long is it retained?
- Can raw KYC documents stay out of Sodhani servers?
- What are the SLAs during DigiLocker/UIDAI downtime?
- Which SEBI/broker/RA clients already use this stack?

## Final choice

For Sodhani, choose:

```text
Hosted KYC vendor
  + DigiLocker default
  + PAN verification
  + KRA/CKYC check first
  + liveness/video IPV when required
  + Aadhaar eSign / CCA ESP
  + MongoDB status + consent + audit only
```

This is the cleanest balance of security, speed, compliance, and user experience.

## Sources

- SEBI online KYC, DigiLocker, eSign, video IPV, mobile/email/bank verification: https://www.sebi.gov.in/media/press-releases/apr-2020/sebi-eases-the-know-your-client-kyc-process-by-enabling-online-kyc-use-of-technology-app-by-the-registered-intermediary_46612.html
- SEBI KYC master circular for securities market: https://www.sebi.gov.in/legal/master-circulars/oct-2023/master-circular-on-know-your-client-kyc-norms-for-the-securities-market_77945.html
- SEBI UIDAI e-KYC Aadhaar authentication/sub-KUA circular: https://www.sebi.gov.in/legal/circulars/mar-2024/entities-allowed-to-use-e-kyc-aadhaar-authentication-services-of-uidai-in-securities-market-as-sub-kua_82364.html
- SEBI Research Analyst master circular, including fee-paying client KYC and DigiLocker Aadhaar e-sign consent: https://www.sebi.gov.in/sebi_data/attachdocs/feb-2026/1770375507051.pdf
- FIU/PMLA Rules for CKYC filing, KYC Identifier, retrieval, purpose limits, third-party reliance: https://fiuindia.gov.in/files/AML_Legislation/notification.html
- UIDAI Aadhaar Paperless Offline e-KYC: https://www.uidai.gov.in/en/2-uncategorised/11318-aadhaar-paperless-offline-e-kyc.html
- DigiLocker requester integration: https://www.digilocker.gov.in/web/partners/requesters
- DigiLocker legal equivalence/overview: https://www.digilocker.gov.in/web/about/about-digilocker
- DigiLocker architecture/security: https://www.digilocker.gov.in/web/architecture
- CCA eSign overview: https://www.cca.gov.in/eSign.html
- CCA empanelled eSign providers: https://www.cca.gov.in/service-providers.html
- India Code DPDP Act and 2025 Rules listing: https://www.indiacode.nic.in/handle/123456789/22037
- Decentro KYC identity API reference: https://docs.decentro.tech/docs/kyc-and-onboarding-identities
- IDfy Video KYC reference: https://www.idfy.com/identity-verification-solutions-by-idfy/video-kyc/
