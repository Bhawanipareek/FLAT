# Flat Expense Manager – Local Wi-Fi Sharing App

A modern, production-grade Android application built with **Flutter & Dart** designed for flatmates, roommates, and hostel residents to track monthly expenses, grocery shopping, upcoming budget, money received, and who owes whom — **without any cloud database or backend server**.

---

## 1. Core Architectural Pillars

- **Zero Cloud Footprint**: Absolutely NO Firebase, Supabase, MySQL, MongoDB, or third-party cloud servers.
- **100% Local SQLite Storage**: Structured local data storage using `sqflite` with foreign-key constraints, cascading deletes, transactions, and composite performance indexes.
- **Peer-to-Peer Wi-Fi Synchronization**: Embedded lightweight HTTP server (`dart:io` `HttpServer`) running directly on each device on port `8089`, exchanging incremental changesets authenticated via high-entropy pairing secrets.
- **Offline First**: Users can record expenses, tick off shopping items, and register settlements completely offline. Changes are queued in `sync_logs` and reconciled automatically when the devices reconnect to the same Wi-Fi.
- **Deterministic Conflict Resolution**: Last-Write-Wins (LWW) conflict engine using monotonic `updated_at` timestamps with deterministic ID tie-breaking.
- **Atomic Shopping Conversion**: Prevents duplicate expense creation when a shopping list item is marked purchased.
- **Strict Separation of Funds**: Money In / Contributions (e.g. flat funds, rent advances) are tracked separately from shared expense consumption to prevent double-counting.
- **Debt Minimization Algorithm**: Computes net balances across all roommates and calculates the minimum number of direct transfers needed to settle all debts.
- **Router Isolation Fallback**: Includes instant JSON backup export and import to transfer data even if the Wi-Fi router blocks device-to-device communication (AP client isolation).

---

## 2. Technology Stack & Packages

- **Framework**: Flutter 3.x (Dart 3.x)
- **Local Database**: `sqflite` + `path` + `path_provider`
- **Preferences**: `shared_preferences`
- **State Management**: `provider` (MultiProvider architecture)
- **Identifiers**: `uuid` (UUID v4)
- **Formatting**: `intl` (Indian Rupee `₹` and multi-currency formatting)
- **QR Code Pairing**: `qr_flutter` (Generation) & `mobile_scanner` (Camera Scanner)
- **Networking**: `network_info_plus` & `dart:io` HTTP Server/Client

---

## 3. Project Structure

```
flat_expense_manager/
├── android/
│   ├── app/
│   │   ├── build.gradle
│   │   └── src/main/
│   │       ├── AndroidManifest.xml                  # Network, Camera, Security permissions
│   │       ├── res/xml/network_security_config.xml  # Cleartext local HTTP traffic permissions
│   │       └── kotlin/MainActivity.kt
│   ├── build.gradle
│   └── settings.gradle
├── lib/
│   ├── main.dart                                    # MultiProvider root & theme bootstrap
│   ├── core/
│   │   ├── constants/
│   │   │   ├── app_colors.dart                      # Clean light theme with emerald green accents
│   │   │   ├── app_constants.dart                   # Ports, db name, preference keys
│   │   │   └── expense_categories.dart              # 12 default flat expense categories
│   │   ├── theme/
│   │   │   └── app_theme.dart                       # Material 3 light & dark theme configs
│   │   └── utils/
│   │       ├── currency_formatter.dart              # INR (₹) formatting & compact notation
│   │       ├── date_time_utils.dart                 # Relative and calendar date formatting
│   │       └── id_generator.dart                    # UUID & pairing code generator
│   ├── data/
│   │   ├── database/
│   │   │   ├── app_database.dart                    # SQLite singleton & transaction runner
│   │   │   └── database_tables.dart                 # SQL DDL schemas and indices
│   │   ├── models/
│   │   │   ├── group_model.dart                     # Flat group entity
│   │   │   ├── member_model.dart                    # Flatmate profile & role entity
│   │   │   ├── expense_model.dart                   # Expense with splits and receipt path
│   │   │   ├── expense_split_model.dart             # Per-member split allocations
│   │   │   ├── shopping_item_model.dart             # Shopping item with conversion status
│   │   │   ├── contribution_model.dart              # Flat fund / rent advance receipts
│   │   │   ├── settlement_model.dart                # Debt clearances between members
│   │   │   ├── sync_log_model.dart                  # Incremental change-log queue
│   │   │   └── pairing_payload.dart                 # Data payload encoded in QR code
│   │   ├── repositories/
│   │   │   ├── group_repository.dart                # Group & member operations
│   │   │   ├── expense_repository.dart              # Expense & split database operations
│   │   │   ├── shopping_repository.dart             # Shopping & atomic convert-to-expense
│   │   │   ├── contribution_repository.dart         # Money In & flat funds
│   │   │   ├── settlement_repository.dart           # Debt settlements
│   │   │   └── sync_repository.dart                 # Change tracking, ingestion & snapshotting
│   │   └── services/
│   │       ├── preferences_service.dart             # SharedPreferences wrapper
│   │       └── backup_restore_service.dart          # JSON export/import & sharing
│   ├── domain/
│   │   ├── settlement_calculator.dart               # Debt simplification algorithm
│   │   └── conflict_resolver.dart                   # Last-Write-Wins conflict resolution
│   ├── sync/
│   │   ├── network_discovery.dart                   # Wi-Fi IP resolver & subnet scanner
│   │   ├── p2p_sync_models.dart                     # Request / response DTOs
│   │   ├── p2p_sync_server.dart                     # Embedded HTTP server (ports & endpoints)
│   │   ├── p2p_sync_client.dart                     # HTTP client with timeouts & isolation handling
│   │   └── p2p_sync_manager.dart                    # Sync state machine & auto-sync coordinator
│   └── presentation/
│       ├── providers/                               # State providers (AppState, Expenses, Shopping, etc.)
│       ├── screens/
│       │   ├── home/                                # Dashboard, Net Balance Card, Overview
│       │   ├── expenses/                            # List, Add/Edit Expense, Detail
│       │   ├── shopping/                            # Shopping List, Add/Edit, Convert dialog
│       │   ├── contributions/                       # Money In List, Add Contribution
│       │   ├── settlements/                         # Settlements & Debt Clearances
│       │   ├── group/                               # Members, QR Pairing, QR Scanner, Manual IP
│       │   ├── settings/                            # Settings, Profile, JSON Backup/Restore
│       │   └── main_navigation_screen.dart          # 5-tab Material 3 bottom navigation
│       └── widgets/                                 # SyncStatusIndicator, CategoryIcon, MemberAvatar
├── test/
│   ├── settlement_calculator_test.dart              # Verified unit test of Section 10 example
│   ├── conflict_resolver_test.dart                  # Verified LWW conflict tests
│   └── models_serialization_test.dart               # Verified serialization & QR decode tests
└── pubspec.yaml
```

---

## 4. Local Wi-Fi Pairing & Direct Synchronization Workflow

### A. Pairing Two Phones Over Wi-Fi
1. **Phone A (Creator)** opens the app and taps **"Create New Group"**.
2. Enters group name (e.g., *"My Flat"*) and selects currency (default **₹ INR**).
3. The app starts an embedded HTTP server on port `8089` on Phone A's local Wi-Fi IP (e.g. `192.168.1.45:8089`).
4. Phone A displays a high-density QR code containing the `PairingPayload` (Group ID, Pairing Token, Wi-Fi IP, Port).
5. **Phone B (Flatmate)** connects to the same Wi-Fi, opens the app, and taps **"Scan QR to Join Flat"**.
6. Phone B scans Phone A's screen.
7. Phone B issues an authenticated `POST /api/v1/pair` request to Phone A.
8. Phone A verifies the pairing secret, registers Phone B as an authorized flatmate, and responds with a full initial snapshot of the group database.
9. Phone B imports the snapshot into its local SQLite database and registers Phone A as a known peer. Both phones are now paired!

### B. Incremental Synchronization
- Whenever either user adds, edits, or deletes an expense, shopping item, contribution, or settlement:
  1. The change is saved to local SQLite immediately.
  2. A row is added to `sync_logs` recording the operation, timestamp, and payload.
  3. `P2pSyncManager` triggers an immediate sync:
     - Pushes pending local changes to the peer via `POST /api/v1/sync/push`.
     - Pulls any new changes from the peer via `POST /api/v1/sync/pull`.
  4. Both devices run `ConflictResolver`: newer records (`updated_at`) overwrite older ones, while deletion tombstones are preserved.
  5. The sync status pill immediately updates to **"Connected • Just now"** with a green badge.

### C. Offline Support & Disconnection Handling
- If Phone B goes out of Wi-Fi range or loses connection:
  - Phone B continues to work 100% offline. All new records are saved locally and queued in `sync_logs`.
  - When Phone B reconnects to the Wi-Fi, `P2pSyncManager`'s periodic auto-sync or tapping **"Sync Now"** flushes the queue and synchronizes all changes with Phone A.

### D. Router Client Isolation & Network Diagnostics
- If the Wi-Fi router (common in university hostels or enterprise networks) enables **AP Client Isolation** (blocking phones from talking directly to each other):
  - `P2pSyncClient` catches the `SocketException` / `TimeoutException` and displays a clear explanation to the user.
  - **Quick Fix 1**: One phone turns on its **Mobile Wi-Fi Hotspot** and the other connects to it.
  - **Quick Fix 2 (Offline Fallback)**: Go to **Settings -> Backup & Data Recovery -> Export JSON Backup**, and share the file via WhatsApp, Bluetooth, or Nearby Share. The other phone taps **Import JSON Backup** to update the local database.

---

## 5. Settlement & Expense Splitting Algorithm

The app implements a greedy multi-party debt simplification algorithm (`SettlementCalculator`):
1. **Net Balance Calculation**:
   $$\text{Balance}_i = \sum \text{Paid By } i - \sum \text{Share Allocated to } i + \sum \text{Settlements Paid by } i - \sum \text{Settlements Received by } i$$
2. **Debtor-Creditor Classification**:
   - $\text{Balance}_i > 0$: Creditor (needs to receive money).
   - $\text{Balance}_i < 0$: Debtor (needs to pay money).
3. **Greedy Simplification**:
   - Matches the largest debtor with the largest creditor to minimize the total number of cash transfers.
4. **Recording Settlements**:
   - When User B pays User A, it is recorded as a `SettlementModel`. This credits User B and debits User A without counting as a household expense.

---

## 6. How to Build & Run

### Prerequisites
1. Install the [Flutter SDK](https://docs.flutter.dev/get-started/install) (version `>= 3.10.0`).
2. Install Android Studio with Android SDK (API 34).
3. Enable Developer Options and USB Debugging on your physical Android devices.

### Commands
```bash
# 1. Fetch dependencies
flutter pub get

# 2. Run static analysis
flutter analyze

# 3. Run unit tests
flutter test

# 4. Run on a connected device
flutter run

# 5. Build release APK
flutter build apk --release
```

---

## 7. Verified Test Scenarios

The included unit tests in `test/` verify:
1. **Section 10 Requirement**: User A pays ₹2,000 and User B pays ₹1,000 for a ₹3,000 total expense split equally. Confirms each share is ₹1,500 and User B owes User A ₹500.
2. **Settlement Clearance**: A ₹1,000 settlement payment between User B and User A clears the balance to ₹0 without affecting total group expense.
3. **Last-Write-Wins Conflict Resolution**: Newer timestamps overwrite older records; exact timestamp ties break deterministically by ID.
4. **Serialization & QR Parsing**: Encodes and decodes the complete `PairingPayload` without data loss.
5. **Shopping to Expense Conversion**: Shopping items transition to `status: 'purchased'` with linked `convertedExpenseId` and correct price.
