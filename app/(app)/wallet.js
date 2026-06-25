import { useTheme } from "../../theme/ThemeProvider.js";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import {
  ShieldCheck,
  CheckSquare,
  AlertCircle,
  Edit,
  Download,
  Eye,
  EyeOff,
  Plus,
  ChevronDown,
} from "lucide-react-native";
import {
  Screen,
  NeuCard,
  NeuInset,
  PrimaryButton,
  SkeletonLoader,
  EmptyState,
  Toast,
} from "../../components/index.js";
import { radius, spacing } from "../../theme/tokens.js";
import { API_URL } from "../../lib/config.js";
import { getUserToken } from "../../lib/auth.js";
import { useRouter } from "expo-router";

const NIGERIAN_BANKS = [
  { code: "044", name: "Access Bank" },
  { code: "050", name: "EcoBank" },
  { code: "011", name: "First Bank of Nigeria" },
  { code: "082", name: "Keystone Bank" },
  { code: "214", name: "First City Monument Bank" },
  { code: "215", name: "Unity Bank" },
  { code: "221", name: "Stanbic IBTC Bank" },
  { code: "232", name: "Sterling Bank" },
  { code: "301", name: "Jaiz Bank" },
  { code: "302", name: "Union Bank of Nigeria" },
  { code: "303", name: "United Bank for Africa" },
  { code: "305", name: "Empire Trust Bank" },
  { code: "307", name: "Equity Bank" },
  { code: "308", name: "SunTrust Bank" },
  { code: "309", name: "Guaranty Trust Bank" },
  { code: "314", name: "Heritage Bank" },
  { code: "315", name: "Genesis Bank" },
  { code: "317", name: "Anchor Savings" },
  { code: "323", name: "Alpha Morgan" },
  { code: "324", name: "Fortis Bank" },
];

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount || 0);
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function WalletScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [editingBankDetails, setEditingBankDetails] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [bankDetails, setBankDetails] = useState({
    accountNumber: "",
    bankCode: "",
    accountName: "",
  });
  const [withdrawForm, setWithdrawForm] = useState({ amount: "" });
  const [showBankDropdown, setShowBankDropdown] = useState(false);

  useEffect(() => {
    const init = async () => {
      const token = await getUserToken();
      if (!token) {
        router.push("/(auth)/signin");
        return;
      }
      await loadUser();
      await loadTransactions();
      await loadWithdrawals();
    };
    init();
  }, []);

  const loadUser = async () => {
    try {
      const token = await getUserToken();
      const res = await fetch(`${API_URL}/user/details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_token: token }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/(auth)/signin");
          return;
        }
        throw new Error("Failed");
      }
      const data = await res.json();
      setUser(data);
      if (data.wallet?.bankDetails) {
        setBankDetails(data.wallet.bankDetails);
      }
    } catch (e) {
      setMessage({ type: "error", text: "Failed to load wallet" });
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const token = await getUserToken();
      const res = await fetch(`${API_URL}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_token: token }),
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (e) {
      console.error("Failed to load transactions:", e);
    }
  };

  const loadWithdrawals = async () => {
    try {
      const token = await getUserToken();
      const res = await fetch(`${API_URL}/wallet/withdrawals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_token: token }),
      });
      if (res.ok) {
        const data = await res.json();
        setWithdrawals(data.withdrawals || []);
      }
    } catch (e) {
      console.error("Failed to load withdrawals:", e);
    }
  };

  const handleSaveBankDetails = async () => {
    if (
      !bankDetails.accountNumber ||
      !bankDetails.bankCode ||
      !bankDetails.accountName
    ) {
      setMessage({ type: "error", text: "Please fill all bank details" });
      return;
    }
    setSubmitting(true);
    try {
      const token = await getUserToken();
      const res = await fetch(`${API_URL}/wallet/bank-details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_token: token,
          bankDetails: {
            ...bankDetails,
            bankName: NIGERIAN_BANKS.find(
              (b) => b.code === bankDetails.bankCode,
            )?.name,
          },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({
          type: "success",
          text: "Bank details saved successfully",
        });
        setEditingBankDetails(false);
        loadUser();
      } else {
        setMessage({
          type: "error",
          text: data.msg || "Failed to save bank details",
        });
      }
    } catch (e) {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (submitting) return;
    const amount = parseFloat(withdrawForm.amount);
    if (!amount || amount <= 0) {
      setMessage({ type: "error", text: "Please enter a valid amount" });
      return;
    }
    if (!bankDetails.accountNumber || !bankDetails.bankCode) {
      setMessage({ type: "error", text: "Please add your bank details first" });
      return;
    }
    if (amount > (user?.wallet?.availableBalance || 0)) {
      setMessage({
        type: "error",
        text: `Insufficient balance. Available: ${formatCurrency(user?.wallet?.availableBalance)}`,
      });
      return;
    }
    setSubmitting(true);
    try {
      const token = await getUserToken();
      const res = await fetch(`${API_URL}/wallet/withdraw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_token: token, amount }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({
          type: "success",
          text: "Withdrawal request submitted successfully!",
        });
        setWithdrawForm({ amount: "" });
        loadUser();
        loadWithdrawals();
      } else {
        setMessage({ type: "error", text: data.msg || "Withdrawal failed" });
      }
    } catch (e) {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Screen padded>
        <View style={{ marginBottom: 24, gap: 4 }}>
          <View style={{ width: 60, height: 11, borderRadius: radius.xs, backgroundColor: "#e5e7eb", opacity: 0.6 }} />
          <View style={{ width: 120, height: 30, borderRadius: radius.sm, backgroundColor: "#e5e7eb", opacity: 0.6 }} />
        </View>
        <SkeletonLoader variant="card" count={1} />
        <SkeletonLoader variant="card" count={1} />
      </Screen>
    );
  }

  const allTransactions = [
    ...transactions,
    ...withdrawals.map((w) => ({
      ...w,
      amount: w.amount,
      date: w.requestedAt || w.createdAt,
      reference: w._id,
      description: "Withdrawal",
      type: "withdrawal",
      status: w.status,
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt),
    )
    .slice(0, 10);

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerEyebrow}>My Earnings</Text>
        <Text style={styles.headerTitle}>Wallet</Text>

        {/* Toast rendered at root level below */}

        {/* Balance Hero */}
        <View style={[styles.balanceCard, { backgroundColor: theme.colors.navSurface }]}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceChip}>TOTAL BALANCE</Text>
            <TouchableOpacity onPress={() => setShowBalance(!showBalance)} hitSlop={8}>
              {showBalance
                ? <Eye size={18} color="rgba(240,239,224,0.45)" />
                : <EyeOff size={18} color="rgba(240,239,224,0.45)" />}
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceAmount}>
            {showBalance
              ? formatCurrency((user?.wallet?.availableBalance || 0) + (user?.wallet?.lockedBalance || 0))
              : "₦ ••••••"}
          </Text>
          <View style={styles.balanceDivider} />
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>₦{(user?.wallet?.availableBalance || 0).toLocaleString()}</Text>
              <View style={styles.statMeta}>
                <View style={[styles.statDot, { backgroundColor: theme.colors.brand }]} />
                <Text style={styles.statLabel}>Available</Text>
              </View>
            </View>
            <View style={styles.statSep} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>₦{(user?.wallet?.lockedBalance || 0).toLocaleString()}</Text>
              <View style={styles.statMeta}>
                <View style={[styles.statDot, { backgroundColor: theme.colors.warning }]} />
                <Text style={styles.statLabel}>Locked</Text>
              </View>
            </View>
            <View style={styles.statSep} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>₦{(user?.wallet?.totalEarnings || 0).toLocaleString()}</Text>
              <View style={styles.statMeta}>
                <View style={[styles.statDot, { backgroundColor: theme.colors.success }]} />
                <Text style={styles.statLabel}>Earned</Text>
              </View>
            </View>
          </View>
          {user?.wallet?.lockedBalance > 0 ? (
            <View style={styles.lockedBanner}>
              <AlertCircle size={13} color={theme.colors.warning} />
              <Text style={styles.lockedBannerText}>Locked funds release 1 hour after events end.</Text>
            </View>
          ) : null}
        </View>

        {/* Withdraw */}
        <NeuCard style={styles.section}>
          <Text style={styles.sectionLabel}>Withdraw Funds</Text>
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.colors.textSubtle }]}>Amount (NGN)</Text>
            <View style={[styles.amountRow, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}>
              <Text style={[styles.currencySymbol, { color: theme.colors.textSubtle }]}>₦</Text>
              <TextInput
                style={[styles.amountInput, { color: theme.colors.text }]}
                keyboardType="numeric"
                value={withdrawForm.amount}
                onChangeText={(text) => setWithdrawForm({ amount: text })}
                placeholder="0"
                placeholderTextColor={theme.colors.textSubtle}
              />
              <TouchableOpacity
                style={[styles.maxBtn, { backgroundColor: theme.colors.brandTint }]}
                onPress={() => setWithdrawForm({ amount: user?.wallet?.availableBalance?.toString() || "0" })}
              >
                <Text style={[styles.maxBtnText, { color: theme.colors.brand }]}>MAX</Text>
              </TouchableOpacity>
            </View>
            {withdrawForm.amount && parseFloat(withdrawForm.amount) > 0 ? (
              <Text style={[styles.feeNote, { color: theme.colors.textSubtle }]}>
                You receive ₦{((parseFloat(withdrawForm.amount) || 0) * 0.98).toFixed(2)} after 2% fee
              </Text>
            ) : null}
          </View>

          {!bankDetails.accountNumber ? (
            <View style={[styles.infoBox, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}>
              <AlertCircle size={14} color={theme.colors.warning} />
              <Text style={[styles.infoBoxText, { color: theme.colors.textMuted }]}>Add bank details below before withdrawing.</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.colors.brand },
              (!bankDetails.accountNumber || !withdrawForm.amount || parseFloat(withdrawForm.amount) <= 0) && styles.disabledBtn]}
            onPress={handleWithdraw}
            disabled={submitting || !bankDetails.accountNumber || !withdrawForm.amount || parseFloat(withdrawForm.amount) <= 0}
          >
            {submitting
              ? <ActivityIndicator size="small" color={theme.colors.textOnBrand} />
              : <><Download size={18} color={theme.colors.textOnBrand} /><Text style={styles.primaryBtnText}>Withdraw Now</Text></>}
          </TouchableOpacity>
        </NeuCard>

        {/* Bank Account */}
        <NeuCard style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>Bank Account</Text>
            {bankDetails.accountNumber && !editingBankDetails ? (
              <TouchableOpacity onPress={() => setEditingBankDetails(true)} style={styles.editBtn}>
                <Edit size={13} color={theme.colors.brand} />
                <Text style={[styles.editBtnText, { color: theme.colors.brand }]}>Edit</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {!bankDetails.accountNumber || editingBankDetails ? (
            <View style={styles.bankForm}>
              {[
                { label: "Account Name", key: "accountName", placeholder: "John Doe", keyboard: "default" },
                { label: "Account Number", key: "accountNumber", placeholder: "0123456789", keyboard: "numeric", maxLen: 10 },
              ].map((f) => (
                <View key={f.key} style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: theme.colors.textSubtle }]}>{f.label}</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border, color: theme.colors.text }]}
                    value={bankDetails[f.key]}
                    onChangeText={(t) => setBankDetails({ ...bankDetails, [f.key]: t })}
                    placeholder={f.placeholder}
                    placeholderTextColor={theme.colors.textSubtle}
                    keyboardType={f.keyboard}
                    maxLength={f.maxLen}
                  />
                </View>
              ))}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.colors.textSubtle }]}>Bank</Text>
                <TouchableOpacity
                  style={[styles.dropdownBtn, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}
                  onPress={() => setShowBankDropdown(!showBankDropdown)}
                >
                  <Text style={[{ flex: 1, fontSize: 15 }, bankDetails.bankCode ? { color: theme.colors.text } : { color: theme.colors.textSubtle }]}>
                    {bankDetails.bankCode ? NIGERIAN_BANKS.find((b) => b.code === bankDetails.bankCode)?.name : "Select Bank"}
                  </Text>
                  <ChevronDown size={16} color={theme.colors.textSubtle} />
                </TouchableOpacity>
                {showBankDropdown ? (
                  <View style={[styles.dropdownList, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                      {NIGERIAN_BANKS.map((bank) => (
                        <TouchableOpacity
                          key={bank.code}
                          style={[styles.dropdownItem, { borderBottomColor: theme.colors.border },
                            bankDetails.bankCode === bank.code && { backgroundColor: theme.colors.brandTint }]}
                          onPress={() => { setBankDetails({ ...bankDetails, bankCode: bank.code }); setShowBankDropdown(false); }}
                        >
                          <Text style={[styles.dropdownItemText, { color: bankDetails.bankCode === bank.code ? theme.colors.brand : theme.colors.text }]}>
                            {bank.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                ) : null}
              </View>
              <View style={styles.bankFormBtns}>
                {bankDetails.accountNumber ? (
                  <TouchableOpacity
                    style={[styles.ghostBtn, { borderColor: theme.colors.border }]}
                    onPress={() => { setEditingBankDetails(false); if (user?.wallet?.bankDetails) setBankDetails(user.wallet.bankDetails); }}
                  >
                    <Text style={[styles.ghostBtnText, { color: theme.colors.textMuted }]}>Cancel</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  style={[styles.primaryBtn, { flex: 1, backgroundColor: theme.colors.brand }, submitting && styles.disabledBtn]}
                  onPress={handleSaveBankDetails}
                  disabled={submitting}
                >
                  {submitting
                    ? <ActivityIndicator size="small" color={theme.colors.textOnBrand} />
                    : <><CheckSquare size={18} color={theme.colors.textOnBrand} /><Text style={styles.primaryBtnText}>Save Details</Text></>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.bankViewGrid}>
              {[
                { label: "Account Name", value: bankDetails.accountName },
                { label: "Account Number", value: bankDetails.accountNumber },
                { label: "Bank", value: NIGERIAN_BANKS.find((b) => b.code === bankDetails.bankCode)?.name },
              ].map((row) => (
                <View key={row.label} style={[styles.bankViewRow, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}>
                  <Text style={[styles.bankViewLabel, { color: theme.colors.textSubtle }]}>{row.label}</Text>
                  <Text style={[styles.bankViewValue, { color: theme.colors.text }]}>{row.value}</Text>
                </View>
              ))}
            </View>
          )}
        </NeuCard>

        {/* Transactions */}
        <NeuCard style={styles.section}>
          <Text style={styles.sectionLabel}>Transaction History</Text>
          {allTransactions.length === 0 ? (
            <EmptyState
              emoji="💳"
              title="No transactions yet"
              subtitle="Your wallet history will appear here once you top up or make a payment."
            />
          ) : (
            <View style={styles.txList}>
              {allTransactions.map((item, index) => {
                const isIncome = ["ticket_sale", "deposit", "refund_received"].includes(item.type);
                const statusColor = item.status === "completed" ? theme.colors.success
                  : item.status === "pending" ? theme.colors.warning : theme.colors.error;
                return (
                  <View key={item._id || index} style={[styles.txRow, { borderBottomColor: theme.colors.border }]}>
                    <View style={[styles.txIcon, { backgroundColor: isIncome ? "rgba(61,158,74,0.12)" : theme.colors.surfaceMuted }]}>
                      {isIncome
                        ? <Plus size={18} color={theme.colors.success} />
                        : <Download size={18} color={theme.colors.textSubtle} />}
                    </View>
                    <View style={styles.txInfo}>
                      <Text style={[styles.txDesc, { color: theme.colors.text }]}>
                        {item.description || (item.type === "withdrawal" ? "Withdrawal" : "Transaction")}
                      </Text>
                      <Text style={[styles.txDate, { color: theme.colors.textSubtle }]}>{formatDate(item.date || item.createdAt)}</Text>
                    </View>
                    <View style={styles.txRight}>
                      <Text style={[styles.txAmount, { color: isIncome ? theme.colors.success : theme.colors.text }]}>
                        {isIncome ? "+" : "-"}{formatCurrency(Math.abs(item.amount))}
                      </Text>
                      {item.status ? (
                        <Text style={[styles.txStatus, { color: statusColor }]}>{item.status}</Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </NeuCard>

        <View style={{ height: 120 }} />
      </ScrollView>
      <Toast
        visible={!!message.text}
        message={message.text}
        type={message.type || "info"}
        onDismiss={() => setMessage({ type: "", text: "" })}
      />
    </Screen>
  );
}

const getStyles = (theme) => StyleSheet.create({
  scrollContainer: { paddingTop: 24, paddingBottom: 24, paddingHorizontal: spacing.page },
  headerEyebrow: {
    fontSize: 11, fontWeight: "700", fontFamily: "PlusJakartaSans_700Bold",
    color: theme.colors.accentWallet, textTransform: "uppercase", letterSpacing: 1.2,
    marginBottom: 4, lineHeight: 16,
  },
  headerTitle: {
    fontSize: 32, fontWeight: "700", fontFamily: "SpaceGrotesk_700Bold",
    color: theme.colors.text, letterSpacing: -0.5, marginBottom: 20, lineHeight: 38,
  },
  // Balance card
  balanceCard: {
    borderRadius: radius.xl, padding: 24, marginBottom: 16,
    shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  balanceHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  balanceChip: {
    fontSize: 10, fontWeight: "800", fontFamily: "PlusJakartaSans_700Bold",
    color: "rgba(200,230,48,0.7)", letterSpacing: 1.5, textTransform: "uppercase",
  },
  balanceAmount: {
    fontSize: 38, fontWeight: "800", fontFamily: "SpaceGrotesk_700Bold",
    color: "#F0EFE0", marginBottom: 20, letterSpacing: -1,
  },
  balanceDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.1)", marginBottom: 20 },
  statsRow: { flexDirection: "row", alignItems: "center" },
  statItem: { flex: 1, alignItems: "center" },
  statValue: {
    fontSize: 15, fontWeight: "700", fontFamily: "SpaceGrotesk_700Bold",
    color: "#F0EFE0", marginBottom: 6,
  },
  statMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  statDot: { width: 6, height: 6, borderRadius: 3 },
  statLabel: {
    fontSize: 10, fontWeight: "600", fontFamily: "PlusJakartaSans_600SemiBold",
    color: "rgba(240,239,224,0.5)", textTransform: "uppercase", letterSpacing: 0.8,
  },
  statSep: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.12)" },
  lockedBanner: {
    flexDirection: "row", alignItems: "center", gap: 6, marginTop: 16,
    backgroundColor: "rgba(217,119,6,0.12)", padding: 10, borderRadius: 10,
  },
  lockedBannerText: { flex: 1, fontSize: 12, fontFamily: "PlusJakartaSans_500Medium", color: theme.colors.warning },

  // Sections
  section: { padding: 20, marginBottom: 16 },
  sectionLabel: {
    fontSize: 20, fontWeight: "700", fontFamily: "SpaceGrotesk_700Bold",
    color: theme.colors.text, letterSpacing: -0.3, marginBottom: 16, lineHeight: 26,
  },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 12, fontWeight: "600", fontFamily: "PlusJakartaSans_600SemiBold",
    marginBottom: 6, letterSpacing: 0.3,
  },
  amountRow: {
    flexDirection: "row", alignItems: "center", borderRadius: radius.lg, borderWidth: 1.5, overflow: "hidden",
  },
  currencySymbol: { fontSize: 20, fontWeight: "700", paddingLeft: 16 },
  amountInput: {
    flex: 1, paddingVertical: 14, paddingHorizontal: 8, fontSize: 22, fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  maxBtn: { paddingVertical: 10, paddingHorizontal: 14, marginRight: 4, borderRadius: radius.xxl },
  maxBtnText: { fontSize: 11, fontWeight: "800", fontFamily: "PlusJakartaSans_700Bold", letterSpacing: 0.5 },
  feeNote: { fontSize: 12, fontFamily: "PlusJakartaSans_400Regular", marginTop: 6 },
  infoBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12, borderRadius: radius.md, borderWidth: 1, marginBottom: 14,
  },
  infoBoxText: { flex: 1, fontSize: 13, fontFamily: "PlusJakartaSans_400Regular" },
  primaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderRadius: radius.xxl, paddingVertical: 15,
  },
  primaryBtnText: { fontSize: 15, fontWeight: "700", fontFamily: "PlusJakartaSans_700Bold", color: theme.colors.textOnBrand },
  disabledBtn: { opacity: 0.4 },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  editBtnText: { fontSize: 13, fontWeight: "700", fontFamily: "PlusJakartaSans_700Bold" },

  // Bank form
  bankForm: { gap: 0 },
  textInput: {
    paddingHorizontal: 14, paddingVertical: 13, borderRadius: radius.lg, borderWidth: 1,
    fontSize: 15, fontFamily: "PlusJakartaSans_400Regular",
  },
  dropdownBtn: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 13,
    borderRadius: radius.lg, borderWidth: 1,
  },
  dropdownList: {
    borderRadius: radius.md, borderWidth: 1, marginTop: 6, overflow: "hidden",
  },
  dropdownItem: {
    paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1,
  },
  dropdownItemText: { fontSize: 14, fontFamily: "PlusJakartaSans_400Regular" },
  bankFormBtns: { flexDirection: "row", gap: 10, marginTop: 4 },
  ghostBtn: {
    paddingHorizontal: 18, paddingVertical: 14, borderRadius: radius.xxl, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  ghostBtnText: { fontSize: 14, fontWeight: "600", fontFamily: "PlusJakartaSans_600SemiBold" },

  // Bank view
  bankViewGrid: { gap: 8 },
  bankViewRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 14, borderRadius: radius.md, borderWidth: 1,
  },
  bankViewLabel: { fontSize: 12, fontWeight: "600", fontFamily: "PlusJakartaSans_600SemiBold", letterSpacing: 0.3 },
  bankViewValue: { fontSize: 14, fontWeight: "700", fontFamily: "PlusJakartaSans_700Bold" },

  // Transactions
  emptyState: { alignItems: "center", paddingVertical: 32, gap: 10 },
  emptyTitle: { fontSize: 15, fontWeight: "700", fontFamily: "SpaceGrotesk_700Bold" },
  emptyText: { fontSize: 13, fontFamily: "PlusJakartaSans_400Regular" },
  txList: { gap: 4 },
  txRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 12, borderBottomWidth: 1,
  },
  txIcon: { width: 42, height: 42, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  txInfo: { flex: 1, minWidth: 0 },
  txDesc: { fontSize: 14, fontWeight: "600", fontFamily: "PlusJakartaSans_600SemiBold" },
  txDate: { fontSize: 12, fontFamily: "PlusJakartaSans_400Regular", marginTop: 2 },
  txRight: { alignItems: "flex-end" },
  txAmount: { fontSize: 14, fontWeight: "700", fontFamily: "PlusJakartaSans_700Bold" },
  txStatus: { fontSize: 10, fontWeight: "700", fontFamily: "PlusJakartaSans_700Bold", textTransform: "capitalize", marginTop: 2 },
});
