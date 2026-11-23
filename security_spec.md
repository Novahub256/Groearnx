# GROEarnX Security Specification (Phase 0 TDD)

## 1. Data Invariants

1. **Identity & PII Isolation**: `users/{userId}` contains PII (`email`, `phone`, `fullName`) and is readable/listable ONLY by `request.auth.uid == userId` or verified `isAdmin()`. Referral code verification uses the non-PII `referralCodes/{code}` index.
2. **Zero Self-Credited Balances**: A user creating `users/{userId}` MUST initialize `simulatedBalance == 0`, `simulatedInvested == 0`, `simulatedEarnings == 0`, and `status == 'active'`. Non-admins can NEVER increase `simulatedBalance` or `simulatedEarnings`.
3. **Zero Self-Assigned Admin**: Users cannot create or update `admins/{uid}` unless already an `isAdmin()` (with `email_verified == true`).
4. **Verified Financial Operations**: Creating simulated investments, deposit requests, withdrawal requests, and transactions requires `isSignedIn()`, `isEmailVerified()`, and `userId == request.auth.uid`, plus `isDemo == true`.
5. **Atomic Investment Balance Deduction**: Creating a simulated investment requires `users/{uid}.simulatedBalance >= amount` and atomically decrements `simulatedBalance` while incrementing `simulatedInvested` by the exact same amount in the same transaction (`getAfter`).
6. **Balance-Checked Withdrawals**: Creating a withdrawal request requires `amount > 0` and `users/{uid}.simulatedBalance >= amount`.
7. **Terminal Status Locking**: Once a deposit or withdrawal request reaches `'approved'`, `'rejected'`, or `'cancelled'`, non-admins cannot alter it; users may only transition their own `'pending'` request to `'cancelled'`.
8. **Strict Query Enforcement**: Every `allow list` rule evaluates `resource.data` against `request.auth.uid` or `isAdmin()`.
9. **Temporal Integrity**: `createdAt == request.time` on creation and `updatedAt == request.time` on updates; `createdAt` and `userId` are immutable.
10. **Strict Key & Size Bounds**: Every document enforces `keys().hasAll(...)` and `keys().hasOnly(...)` and strict string `.size()` limits.

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Balance Forgery on Signup**: `POST /users/{uid}` with `simulatedBalance: 100000` -> `PERMISSION_DENIED`.
2. **Self-Admin Escalation**: `POST /admins/{uid}` by non-admin -> `PERMISSION_DENIED`.
3. **Cross-User PII Read**: `GET /users/{otherUid}` by non-admin -> `PERMISSION_DENIED`.
4. **Shadow Field Injection**: `POST /depositRequests/{id}` with extra field `isVerified: true` -> `PERMISSION_DENIED`.
5. **Unverified Email Financial Write**: `POST /depositRequests/{id}` where `email_verified == false` -> `PERMISSION_DENIED`.
6. **Blanket List Scraping**: `LIST /transactions` without `where('userId', '==', uid)` -> `PERMISSION_DENIED`.
7. **Self-Approval State Shortcut**: `PATCH /depositRequests/{id}` setting `status: 'approved'` by non-admin -> `PERMISSION_DENIED`.
8. **Withdrawal Exceeding Balance**: `POST /withdrawalRequests/{id}` where `amount > user.simulatedBalance` -> `PERMISSION_DENIED`.
9. **Unbacked Investment Creation**: `POST /investments/{id}` without matching balance deduction on `users/{uid}` -> `PERMISSION_DENIED`.
10. **Resource Poisoning ID**: `POST /depositRequests/{1500_char_id}` -> `PERMISSION_DENIED`.
11. **Terminal State Re-opening**: `PATCH /withdrawalRequests/{approvedId}` setting `status: 'cancelled'` by owner -> `PERMISSION_DENIED`.
12. **Client Timestamp Forgery**: `POST /transactions/{id}` with backdated `createdAt` instead of `request.time` -> `PERMISSION_DENIED`.
