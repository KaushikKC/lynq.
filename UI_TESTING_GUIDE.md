# 🎨 UI Testing Guide - Programmable Money Features

## ✅ What's Been Added to UI

### **Dashboard - Programmable Features Section** (`/dashboard`)

A new section has been added that demonstrates all programmable logic features:

1. **Auto-Repay on Credit Improvement** 🤖
2. **Auto-Extend on Partial Payment** 📅
3. **Visual Flow Indicators** 📊

---

## 🚀 How to Test from UI

### **Step 1: Navigate to Dashboard**

1. Go to http://localhost:3000/dashboard
2. Make sure you have at least one active loan
3. Scroll down to see the **"Programmable Money Features 🤖"** section

---

## 🎬 Feature 1: Auto-Repay on Credit Improvement

### **What It Does:**
Automatically repays your loan when your credit score reaches 700+ and you have sufficient USDC balance.

### **How to Test:**

#### **Prerequisites:**
- ✅ Active loan
- ✅ Credit score ≥ 700
- ✅ USDC balance ≥ loan outstanding amount

#### **Test Flow:**

1. **Check Your Status:**
   - Look at the top stats cards
   - Credit Score should be 700+
   - USDC Balance should be ≥ loan outstanding

2. **Find Your Loan:**
   - In the "Auto-Repay on Credit Improvement" card
   - You'll see all your active loans listed

3. **Click "Auto-Repay" Button:**
   - Button will be **purple** if eligible
   - Button will be **gray** if not eligible (shows why)

4. **Watch the Magic:**
   - Transaction is sent to blockchain
   - Loan is automatically repaid from your wallet
   - Credit score increases by 30 points
   - Loan disappears from active loans list

#### **Visual Indicators:**
- ✅ **Green/Purple Button** = Eligible (credit score ≥ 700, sufficient balance)
- ⚠️ **Gray Button** = Not eligible (shows warning message)
- 🔄 **Spinner** = Processing transaction

#### **Expected Result:**
```
✅ Transaction successful!
✅ Loan marked as "Repaid"
✅ Credit score +30 points
✅ Loan removed from active loans
```

---

## 🎬 Feature 2: Auto-Extend on Partial Payment

### **What It Does:**
Automatically extends your loan by 30 days if you pay 50% or more before the due date.

### **How to Test:**

#### **Prerequisites:**
- ✅ Active loan
- ✅ Paid ≥ 50% of total loan amount
- ✅ At least 1 day before due date

#### **Test Flow:**

1. **Make Partial Payment First:**
   - Click "Repay" on your loan
   - Select "Pay Partial"
   - Enter amount ≥ 50% of total owed
   - Complete repayment

2. **Check Eligibility:**
   - In the "Auto-Extend on Partial Payment" card
   - You'll see: "Paid: 50%+ • Due in: X days"
   - Button will be **blue** if eligible

3. **Click "Auto-Extend" Button:**
   - Transaction is sent to blockchain
   - Loan due date extended by 30 days
   - Credit score increases by 10 points

4. **Verify Extension:**
   - Loan due date should show +30 days
   - "Days left" counter should increase

#### **Visual Indicators:**
- ✅ **Blue Button** = Eligible (50%+ paid, 1+ days before due)
- ⚠️ **Gray Button** = Not eligible (shows why)
- 📊 **Progress Bar** = Shows paid percentage

#### **Expected Result:**
```
✅ Transaction successful!
✅ Loan due date extended by 30 days
✅ Credit score +10 points
✅ "Days left" counter updated
```

---

## 📊 Complete Demo Flow for Judges

### **Demo Script (5 minutes):**

#### **Part 1: Show Multi-Currency Repayment** (1 min)
1. Go to `/dashboard`
2. Click "Repay" on a loan
3. Select "EURC" from currency dropdown
4. Show conversion rate: "1 EURC = 1.09 USDC"
5. Click "Confirm & Pay"
6. **Say:** "Users can repay loans in any currency - EURC, USYC, or USDC. The system automatically converts."

#### **Part 2: Show Auto-Repay** (2 min)
1. Point to "Programmable Money Features" section
2. **Say:** "This demonstrates programmable money - automated actions based on on-chain conditions."
3. Show the "Auto-Repay" card
4. **Say:** "When a user's credit score improves to 700+, they can automatically repay their loan with one click."
5. Click "Auto-Repay" button
6. Show transaction success
7. **Say:** "The smart contract checked the credit score, verified the balance, and automatically repaid from the user's wallet - all on-chain, no manual intervention."

#### **Part 3: Show Auto-Extend** (2 min)
1. Show the "Auto-Extend" card
2. **Say:** "If a user pays 50% of their loan early, the contract automatically extends the due date by 30 days."
3. Make a partial payment (if needed)
4. Click "Auto-Extend" button
5. Show the due date updated
6. **Say:** "This is programmable money in action - the contract detects conditions and executes actions automatically."

---

## 🎯 What Makes This Special

### **For Track 1: Programmable Money**

✅ **Conditional Automation:**
- Auto-repay based on credit score (≥700)
- Auto-extend based on payment percentage (≥50%)

✅ **Event-Based Triggers:**
- Credit score improvement triggers auto-repay
- Early payment triggers auto-extend

✅ **On-Chain Logic:**
- All checks happen on-chain
- No off-chain oracles needed
- Fully transparent and verifiable

### **Visual Demonstration:**
- ✅ Clear eligibility indicators
- ✅ Real-time status updates
- ✅ Transaction feedback
- ✅ Educational tooltips

---

## 🧪 Testing Checklist

### **Auto-Repay:**
- [ ] Section appears when you have active loans
- [ ] Button shows correct eligibility status
- [ ] Warning messages display when not eligible
- [ ] Transaction executes successfully
- [ ] Loan is marked as repaid
- [ ] Credit score increases

### **Auto-Extend:**
- [ ] Section appears when you have active loans
- [ ] Shows paid percentage correctly
- [ ] Shows days until due date
- [ ] Button enables when 50%+ paid
- [ ] Transaction executes successfully
- [ ] Due date extends by 30 days
- [ ] Credit score increases

---

## 🐛 Troubleshooting

### **Auto-Repay Button is Gray:**
- **Check credit score:** Must be ≥ 700
- **Check balance:** Must have enough USDC
- **Check loan status:** Loan must be "Disbursed"

### **Auto-Extend Button is Gray:**
- **Check payment:** Must have paid ≥ 50%
- **Check due date:** Must be ≥ 1 day before due
- **Check loan status:** Loan must be active

### **Transaction Fails:**
- Check console for error message
- Verify you have enough gas
- Check if loan still exists
- Verify contract addresses in `.env`

---

## 📱 UI Features

### **Visual Design:**
- 🎨 Purple/blue gradient background
- 🤖 Robot icon for automation
- ✨ Magic icon for auto-repay
- 📊 Chart icon for auto-extend
- ⚠️ Warning messages for ineligibility
- ✅ Success indicators

### **User Experience:**
- Clear eligibility status
- Real-time feedback
- Educational tooltips
- Transaction status updates
- Automatic data refresh

---

## 🎉 Ready to Demo!

**All programmable features are now accessible from the UI!**

1. Navigate to `/dashboard`
2. Scroll to "Programmable Money Features"
3. Click buttons to test automation
4. Show judges the on-chain programmable logic in action!

**This demonstrates true programmable money - automated financial actions based on on-chain conditions!** 🚀

