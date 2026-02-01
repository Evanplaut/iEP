# iEP Finance Dashboard

A secure, mobile-first personal finance dashboard with PIN protection. Track spending, manage bills, and analyze your financial health—all offline with zero backend.

## 🔒 Security Features

- **PIN Protected**: 4-6 digit PIN required to access
- **Auto-Lock**: Locks after 30 minutes of inactivity
- **Local Data Only**: All data stored in your browser's localStorage
- **No Server**: Zero external requests or tracking
- **GitHub Pages Safe**: Code is public, but your financial data stays private on your device

## Quick Start

### First Time Setup

1. **Open the app** (see deployment options below)
2. **Create your PIN**: Enter a 4-6 digit PIN (REMEMBER THIS - no recovery!)
3. **Update balances**: Settings → Enter your current TD and Discover balances
4. **Import transactions**: Settings → Import CSV with your bank statements

### Daily Use

- **Unlock**: Enter your PIN
- **Add transaction**: Tap the blue + button
- **Lock manually**: Settings → Lock App
- **Auto-locks**: After 30 min of inactivity

## Deployment Options

### Option 1: GitHub Pages (Recommended for iPhone)

**Best for**: Accessing from anywhere, works like a native app on iPhone

1. Create GitHub account (free)
2. Create new repository: `iep-finance`
3. Upload all 5 files (index.html, app.js, styles.css, data.json, README.md)
4. Settings → Pages → Enable from `main` branch
5. Access at: `https://YOUR-USERNAME.github.io/iep-finance/`
6. **iPhone**: Open in Safari → Share → "Add to Home Screen"

**Security**: The code is public, but your PIN and financial data remain private in your browser's localStorage.

###Option 2: Local Files (Most Secure)

**Best for**: Maximum privacy, no internet required

1. Save all files to a folder (e.g., iCloud Drive)
2. **iPhone**: Files app → Open index.html → Add to Home Screen
3. **Mac**: Double-click index.html to open in Safari

## Features

### Core Functionality
- **Net Worth Tracking**: TD balance minus Discover balance
- **Transaction Management**: Quick add, edit, delete, search
- **CSV Import**: Bulk import from bank statements with duplicate detection
- **Auto-Categorization**: Learn merchant patterns
- **Bills & Subscriptions**: Track recurring payments
- **Category Analysis**: Visualize spending by category
- **Monthly Trends**: Compare month-over-month spending

### PIN Security
- **Setup**: Create 4-6 digit PIN on first launch
- **SHA-256 Hashing**: PIN stored securely (not plain text)
- **Session Management**: Auto-lock after 30 minutes
- **Manual Lock**: Lock button in Settings
- **No Recovery**: Don't forget your PIN - there's no reset option

## CSV Import Guide

### Format

Your CSV should have these columns (auto-detected):
```csv
Date,Merchant,Amount,Type,Category,Account
2025-01-15,Starbucks,4.85,expense,Dining & Restaurants,td
2025-01-16,Paycheck,2500.00,income,Income,td
```

**Required fields**: Date, Merchant, Amount, Type, Category
**Optional**: Account (defaults to TD), Notes

### Supported Date Formats
- `YYYY-MM-DD` (2025-01-15)
- `MM/DD/YYYY` (01/15/2025)
- `MM-DD-YYYY` (01-15-2025)

### Import Process

1. Settings → Import Transactions (CSV)
2. Select your CSV file
3. Duplicate detection automatically skips existing transactions
4. Transactions appear immediately

## Data Backup

**Export**: Settings → Export Data (JSON)
**Restore**: Import the JSON file (overwrites current data)
**Recommendation**: Export weekly, store in iCloud/email

## Usage Tips

### Quick Add Transaction (Mobile)
1. Tap blue + button
2. Amount → Merchant → Category
3. Default: Today's date, Expense type
4. Saves immediately

### Swipe to Delete (Mobile)
- In Transactions view, swipe left on any transaction
- Tap Delete button that appears

### Update Balances Weekly
- Settings → Account Balances
- Enter current TD and Discover balances
- Keeps Net Worth accurate

### Categories
- Add custom categories in Settings
- Delete unused categories (won't affect existing transactions)
- Default categories cover most spending

## Troubleshooting

### Forgot PIN
**Solution**: No recovery available. You'll need to:
1. Export data if you can still access (unlikely)
2. Clear browser data/localStorage
3. Set up new PIN
4. Import backup if available

### Data Not Saving
1. Check Safari settings: Block All Cookies = OFF
2. Try exporting data as backup
3. Clear browser cache and reload

### CSV Import Fails
- Ensure file is `.csv` format
- Check column names match format above
- Remove any special characters from amounts ($, commas)

### iPhone Not Opening File
- Use Safari (not Chrome/Firefox)
- Try: Long-press → Share → Safari
- Or save to iCloud Drive and access via GitHub Pages URL

## Privacy & Security

✅ **What's Private**: All your transactions, balances, and financial data
✅ **What's Public**: The app code (HTML/CSS/JS) on GitHub
✅ **What's Stored**: PIN hash and all data in your browser's localStorage
✅ **What's Sent**: Nothing - no analytics, no servers, no external requests

**Your data never leaves your device.**

## Browser Compatibility

| Browser | iPhone | Mac | Status |
|---------|--------|-----|--------|
| Safari | ✅ | ✅ | Fully supported, recommended |
| Chrome | ⚠️ | ⚠️ | Works, but localStorage doesn't sync |
| Firefox | ⚠️ | ⚠️ | Works, UI may vary |

## License

Free to use, modify, and share. No warranty provided.

---

**Built for Evan | Dark Mode Only | PIN Protected | Works Offline**
