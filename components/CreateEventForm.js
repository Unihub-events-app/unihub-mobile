import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Switch,
  Platform,
} from "react-native";

// Fallback: import DateTimePicker when installed
let DateTimePicker = null;
try {
  DateTimePicker = require("@react-native-community/datetimepicker").default;
} catch (e) {
  console.log("DateTimePicker not installed yet!");
}

// Fallback: import ImagePicker when installed
let ImagePicker = null;
try {
  ImagePicker = require("expo-image-picker");
} catch (e) {
  console.log("ImagePicker not available");
}

import { useRouter } from "expo-router";
import { Image } from "react-native";
import {
  Upload,
  MapPin,
  Calendar,
  Delete,
  Plus,
  Settings,
  CheckSquare,
  ChevronRight,
  Lock,
  ChevronLeft,
} from "lucide-react-native";
import { API_URL } from "../lib/config";
import { getUserToken, getAdminToken } from "../lib/auth";
import { authenticatedFetch } from "../lib/api";
import { NeuCard, NeuInset } from "./index";
import { useTheme } from "../theme/ThemeProvider";
import { supportedCountries } from "../data/countries";

const STEP_NAMES = ["Basics", "Schedule", "Tickets & Access", "Media"];

export default function CreateEventForm() {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const router = useRouter();
  const admin_id = getAdminToken();
  const user_id = getUserToken();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState({ profile: false, cover: false });
  const [showBankDropdown, setShowBankDropdown] = useState({
    category: false,
    country: false,
    visibility: false,
    repeatFrequency: false,
  });

  // Date and Time Picker State
  const [showPicker, setShowPicker] = useState({
    date: false,
    startTime: false,
    endTime: false,
  });
  const [tempDate, setTempDate] = useState(new Date());

  const [formData, setFormData] = useState({
    name: "",
    venue: "",
    address: "",
    lat: "",
    lng: "",
    category: "",
    country: "",
    eventDate: "",
    startTime: "",
    endTime: "",
    profile: "",
    cover: "",
    description: "",
    ticketTypes: [
      { name: "General Admission", price: 0, capacity: 100, description: "" },
    ],
    registrationQuestions: [],
    visibility: "public",
    accessCode: "",
    requiresApproval: false,
    waitlistEnabled: false,
    hideLocation: false,
    isPremium: false,
    repeatFrequency: "none",
    repeatCount: 2,
  });

  // Handle Date/Time Picker Changes
  const handleDateChange = (event, selectedDate) => {
    setShowPicker({ ...showPicker, date: false });
    if (selectedDate) {
      setTempDate(selectedDate);
      // Format: YYYY-MM-DD
      const formattedDate = selectedDate.toISOString().split("T")[0];
      setFormData({ ...formData, eventDate: formattedDate });
    }
  };

  const handleTimeChange = (type) => (event, selectedTime) => {
    setShowPicker({ ...showPicker, [type]: false });
    if (selectedTime) {
      setTempDate(selectedTime);
      // Format: HH:MM
      const hours = selectedTime.getHours().toString().padStart(2, "0");
      const minutes = selectedTime.getMinutes().toString().padStart(2, "0");
      const formattedTime = `${hours}:${minutes}`;
      setFormData({ ...formData, [type]: formattedTime });
    }
  };

  useEffect(() => {
    const fetchUserCountry = async () => {
      if (!user_id) return;
      try {
        const res = await fetch(`${API_URL}/user/details`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_token: user_id }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.country)
            setFormData((prev) => ({ ...prev, country: data.country }));
        }
      } catch {}
    };
    fetchUserCountry();
  }, [user_id]);

  const uploadImage = async (field) => {
    if (!ImagePicker) {
      alert("Image picker not available on this device.");
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permission to access photos is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: field === "profile" ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    setUploading((prev) => ({ ...prev, [field]: true }));

    try {
      const token = await getUserToken();
      const formData = new FormData();
      formData.append("file", {
        uri: asset.uri,
        name: `${field}_${Date.now()}.jpg`,
        type: asset.mimeType || "image/jpeg",
      });

      const res = await fetch(`${API_URL}/upload/image`, {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const url = data.url || data.secure_url || data.imageUrl;
        if (url) {
          setFormData((prev) => ({ ...prev, [field]: url }));
        } else {
          alert("Upload succeeded but no URL returned.");
        }
      } else {
        alert("Image upload failed. Please try again.");
      }
    } catch (e) {
      console.error("Upload error:", e);
      alert("Upload error. Check your connection.");
    } finally {
      setUploading((prev) => ({ ...prev, [field]: false }));
    }
  };

  const addTicketType = () =>
    setFormData((prev) => ({
      ...prev,
      ticketTypes: [
        ...prev.ticketTypes,
        { name: "", price: 0, capacity: 100, description: "" },
      ],
    }));

  const updateTicketType = (index, field, value) => {
    const t = [...formData.ticketTypes];
    t[index][field] = value;
    setFormData((prev) => ({ ...prev, ticketTypes: t }));
  };

  const removeTicketType = (index) =>
    setFormData((prev) => ({
      ...prev,
      ticketTypes: prev.ticketTypes.filter((_, i) => i !== index),
    }));

  const generateAccessCode = () =>
    `UHB${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")}`;

  const lookupAddress = async () => {
    try {
      if (!formData.venue) return;
      const res = await fetch(
        `${API_URL}/maps/search?q=${encodeURIComponent(formData.venue)}`,
      );
      if (!res.ok) return;
      const json = await res.json();
      if (Array.isArray(json) && json.length > 0) {
        const top = json[0];
        setFormData((f) => ({
          ...f,
          venue: top.display_name || f.venue,
          address: top.display_name || f.address,
          lat: top.lat || f.lat,
          lng: top.lon || f.lng,
        }));
      }
    } catch {}
  };

  const handleEventFormSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (!formData.eventDate || !formData.startTime) {
      alert("Please provide event date and start time");
      setIsSubmitting(false);
      return;
    }
    const [year, month, day] = formData.eventDate.split("-");
    const date = `${day}/${month}/${year}`;
    const fmt = (t) => {
      const [h, m] = t.split(":");
      const hr = parseInt(h);
      return `${hr % 12 || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
    };
    const time = fmt(formData.startTime);
    const endDate = formData.endTime ? date : undefined;
    const endTime = formData.endTime ? fmt(formData.endTime) : undefined;
    const minPrice = formData.ticketTypes.length
      ? Math.min(...formData.ticketTypes.map((t) => Number(t.price)))
      : 0;
    const totalCapacity = formData.ticketTypes.length
      ? formData.ticketTypes.reduce((a, t) => a + Number(t.capacity), 0)
      : 0;

    try {
      const response = await authenticatedFetch("/event/post/event", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name,
          venue: formData.venue,
          address: formData.address || undefined,
          lat: formData.lat ? Number(formData.lat) : undefined,
          lng: formData.lng ? Number(formData.lng) : undefined,
          date,
          time,
          endDate,
          endTime,
          description: formData.description,
          category: formData.category || undefined,
          country: formData.country || undefined,
          price: minPrice,
          capacity: totalCapacity,
          ticketTypes: formData.ticketTypes,
          registrationQuestions: formData.registrationQuestions,
          profile: formData.profile !== "" ? formData.profile : undefined,
          cover: formData.cover !== "" ? formData.cover : undefined,
          visibility: formData.visibility,
          accessCode:
            formData.visibility === "private" ? formData.accessCode : undefined,
          requiresApproval: formData.requiresApproval,
          waitlistEnabled: formData.waitlistEnabled,
          hideLocation: formData.hideLocation,
          repeatFrequency: formData.repeatFrequency,
          repeatCount: formData.repeatCount,
          isPremium: false,
        }),
      });
      const data = await response.json();
      if (response.status === 200) {
        alert("Event created successfully!");
        setTimeout(() => {
          router.push("/(app)/dashboard");
        }, 1500);
      } else {
        alert(data.msg || "Failed to create event. Please try again.");
        setIsSubmitting(false);
      }
    } catch {
      alert("An error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Step indicator */}
      <View style={styles.stepIndicatorContainer}>
        <View style={styles.stepTopRow}>
          <View>
            <Text style={styles.stepLabel}>Step {step} of 4</Text>
            <Text style={styles.stepName}>{STEP_NAMES[step - 1]}</Text>
          </View>
          <View style={styles.stepPills}>
            {[1, 2, 3, 4].map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => s < step && setStep(s)}
                style={[
                  styles.stepPill,
                  s === step ? styles.stepPillActive
                    : s < step ? styles.stepPillDone
                    : styles.stepPillTodo,
                ]}
                disabled={s > step}
              />
            ))}
          </View>
        </View>
        <View style={styles.stepProgressBar}>
          <View
            style={[
              styles.stepProgressFill,
              { width: `${(step / 4) * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* Form */}
      <ScrollView
        style={styles.formContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1: Basics */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Event Title</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) =>
                  setFormData({ ...formData, name: text })
                }
                placeholder="e.g. Annual Tech Conference 2025"
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Category</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() =>
                    setShowBankDropdown({
                      ...showBankDropdown,
                      category: !showBankDropdown.category,
                    })
                  }
                >
                  <Text
                    style={
                      formData.category
                        ? styles.dropdownText
                        : styles.dropdownPlaceholder
                    }
                  >
                    {formData.category || "Select category"}
                  </Text>
                  <ChevronRight
                    size={16}
                    color={theme.colors.textSubtle}
                    style={{ transform: [{ rotate: "90deg" }] }}
                  />
                </TouchableOpacity>
                {showBankDropdown.category && (
                  <NeuInset style={styles.dropdown}>
                    {[
                      "Tech",
                      "Music",
                      "Sports",
                      "Workshops",
                      "Meetups",
                      "Festivals",
                      "Conferences",
                      "Competitions",
                    ].map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setFormData({ ...formData, category: c });
                          setShowBankDropdown({
                            ...showBankDropdown,
                            category: false,
                          });
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </NeuInset>
                )}
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Country</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() =>
                    setShowBankDropdown({
                      ...showBankDropdown,
                      country: !showBankDropdown.country,
                    })
                  }
                >
                  <Text
                    style={
                      formData.country
                        ? styles.dropdownText
                        : styles.dropdownPlaceholder
                    }
                  >
                    {formData.country || "Select country"}
                  </Text>
                  <ChevronRight
                    size={16}
                    color={theme.colors.textSubtle}
                    style={{ transform: [{ rotate: "90deg" }] }}
                  />
                </TouchableOpacity>
                {showBankDropdown.country && (
                  <NeuInset style={styles.dropdown}>
                    {supportedCountries.map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setFormData({ ...formData, country: c });
                          setShowBankDropdown({
                            ...showBankDropdown,
                            country: false,
                          });
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </NeuInset>
                )}
                {formData.country && (
                  <Text style={styles.helperText}>
                    Visible to {formData.country} users first
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Venue</Text>
              <View style={styles.venueInputRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={formData.venue}
                  onChangeText={(text) =>
                    setFormData({ ...formData, venue: text })
                  }
                  placeholder="Search for a venue..."
                />
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={lookupAddress}
                >
                  <MapPin size={20} color={theme.colors.brand} />
                </TouchableOpacity>
              </View>
              {formData.address && (
                <View style={styles.addressRow}>
                  <MapPin
                    size={14}
                    color={theme.colors.textSubtle}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.helperText}>{formData.address}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() =>
                setFormData({
                  ...formData,
                  hideLocation: !formData.hideLocation,
                })
              }
            >
              <View
                style={[
                  styles.checkbox,
                  formData.hideLocation && styles.checkedCheckbox,
                ]}
              >
                {formData.hideLocation && (
                  <CheckSquare size={12} color="#1A1A14" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>
                Hide location until registration is approved
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Schedule */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Date</Text>
                {DateTimePicker ? (
                  <TouchableOpacity
                    style={styles.input}
                    onPress={() => setShowPicker({ ...showPicker, date: true })}
                  >
                    <Text
                      style={[
                        styles.inputText,
                        !formData.eventDate && styles.placeholderText,
                      ]}
                    >
                      {formData.eventDate || "YYYY-MM-DD"}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TextInput
                    style={styles.input}
                    value={formData.eventDate}
                    onChangeText={(text) =>
                      setFormData({ ...formData, eventDate: text })
                    }
                    placeholder="YYYY-MM-DD"
                  />
                )}
              </View>
              <View
                style={[
                  styles.inputGroup,
                  { flex: 1, marginLeft: 4, marginRight: 4 },
                ]}
              >
                <Text style={styles.inputLabel}>Start Time</Text>
                {DateTimePicker ? (
                  <TouchableOpacity
                    style={styles.input}
                    onPress={() =>
                      setShowPicker({ ...showPicker, startTime: true })
                    }
                  >
                    <Text
                      style={[
                        styles.inputText,
                        !formData.startTime && styles.placeholderText,
                      ]}
                    >
                      {formData.startTime || "HH:MM"}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TextInput
                    style={styles.input}
                    value={formData.startTime}
                    onChangeText={(text) =>
                      setFormData({ ...formData, startTime: text })
                    }
                    placeholder="HH:MM"
                  />
                )}
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>
                  End Time <Text style={styles.optionalLabel}>(optional)</Text>
                </Text>
                {DateTimePicker ? (
                  <TouchableOpacity
                    style={styles.input}
                    onPress={() =>
                      setShowPicker({ ...showPicker, endTime: true })
                    }
                  >
                    <Text
                      style={[
                        styles.inputText,
                        !formData.endTime && styles.placeholderText,
                      ]}
                    >
                      {formData.endTime || "HH:MM"}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TextInput
                    style={styles.input}
                    value={formData.endTime}
                    onChangeText={(text) =>
                      setFormData({ ...formData, endTime: text })
                    }
                    placeholder="HH:MM"
                  />
                )}
              </View>
            </View>

            <NeuInset style={styles.settingsContainer}>
              <View style={styles.settingsHeader}>
                <Settings
                  size={16}
                  color={theme.colors.text}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.settingsTitle}>Recurring Settings</Text>
              </View>
              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.smallLabel}>Frequency</Text>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() =>
                      setShowBankDropdown({
                        ...showBankDropdown,
                        repeatFrequency: !showBankDropdown.repeatFrequency,
                      })
                    }
                  >
                    <Text style={styles.dropdownText}>
                      {formData.repeatFrequency === "none"
                        ? "One-time Event"
                        : formData.repeatFrequency.charAt(0).toUpperCase() +
                          formData.repeatFrequency.slice(1)}
                    </Text>
                    <ChevronRight
                      size={16}
                      color={theme.colors.textSubtle}
                      style={{ transform: [{ rotate: "90deg" }] }}
                    />
                  </TouchableOpacity>
                  {showBankDropdown.repeatFrequency && (
                    <NeuInset style={styles.dropdown}>
                      {["none", "daily", "weekly", "monthly"].map((f) => (
                        <TouchableOpacity
                          key={f}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setFormData({ ...formData, repeatFrequency: f });
                            setShowBankDropdown({
                              ...showBankDropdown,
                              repeatFrequency: false,
                            });
                          }}
                        >
                          <Text style={styles.dropdownItemText}>
                            {f === "none"
                              ? "One-time Event"
                              : f.charAt(0).toUpperCase() + f.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </NeuInset>
                  )}
                </View>
                {formData.repeatFrequency !== "none" && (
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.smallLabel}>Total Occurrences</Text>
                    <TextInput
                      style={styles.input}
                      value={String(formData.repeatCount)}
                      onChangeText={(text) =>
                        setFormData({
                          ...formData,
                          repeatCount: parseInt(text) || 2,
                        })
                      }
                      keyboardType="numeric"
                    />
                  </View>
                )}
              </View>
            </NeuInset>
          </View>
        )}

        {/* Step 3: Tickets & Access */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <View style={styles.ticketTypesHeader}>
              <Text style={styles.ticketTypesTitle}>Ticket Types</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={addTicketType}
              >
                <Plus size={16} color={theme.colors.brand} style={{ marginRight: 4 }} />
                <Text style={styles.addButtonText}>Add Ticket</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.ticketTypesContainer}>
              {formData.ticketTypes.map((ticket, idx) => (
                <NeuInset key={idx} style={styles.ticketCard}>
                  <TextInput
                    style={[styles.input, { marginBottom: 12 }]}
                    value={ticket.name}
                    onChangeText={(text) => updateTicketType(idx, "name", text)}
                    placeholder="Name"
                  />
                  <View style={styles.ticketRow}>
                    <View
                      style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}
                    >
                      <Text style={styles.smallLabel}>Price</Text>
                      <View style={styles.currencyInputContainer}>
                        <Text style={styles.currencySymbol}>₦</Text>
                        <TextInput
                          style={[styles.input, { paddingLeft: 28 }]}
                          value={String(ticket.price)}
                          onChangeText={(text) =>
                            updateTicketType(idx, "price", text)
                          }
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                    <View
                      style={[
                        styles.inputGroup,
                        { flex: 1, marginLeft: 4, marginRight: 4 },
                      ]}
                    >
                      <Text style={styles.smallLabel}>Capacity</Text>
                      <TextInput
                        style={styles.input}
                        value={String(ticket.capacity)}
                        onChangeText={(text) =>
                          updateTicketType(idx, "capacity", text)
                        }
                        keyboardType="numeric"
                      />
                    </View>
                    <View
                      style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}
                    >
                      <Text style={styles.smallLabel}>Description</Text>
                      <TextInput
                        style={styles.input}
                        value={ticket.description}
                        onChangeText={(text) =>
                          updateTicketType(idx, "description", text)
                        }
                        placeholder="Optional"
                      />
                    </View>
                    {formData.ticketTypes.length > 1 && (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => removeTicketType(idx)}
                      >
                        <Delete size={20} color={theme.colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                </NeuInset>
              ))}
            </View>

            <NeuInset style={styles.settingsContainer}>
              <Text style={styles.settingsTitle}>Registration & Access</Text>
              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.smallLabel}>Visibility</Text>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() =>
                      setShowBankDropdown({
                        ...showBankDropdown,
                        visibility: !showBankDropdown.visibility,
                      })
                    }
                  >
                    <Text style={styles.dropdownText}>
                      {formData.visibility === "public"
                        ? "Public (visible to everyone)"
                        : "Private (access code required)"}
                    </Text>
                    <ChevronRight
                      size={16}
                      color={theme.colors.textSubtle}
                      style={{ transform: [{ rotate: "90deg" }] }}
                    />
                  </TouchableOpacity>
                  {showBankDropdown.visibility && (
                    <NeuInset style={styles.dropdown}>
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => {
                          setFormData({ ...formData, visibility: "public" });
                          setShowBankDropdown({
                            ...showBankDropdown,
                            visibility: false,
                          });
                        }}
                      >
                        <Text style={styles.dropdownItemText}>
                          Public (visible to everyone)
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => {
                          setFormData({
                            ...formData,
                            visibility: "private",
                            accessCode: generateAccessCode(),
                          });
                          setShowBankDropdown({
                            ...showBankDropdown,
                            visibility: false,
                          });
                        }}
                      >
                        <Text style={styles.dropdownItemText}>
                          Private (access code required)
                        </Text>
                      </TouchableOpacity>
                    </NeuInset>
                  )}
                </View>
                {formData.visibility === "private" && (
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.smallLabel}>Access Code</Text>
                    <View style={styles.accessCodeContainer}>
                      <TextInput
                        style={styles.input}
                        value={formData.accessCode}
                        editable={false}
                      />
                      <Lock
                        size={16}
                        color={theme.colors.textSubtle}
                        style={{ position: "absolute", right: 12 }}
                      />
                    </View>
                    <Text style={styles.helperText}>
                      Users must enter this code to find your event
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() =>
                  setFormData({
                    ...formData,
                    requiresApproval: !formData.requiresApproval,
                  })
                }
              >
                <View
                  style={[
                    styles.checkbox,
                    formData.requiresApproval && styles.checkedCheckbox,
                  ]}
                >
                  {formData.requiresApproval && (
                    <CheckSquare size={12} color="#1A1A14" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>
                  Require approval for each registration
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() =>
                  setFormData({
                    ...formData,
                    waitlistEnabled: !formData.waitlistEnabled,
                  })
                }
              >
                <View
                  style={[
                    styles.checkbox,
                    formData.waitlistEnabled && styles.checkedCheckbox,
                  ]}
                >
                  {formData.waitlistEnabled && (
                    <CheckSquare size={12} color="#1A1A14" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>
                  Enable waitlist when sold out
                </Text>
              </TouchableOpacity>
            </NeuInset>
          </View>
        )}

        {/* Step 4: Media & Description */}
        {step === 4 && (
          <View style={styles.stepContainer}>
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Profile Image</Text>
                <TouchableOpacity
                  style={styles.uploadContainer}
                  onPress={() => uploadImage("profile")}
                  disabled={uploading.profile}
                >
                  {uploading.profile ? (
                    <ActivityIndicator size="large" color={theme.colors.brand} />
                  ) : formData.profile ? (
                    <Image source={{ uri: formData.profile }} style={styles.uploadPreview} />
                  ) : (
                    <View style={styles.uploadPlaceholder}>
                      <Upload size={32} color={theme.colors.textSubtle} style={{ marginBottom: 8 }} />
                      <Text style={styles.uploadLabel}>Tap to upload</Text>
                      <Text style={styles.uploadSubLabel}>Square image</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Cover Image</Text>
                <TouchableOpacity
                  style={styles.uploadContainer}
                  onPress={() => uploadImage("cover")}
                  disabled={uploading.cover}
                >
                  {uploading.cover ? (
                    <ActivityIndicator size="large" color={theme.colors.brand} />
                  ) : formData.cover ? (
                    <Image source={{ uri: formData.cover }} style={styles.uploadPreview} />
                  ) : (
                    <View style={styles.uploadPlaceholder}>
                      <Upload
                        size={32}
                        color={theme.colors.textSubtle}
                        style={{ marginBottom: 8 }}
                      />
                      <Text style={styles.uploadLabel}>Tap to upload</Text>
                      <Text style={styles.uploadSubLabel}>16:9 ratio</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) =>
                  setFormData({ ...formData, description: text })
                }
                placeholder="Tell people what your event is about..."
                multiline
                numberOfLines={6}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, styles.ghostButton]}
          onPress={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
        >
          <ChevronLeft
            size={20}
            color={step === 1 ? theme.colors.border : theme.colors.brand}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[styles.ghostButtonText, step === 1 && styles.disabledText]}
          >
            Back
          </Text>
        </TouchableOpacity>

        {step < 4 ? (
          <TouchableOpacity
            style={[styles.navButton, styles.primaryButton]}
            onPress={() => setStep((s) => Math.min(4, s + 1))}
          >
            <Text style={styles.primaryButtonText}>Next Step</Text>
            <ChevronRight size={20} color="#1A1A14" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.submitButton,
              isSubmitting && styles.disabledButton,
            ]}
            onPress={handleEventFormSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <ActivityIndicator
                  size="small"
                  color="#1A1A14"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.submitButtonText}>Creating...</Text>
              </>
            ) : (
              <>
                <Text style={styles.submitButtonText}>Create Event</Text>
                <CheckSquare size={20} color="#1A1A14" style={{ marginLeft: 4 }} />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Date and Time Pickers (only if installed) */}
      {DateTimePicker && showPicker.date && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDateChange}
        />
      )}

      {DateTimePicker && showPicker.startTime && (
        <DateTimePicker
          value={tempDate}
          mode="time"
          is24Hour={true}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleTimeChange("startTime")}
        />
      )}

      {DateTimePicker && showPicker.endTime && (
        <DateTimePicker
          value={tempDate}
          mode="time"
          is24Hour={true}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleTimeChange("endTime")}
        />
      )}
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 16,
  },
  stepIndicatorContainer: {
    marginBottom: 24,
  },
  stepTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: theme.colors.brand,
    marginBottom: 2,
  },
  stepName: {
    fontSize: 20,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  stepPills: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  stepPill: {
    height: 8,
    borderRadius: 4,
  },
  stepPillActive: {
    width: 28,
    backgroundColor: theme.colors.brand,
  },
  stepPillDone: {
    width: 16,
    backgroundColor: theme.colors.brand,
    opacity: 0.5,
  },
  stepPillTodo: {
    width: 16,
    backgroundColor: theme.colors.border,
  },
  stepProgressBar: {
    height: 3,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
  },
  stepProgressFill: {
    height: "100%",
    backgroundColor: theme.colors.brand,
    borderRadius: 2,
  },
  formContainer: {
    flex: 1,
  },
  stepContainer: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textMuted,
  },
  smallLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSubtle,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  optionalLabel: {
    fontSize: 12,
    fontWeight: "400",
    color: theme.colors.textSubtle,
  },
  input: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 16,
    fontSize: 16,
    color: theme.colors.text,
  },
  inputText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  placeholderText: {
    color: theme.colors.textSubtle,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  rowInputs: {
    flexDirection: "row",
  },
  venueInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: theme.colors.brandTint,
  },
  helperText: {
    fontSize: 12,
    color: theme.colors.textSubtle,
    marginTop: 4,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.brand,
    justifyContent: "center",
    alignItems: "center",
  },
  checkedCheckbox: {
    backgroundColor: theme.colors.brand,
  },
  checkboxLabel: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 16,
  },
  dropdownText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: theme.colors.textSubtle,
  },
  dropdown: {
    marginTop: 8,
    borderRadius: 12,
    overflow: "hidden",
    zIndex: 100,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dropdownItemText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  settingsContainer: {
    marginTop: 4,
    padding: 20,
    gap: 16,
  },
  settingsHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text,
  },
  ticketTypesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  ticketTypesTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.brand,
  },
  ticketTypesContainer: {
    gap: 12,
  },
  ticketCard: {
    padding: 16,
  },
  ticketRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  currencyInputContainer: {
    position: "relative",
  },
  currencySymbol: {
    position: "absolute",
    left: 12,
    top: 14,
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textSubtle,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderRadius: 12,
  },
  accessCodeContainer: {
    position: "relative",
  },
  uploadContainer: {
    height: 140,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderStyle: "dashed",
    backgroundColor: theme.colors.surfaceMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadPreview: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },
  uploadPlaceholder: {
    alignItems: "center",
  },
  uploadLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSubtle,
  },
  uploadSubLabel: {
    fontSize: 10,
    color: theme.colors.textSubtle,
    marginTop: 2,
  },
  uploadedText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.brand,
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  ghostButton: {},
  ghostButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.brand,
  },
  primaryButton: {
    backgroundColor: theme.colors.brand,
  },
  primaryButtonText: {
    color: "#1A1A14",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  submitButton: {
    backgroundColor: theme.colors.brand,
  },
  submitButtonText: {
    color: "#1A1A14",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: theme.colors.textSubtle,
  },
});

export { CreateEventForm };
