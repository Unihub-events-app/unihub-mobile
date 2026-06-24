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
  PageLoader,
} from "../../components/index.js";
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
    return <PageLoader />;
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
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerTitle}>Wallet</Text>

        {message.text && (
          <View
            style={[
              styles.messageContainer,
              message.type === "error"
                ? styles.errorMessage
                : styles.successMessage,
            ]}
          >
            {message.type === "error" ? (
              <AlertCircle size={20} color="#ef4444" />
            ) : (
              <CheckSquare size={20} color="#10b981" />
            )}
            <Text
              style={[
                styles.messageText,
                message.type === "error"
                  ? styles.errorText
                  : styles.successText,
              ]}
            >
              {message.text}
            </Text>
          </View>
        )}

        <NeuCard style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <TouchableOpacity
              onPress={() => setShowBalance(!showBalance)}
              style={styles.toggleButton}
            >
              {showBalance ? (
                <Eye size={20} color="#6b7280" />
              ) : (
                <EyeOff size={20} color="#6b7280" />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceAmount}>
            {showBalance
              ? formatCurrency(
                  (user?.wallet?.availableBalance || 0) +
                    (user?.wallet?.lockedBalance || 0),
                )
              : "₦••••••"}
          </Text>
          <View style={styles.statsGrid}>
            <NeuInset style={styles.statItem}>
              <View style={styles.statHeader}>
                <View
                  style={[styles.statDot, { backgroundColor: "#10b981" }]}
                />
                <Text style={styles.statLabel}>Available</Text>
              </View>
              <Text style={styles.statValue}>
                ₦{user?.wallet?.availableBalance?.toLocaleString() || 0}
              </Text>
            </NeuInset>
            <NeuInset style={styles.statItem}>
              <View style={styles.statHeader}>
                <View
                  style={[styles.statDot, { backgroundColor: "#f59e0b" }]}
                />
                <Text style={styles.statLabel}>Locked</Text>
              </View>
              <Text style={styles.statValue}>
                ₦{user?.wallet?.lockedBalance?.toLocaleString() || 0}
              </Text>
            </NeuInset>
            <NeuInset style={styles.statItem}>
              <View style={styles.statHeader}>
                <View
                  style={[styles.statDot, { backgroundColor: theme.colors.brand }]}
                />
                <Text style={styles.statLabel}>Total Earned</Text>
              </View>
              <Text style={styles.statValue}>
                ₦{user?.wallet?.totalEarnings?.toLocaleString() || 0}
              </Text>
            </NeuInset>
          </View>

          {user?.wallet?.lockedBalance > 0 && (
            <NeuInset style={styles.lockedNotice}>
              <AlertCircle size={16} color="#f59e0b" />
              <Text style={styles.lockedNoticeText}>
                Locked funds unlock 1 hour after events end.
              </Text>
            </NeuInset>
          )}
        </NeuCard>

        <NeuCard style={styles.withdrawCard}>
          <Text style={styles.sectionTitle}>Withdraw Funds</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>₦</Text>
              <TextInput
                style={styles.amountInput}
                keyboardType="numeric"
                value={withdrawForm.amount}
                onChangeText={(text) => setWithdrawForm({ amount: text })}
                placeholder="0"
              />
              <TouchableOpacity
                style={styles.maxButton}
                onPress={() =>
                  setWithdrawForm({
                    amount: user?.wallet?.availableBalance?.toString() || "0",
                  })
                }
              >
                <Text style={styles.maxButtonText}>MAX</Text>
              </TouchableOpacity>
            </View>
            {withdrawForm.amount && parseFloat(withdrawForm.amount) > 0 && (
              <Text style={styles.feeNotice}>
                You receive ₦
                {((parseFloat(withdrawForm.amount) || 0) * 0.98).toFixed(2)}{" "}
                after 2% fee
              </Text>
            )}
          </View>

          {!bankDetails.accountNumber && (
            <NeuInset style={styles.missingBankNotice}>
              <AlertCircle size={16} color="#f59e0b" />
              <Text style={styles.missingBankText}>
                Add bank details below before withdrawing.
              </Text>
            </NeuInset>
          )}

          <TouchableOpacity
            style={[
              styles.withdrawButton,
              (!bankDetails.accountNumber ||
                !withdrawForm.amount ||
                parseFloat(withdrawForm.amount) <= 0) &&
                styles.disabledButton,
            ]}
            onPress={handleWithdraw}
            disabled={
              submitting ||
              !bankDetails.accountNumber ||
              !withdrawForm.amount ||
              parseFloat(withdrawForm.amount) <= 0
            }
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Download size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.withdrawButtonText}>Withdraw Now</Text>
              </>
            )}
          </TouchableOpacity>
        </NeuCard>

        <NeuCard style={styles.bankDetailsCard}>
          <View style={styles.bankDetailsHeader}>
            <Text style={styles.sectionTitle}>Bank Account</Text>
            {bankDetails.accountNumber && !editingBankDetails && (
              <TouchableOpacity
                onPress={() => setEditingBankDetails(true)}
                style={styles.editButton}
              >
                <Edit size={16} color={theme.colors.brand} style={{ marginRight: 4 }} />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {!bankDetails.accountNumber || editingBankDetails ? (
            <View style={styles.bankFormContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={bankDetails.accountName}
                  onChangeText={(text) =>
                    setBankDetails({ ...bankDetails, accountName: text })
                  }
                  placeholder="John Doe"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Number</Text>
                <TextInput
                  style={styles.textInput}
                  value={bankDetails.accountNumber}
                  onChangeText={(text) =>
                    setBankDetails({ ...bankDetails, accountNumber: text })
                  }
                  placeholder="0123456789"
                  maxLength={10}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bank</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowBankDropdown(!showBankDropdown)}
                >
                  <Text
                    style={
                      bankDetails.bankCode
                        ? styles.dropdownText
                        : styles.dropdownPlaceholder
                    }
                  >
                    {bankDetails.bankCode
                      ? NIGERIAN_BANKS.find(
                          (b) => b.code === bankDetails.bankCode,
                        )?.name
                      : "Select Bank"}
                  </Text>
                  <ChevronDown size={16} color="#6b7280" />
                </TouchableOpacity>
                {showBankDropdown && (
                  <View style={styles.bankDropdown}>
                    <ScrollView nestedScrollEnabled>
                      {NIGERIAN_BANKS.map((bank) => (
                        <TouchableOpacity
                          key={bank.code}
                          style={[
                            styles.bankOption,
                            bankDetails.bankCode === bank.code &&
                              styles.selectedBankOption,
                          ]}
                          onPress={() => {
                            setBankDetails({
                              ...bankDetails,
                              bankCode: bank.code,
                            });
                            setShowBankDropdown(false);
                          }}
                        >
                          <Text
                            style={
                              bankDetails.bankCode === bank.code
                                ? styles.selectedBankText
                                : styles.bankOptionText
                            }
                          >
                            {bank.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
              <View style={styles.bankFormButtons}>
                {bankDetails.accountNumber && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setEditingBankDetails(false);
                      if (user?.wallet?.bankDetails)
                        setBankDetails(user.wallet.bankDetails);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.saveBankButton,
                    submitting && styles.disabledButton,
                  ]}
                  onPress={handleSaveBankDetails}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <CheckSquare
                        size={20}
                        color="#fff"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.saveBankButtonText}>
                        Save Details
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.bankDetailsViewContainer}>
              <NeuInset style={styles.bankDetailRow}>
                <Text style={styles.bankDetailLabel}>Account Name</Text>
                <Text style={styles.bankDetailValue}>
                  {bankDetails.accountName}
                </Text>
              </NeuInset>
              <NeuInset style={styles.bankDetailRow}>
                <Text style={styles.bankDetailLabel}>Account Number</Text>
                <Text style={styles.bankDetailValue}>
                  {bankDetails.accountNumber}
                </Text>
              </NeuInset>
              <NeuInset style={styles.bankDetailRow}>
                <Text style={styles.bankDetailLabel}>Bank</Text>
                <Text style={styles.bankDetailValue}>
                  {
                    NIGERIAN_BANKS.find((b) => b.code === bankDetails.bankCode)
                      ?.name
                  }
                </Text>
              </NeuInset>
            </View>
          )}
        </NeuCard>

        <NeuCard style={styles.transactionsCard}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          {allTransactions.length === 0 ? (
            <NeuInset style={styles.emptyTransactionsContainer}>
              <ShieldCheck size={48} color="#6b7280" />
              <Text style={styles.emptyTransactionsTitle}>
                No transactions yet
              </Text>
              <Text style={styles.emptyTransactionsText}>
                Your history will appear here
              </Text>
            </NeuInset>
          ) : (
            <View style={styles.transactionsList}>
              {allTransactions.map((item, index) => {
                const isIncome = [
                  "ticket_sale",
                  "deposit",
                  "refund_received",
                ].includes(item.type);
                const statusColor =
                  item.status === "completed"
                    ? "#10b981"
                    : item.status === "pending"
                      ? "#f59e0b"
                      : "#ef4444";
                return (
                  <View key={item._id || index} style={styles.transactionRow}>
                    <View
                      style={[
                        styles.transactionIconContainer,
                        isIncome
                          ? styles.incomeIconContainer
                          : styles.withdrawIconContainer,
                      ]}
                    >
                      {isIncome ? (
                        <Plus size={20} color="#10b981" />
                      ) : (
                        <Download size={20} color="#6b7280" />
                      )}
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionDescription}>
                        {item.description ||
                          (item.type === "withdrawal"
                            ? "Withdrawal"
                            : "Transaction")}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {formatDate(item.date || item.createdAt)}
                      </Text>
                    </View>
                    <View style={styles.transactionAmountContainer}>
                      <Text style={styles.transactionAmount}>
                        {isIncome ? "+" : "-"}
                        {formatCurrency(Math.abs(item.amount))}
                      </Text>
                      {item.status && (
                        <Text
                          style={[
                            styles.transactionStatus,
                            { color: statusColor },
                          ]}
                        >
                          {item.status}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </NeuCard>

        <View style={{ height: 120 }} />
      </ScrollView>
    </Screen>
  );
}

const getStyles = (theme) => StyleSheet.create({
  scrollContainer: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
    color: theme.colors.text,
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.textSubtle,
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  errorMessage: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderWidth: 1,
  },
  successMessage: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    borderWidth: 1,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  errorText: {
    color: theme.colors.error,
  },
  successText: {
    color: theme.colors.success,
  },
  balanceCard: {
    padding: 24,
    marginBottom: 16,
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.textSubtle,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  toggleButton: {
    padding: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
    color: theme.colors.text,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statItem: {
    flex: 1,
    padding: 12,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: theme.colors.textSubtle,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.text,
  },
  lockedNotice: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
  },
  lockedNoticeText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.warning,
  },
  withdrawCard: {
    padding: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.textSubtle,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.textSubtle,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.textSubtle,
    paddingLeft: 16,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.text,
  },
  maxButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  maxButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.brand,
  },
  feeNotice: {
    fontSize: 12,
    color: theme.colors.textSubtle,
    marginTop: 8,
  },
  missingBankNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    marginBottom: 16,
  },
  missingBankText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.warning,
  },
  withdrawButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.brand,
    borderRadius: 16,
    paddingVertical: 14,
    shadowColor: theme.colors.brand,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  withdrawButtonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.5,
  },
  bankDetailsCard: {
    padding: 24,
    marginBottom: 16,
  },
  bankDetailsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.brand,
  },
  bankFormContainer: {
    gap: 12,
  },
  textInput: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    fontSize: 16,
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 16,
  },
  dropdownText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: theme.colors.textMuted,
  },
  bankDropdown: {
    marginTop: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: theme.colors.text,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  bankOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
  },
  selectedBankOption: {
    backgroundColor: "#dbeafe",
  },
  bankOptionText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  selectedBankText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e40af",
  },
  bankFormButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textSubtle,
  },
  saveBankButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.brand,
    borderRadius: 16,
    paddingVertical: 12,
  },
  saveBankButtonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: "700",
  },
  bankDetailsViewContainer: {
    gap: 10,
  },
  bankDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bankDetailLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.textSubtle,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  bankDetailValue: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.text,
  },
  transactionsCard: {
    padding: 24,
  },
  emptyTransactionsContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyTransactionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textSubtle,
  },
  emptyTransactionsText: {
    fontSize: 14,
    color: theme.colors.textSubtle,
  },
  transactionsList: {
    gap: 10,
  },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  incomeIconContainer: {
    backgroundColor: "#d1fae5",
  },
  withdrawIconContainer: {
    backgroundColor: theme.colors.surface,
  },
  transactionInfo: {
    flex: 1,
    minWidth: 0,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text,
  },
  transactionDate: {
    fontSize: 12,
    color: theme.colors.textSubtle,
  },
  transactionAmountContainer: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text,
  },
  transactionStatus: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "capitalize",
  },
});
