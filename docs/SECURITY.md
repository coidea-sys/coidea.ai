# Security Guide - coidea.ai

## 🔒 Security Overview

coidea.ai implements multiple layers of security to protect user funds and data.

---

## 🛡️ Security Features

### 1. Contract Security

#### Emergency Pause System
- **Purpose**: Stop all operations in case of emergency
- **Trigger**: Owner-only function
- **Functions**:
  - `emergencyPause()` - Immediate pause
  - `emergencyPauseWithReason(string)` - Pause with explanation
  - `emergencyResume()` - Resume operations

#### Allowance Limits
| Limit | Value | Purpose |
|-------|-------|---------|
| Daily Investment | 10 ETH | Prevent excessive exposure |
| Daily Withdrawal | 10 ETH | Limit potential losses |
| Withdrawal Cooldown | 1 hour | Prevent rapid draining |

#### Multi-Signature (Planned)
- 3 admin signatures required for critical operations
- 2-of-3 threshold for emergency actions
- Time-delayed execution for safety

### 2. Frontend Security

#### Domain Verification
**Official Domains**:
- https://coidea.ai (Primary)
- https://www.coidea.ai
- https://app.coidea.ai
- https://coidea-ai.pages.dev (Preview)

**⚠️ Warning**: Always verify the URL before connecting your wallet.

#### Transaction Validation
Every transaction is analyzed for:
- Recipient address (known contracts only)
- Value amount (risk scoring)
- Data payload (suspicious patterns)

#### Security Monitoring
Real-time monitoring detects:
- Rapid transaction patterns
- High-value transactions
- Unknown contract interactions
- System pause events

---

## 🚨 Security Checklist

### For Users

- [ ] Verify website URL: https://coidea.ai
- [ ] Never share private keys or seed phrases
- [ ] Use hardware wallet for large amounts
- [ ] Check transaction details before confirming
- [ ] Revoke unnecessary approvals regularly: https://revoke.cash
- [ ] Monitor your account for suspicious activity

### For Developers

- [ ] Run `npm audit` regularly
- [ ] Keep dependencies updated
- [ ] Test emergency pause functionality
- [ ] Monitor contract events
- [ ] Maintain incident response plan

---

## 🐛 Common Scams to Avoid

### 1. Phishing Websites
**Attack**: Fake websites that look like coidea.ai
**Prevention**: 
- Check URL carefully
- Look for security banner
- Bookmark official site

### 2. Fake Airdrops
**Attack**: "Free tokens" that steal your funds
**Prevention**:
- We never do surprise airdrops
- Never connect wallet to unknown sites
- Verify all announcements on official channels

### 3. Malicious Contracts
**Attack**: Contracts that drain your wallet
**Prevention**:
- Only interact with verified contracts
- Check contract addresses against official list
- Use our domain verification system

### 4. Social Engineering
**Attack**: Fake support asking for private keys
**Prevention**:
- We never ask for private keys
- We never ask for seed phrases
- Official support only through GitHub issues

---

## 📋 Incident Response

### If You Suspect a Security Issue

1. **Immediate Actions**:
   - Disconnect wallet from website
   - Revoke all approvals: https://revoke.cash
   - Transfer remaining funds to new wallet

2. **Report the Issue**:
   - GitHub Issues: https://github.com/coidea-sys/coidea.ai/issues
   - Include: transaction hash, time, description

3. **Monitor**:
   - Check your wallet on explorer
   - Watch for unauthorized transactions

### If System is Compromised

**We will**:
1. Trigger emergency pause immediately
2. Notify all users via official channels
3. Investigate and fix the issue
4. Resume operations only after verification

---

## 🔐 Best Practices

### Wallet Security
```
✅ Do:
- Use hardware wallet (Ledger/Trezor)
- Enable 2FA on all accounts
- Keep software updated
- Use unique passwords

❌ Don't:
- Store keys on computer
- Share keys with anyone
- Use public WiFi for transactions
- Click suspicious links
```

### Transaction Safety
```
✅ Do:
- Double-check recipient address
- Verify transaction value
- Review gas fees
- Start with small amounts

❌ Don't:
- Rush through confirmations
- Approve unlimited amounts
- Ignore security warnings
- Use untrusted dApps
```

---

## 📞 Security Contacts

| Type | Contact |
|------|---------|
| Bug Reports | GitHub Issues |
| Security Issues | security@coidea.ai |
| General Support | Discord (link in README) |

---

## 📚 Additional Resources

- [User Guide](./USER_GUIDE.md)
- [API Reference](./API_REFERENCE.md)
- [Contract Verification](./VERIFICATION.md)

---

*Last Updated: 2026-03-05*
*Security Version: 1.0*
