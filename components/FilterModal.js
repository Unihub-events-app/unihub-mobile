import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import { X, Check } from "lucide-react-native";
import { useTheme } from "../theme/ThemeProvider";

const DATE_OPTIONS = [
  { key: "all", label: "Any Time" },
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
];

const PRICE_OPTIONS = [
  { key: "all", label: "Any Price" },
  { key: "free", label: "Free Only" },
  { key: "paid", label: "Paid Only" },
];

const SORT_OPTIONS = [
  { key: "soonest", label: "Soonest First" },
  { key: "popular", label: "Most Popular" },
  { key: "price_asc", label: "Price: Low to High" },
  { key: "price_desc", label: "Price: High to Low" },
];

const CATEGORY_OPTIONS = [
  "Tech", "Music", "Sports", "Business", "Art", "Food",
  "Health", "Education", "Fashion", "Entertainment", "Gaming", "Travel",
];

export const DEFAULT_FILTERS = {
  date: "all",
  price: "all",
  sort: "soonest",
  categories: [],
};

function FilterRow({ label, options, selected, onSelect, multi = false }) {
  const { theme } = useTheme();
  return (
    <View style={styles.filterGroup}>
      <Text style={[styles.filterLabel, { color: theme.colors.textSubtle }]}>{label}</Text>
      <View style={styles.optionWrap}>
        {options.map((opt) => {
          const isSelected = multi ? selected.includes(opt.key ?? opt) : selected === (opt.key ?? opt);
          return (
            <Pressable
              key={opt.key ?? opt}
              onPress={() => {
                if (multi) {
                  const key = opt.key ?? opt;
                  onSelect(isSelected ? selected.filter((k) => k !== key) : [...selected, key]);
                } else {
                  onSelect(opt.key ?? opt);
                }
              }}
              style={[
                styles.optionPill,
                {
                  backgroundColor: isSelected ? theme.colors.brand : theme.colors.surfaceMuted,
                  borderColor: isSelected ? theme.colors.brand : theme.colors.border,
                },
              ]}
            >
              {isSelected && !multi && <Check size={11} color="#1A1A14" strokeWidth={3} />}
              <Text
                style={[
                  styles.optionText,
                  { color: isSelected ? "#1A1A14" : theme.colors.textMuted },
                ]}
              >
                {opt.label ?? opt}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function FilterModal({ visible, onClose, filters, onApply }) {
  const { theme } = useTheme();
  const [local, setLocal] = useState(filters || DEFAULT_FILTERS);

  const update = (key, val) => setLocal((prev) => ({ ...prev, [key]: val }));

  const activeCount = [
    local.date !== "all" ? 1 : 0,
    local.price !== "all" ? 1 : 0,
    local.categories.length > 0 ? 1 : 0,
    local.sort !== "soonest" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const handleApply = () => {
    onApply(local);
    onClose();
  };

  const handleReset = () => {
    const reset = DEFAULT_FILTERS;
    setLocal(reset);
    onApply(reset);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />

          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Filter & Sort
              {activeCount > 0 && (
                <Text style={{ color: theme.colors.brand }}> ({activeCount})</Text>
              )}
            </Text>
            <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.colors.surfaceMuted }]} hitSlop={8}>
              <X size={16} color={theme.colors.textSubtle} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 24 }}>
            <FilterRow
              label="DATE"
              options={DATE_OPTIONS}
              selected={local.date}
              onSelect={(v) => update("date", v)}
            />

            <View style={[styles.sep, { backgroundColor: theme.colors.border }]} />

            <FilterRow
              label="PRICE"
              options={PRICE_OPTIONS}
              selected={local.price}
              onSelect={(v) => update("price", v)}
            />

            <View style={[styles.sep, { backgroundColor: theme.colors.border }]} />

            <FilterRow
              label="SORT BY"
              options={SORT_OPTIONS}
              selected={local.sort}
              onSelect={(v) => update("sort", v)}
            />

            <View style={[styles.sep, { backgroundColor: theme.colors.border }]} />

            <FilterRow
              label="CATEGORIES"
              options={CATEGORY_OPTIONS}
              selected={local.categories}
              onSelect={(v) => update("categories", v)}
              multi
            />
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              onPress={handleReset}
              style={[styles.resetBtn, { borderColor: theme.colors.border }]}
            >
              <Text style={[styles.resetText, { color: theme.colors.textMuted }]}>Reset</Text>
            </Pressable>
            <Pressable
              onPress={handleApply}
              style={[styles.applyBtn, { backgroundColor: theme.colors.brand }]}
            >
              <Text style={styles.applyText}>Apply Filters</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 44 : 24,
    maxHeight: "88%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  filterGroup: {
    gap: 10,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  optionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_500Medium",
    fontWeight: "500",
  },
  sep: {
    height: 1,
    marginVertical: 4,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 16,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  resetText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  applyText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#1A1A14",
  },
});
