# 🤖 Programmable Money - Complete UI Demo Flow

## 🎯 Overview

This guide shows you how to demonstrate **Programmable Money** features from the UI for your hackathon presentation.

---

## 📍 Where to Find It

**Location:** `/dashboard` page  
**Section:** "Programmable Money Features 🤖" (appears below active loans)

---

## 🎬 Complete Demo Flow (5-7 minutes)

### **Step 1: Setup (30 seconds)**

1. **Navigate to Dashboard:**
   ```
   http://localhost:3000/dashboard
   ```

2. **Verify Prerequisites:**
   - ✅ You have at least one active loan
   - ✅ Your credit score is visible (top stats)
   - ✅ Your USDC balance is visible

3. **Scroll Down:**
   - Find the purple/blue gradient section
   - Title: "Programmable Money Features 🤖"

---

### **Step 2: Show Multi-Currency Repayment (1 minute)**

**Say to Judges:**
> "First, let me show you our multi-currency support - users can repay loans in EURC, USYC, or USDC."

**Actions:**
1. Click "Repay" button on any loan
2. In the modal, point to the currency dropdown
3. Select "EURC" from dropdown
4. Show the conversion rate: "1 EURC = 1.09 USDC"
5. Show the equivalent amount calculation
6. **Say:** "The system automatically converts EURC to USDC equivalent."
7. (Optional) Complete the repayment to show it works

**Key Points:**
- ✅ Cross-border payments
- ✅ Automatic currency conversion
- ✅ Real-time exchange rates

---

### **Step 3: Demonstrate Auto-Repay (2 minutes)**

**Say to Judges:**
> "Now let me show you programmable money in action. This is automated loan management based on on-chain conditions."

**Actions:**
1. Scroll to "Programmable Money Features" section
2. Point to the left card: "Auto-Repay on Credit Improvement"
3. **Say:** "When a user's credit score improves to 700+, they can automatically repay their loan with one click."
4. Show the loan listed in the card
5. Point to the eligibility status:
   - If eligible: "Button is purple - ready to use"
   - If not: "Button is gray - shows why (credit score < 700 or insufficient balance)"
6. Click "Auto-Repay" button
7. Show transaction processing
8. **Say:** "The smart contract checked three things on-chain: credit score ≥ 700, sufficient balance, and loan status. Then it automatically transferred funds from the user's wallet to repay the loan."
9. Show success message
10. Show loan removed from active loans
11. **Say:** "This is programmable money - automated financial actions based on on-chain data, no manual intervention needed."

**Key Points:**
- ✅ Conditional automation (credit score ≥ 700)
- ✅ On-chain verification
- ✅ Automatic execution
- ✅ No manual steps

---

### **Step 4: Demonstrate Auto-Extend (2 minutes)**

**Say to Judges:**
> "Here's another example - automatic loan extension based on early payment behavior."

**Actions:**
1. Point to the right card: "Auto-Extend on Partial Payment"
2. **Say:** "If a user pays 50% or more of their loan before the due date, the contract automatically extends the loan by 30 days."
3. Show the loan details:
   - "Paid: X%" (should be ≥ 50%)
   - "Due in: X days" (should be ≥ 1 day)
4. Point to the button:
   - If eligible: "Button is blue - ready to extend"
   - If not: "Shows why (need 50% paid, or too close to due date)"
5. Click "Auto-Extend" button
6. Show transaction processing
7. **Say:** "The contract detected that the user paid 50% early, verified it's at least 1 day before due date, and automatically extended the loan by 30 days."
8. Show success message
9. Reload the page or wait for auto-refresh
10. Show the updated due date (should be +30 days)
11. **Say:** "This demonstrates event-based triggers - the contract responds to user behavior automatically."

**Key Points:**
- ✅ Event-based automation (50% payment triggers extension)
- ✅ Time-based conditions (1+ days before due)
- ✅ Automatic state updates
- ✅ User-friendly rewards

---

### **Step 5: Explain the Technology (1 minute)**

**Point to the Info Box at Bottom:**

**Say:**
> "These features demonstrate true programmable money. Unlike traditional systems where you need manual approval or off-chain processes, everything here runs on-chain:
> 
> - **Auto-Repay:** Checks credit score and balance on-chain, then executes automatically
> - **Auto-Extend:** Detects payment percentage and due date, then updates loan terms
> - **No Oracles Needed:** All data comes from on-chain state
> - **Transparent:** Anyone can verify the logic
> - **Trustless:** No need to trust a third party"

**Key Points:**
- ✅ On-chain logic
- ✅ Transparent and verifiable
- ✅ No manual intervention
- ✅ Automated financial actions

---

## 🎨 Visual Elements to Highlight

### **1. Color-Coded Buttons:**
- **Purple** = Auto-Repay (ready)
- **Blue** = Auto-Extend (ready)
- **Gray** = Not eligible (shows why)

### **2. Status Indicators:**
- Credit score display
- Payment percentage
- Days until due date
- Eligibility warnings

### **3. Real-Time Updates:**
- Transaction status
- Success messages
- Automatic data refresh
- Updated loan status

---

## 📊 What Judges Will See

### **Before Clicking:**
- Clear eligibility status
- Visual indicators (colors)
- Educational tooltips
- Loan details

### **During Transaction:**
- Loading spinner
- Transaction hash
- Processing status

### **After Success:**
- Success toast
- Updated loan list
- Credit score increase
- Extended due date (for auto-extend)

---

## 🎯 Key Talking Points

### **For Track 1: Programmable Money**

1. **"Beyond Basic Transfers":**
   - Not just sending money
   - Conditional logic based on on-chain data
   - Automated responses to user behavior

2. **"Complex Logic":**
   - Credit score checks
   - Payment percentage calculations
   - Time-based conditions
   - Multi-condition verification

3. **"Automated Systems":**
   - No manual approval needed
   - Self-executing contracts
   - Event-driven actions

### **For Track 2: Treasury Management**

1. **"Automated Allocations":**
   - Show treasury admin panel
   - Execute allocations
   - Funds automatically distributed

2. **"Scheduled Distributions":**
   - Show payroll scheduling
   - Automated recurring payments

---

## 🚀 Quick Test Checklist

Before your demo, verify:

- [ ] Dashboard loads correctly
- [ ] "Programmable Money Features" section appears
- [ ] You have at least one active loan
- [ ] Credit score is visible (top stats)
- [ ] USDC balance is visible
- [ ] Auto-Repay button shows correct status
- [ ] Auto-Extend button shows correct status
- [ ] Currency dropdown works in repayment modal
- [ ] All buttons are clickable

---

## 💡 Pro Tips for Demo

1. **Start with the Problem:**
   - "Traditional loans require manual processes..."
   - "What if loans could manage themselves?"

2. **Show the Solution:**
   - "With programmable money, contracts can..."
   - "Watch this automated action..."

3. **Highlight the Technology:**
   - "All logic runs on-chain..."
   - "No oracles, no manual steps..."

4. **End with Impact:**
   - "This enables new financial products..."
   - "Users get better experiences..."

---

## 🎉 You're Ready!

**Everything is set up for an impressive demo!**

1. Navigate to `/dashboard`
2. Scroll to "Programmable Money Features"
3. Click buttons to show automation
4. Explain the on-chain logic
5. Win the hackathon! 🏆

**Good luck!** 🚀

