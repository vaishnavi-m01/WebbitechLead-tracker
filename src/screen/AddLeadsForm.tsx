import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ToastAndroid,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { Dropdown } from "react-native-element-dropdown";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../theme/colors";
import StackHeader from "../utils/StackHeader";
import axios from "axios";
import api from "../config/apiConfig";
import Toast from "react-native-toast-message";

interface DropdownItem {
  label: string;
  value: string;
  id?: number;
}

const STATUS_OPTIONS: DropdownItem[] = [
  { label: "New", value: "New" },
  { label: "In Progress", value: "In Progress" },
  { label: "Resolved", value: "Resolved" },
  { label: "Closed", value: "Closed" },
];

const localCityCache: Record<string, DropdownItem[]> = {};

const AddLeadsForm = () => {
  const [name, setName] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [service, setService] = useState("");
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");

  // Dynamic Dropdown Lists from API
  const [serviceOptions, setServiceOptions] = useState<DropdownItem[]>([]);
  const [statusOptions, setStatusOptions] = useState<DropdownItem[]>([]);

  // Location management parameters
  const [stateOptions, setStateOptions] = useState<DropdownItem[]>([]);
  const [selectedState, setSelectedState] = useState("");
  const [cityOptions, setCityOptions] = useState<DropdownItem[]>([]);
  const [selectedCity, setSelectedCity] = useState("");

  const [serviceOpen, setServiceOpen] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [isEnquiry, setIsEnquiry] = useState(false);

  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Populate Dynamic Parameters on mount
  useEffect(() => {
    fetchAllStates();
    fetchServices();
    fetchStatus();
  }, []);


  // Fetch Dynamic Services from API
  const fetchServices = async () => {
    try {
      const response = await api.get("/service");
      if (response.data && response.data.status && Array.isArray(response.data.data)) {
        const mappedServices = response.data.data.map((item: any) => ({
          label: item.name,
          value: item.name,
          id: item.id,
        }));
        setServiceOptions(mappedServices);
      }
    } catch (error) {
      console.error("Failed fetching operational services mapping:", error);
    }
  };

  // Fetch Dynamic Status List from API
  const fetchStatus = async () => {
    try {
      const response = await api.get("/status");
      if (response.data && response.data.status && Array.isArray(response.data.data)) {
        const mappedStatus = response.data.data.map((item: any) => ({
          label: item.name,
          value: item.name,
          id: item.id,
        }));
        setStatusOptions(mappedStatus);
      }
    } catch (error) {
      console.error("Failed fetching dynamic lead tracking statuses:", error);
    }
  };

  // Fetch States of India
  const fetchAllStates = async () => {
    setLoadingStates(true);
    try {
      const response = await axios.get("https://countriesnow.space/api/v0.1/countries/states");
      const json = response.data;

      if (json && !json.error) {
        const indiaData = json.data.find((c: any) => c.name.toLowerCase() === "india");

        if (indiaData && indiaData.states) {
          const mappedStates = indiaData.states.map((st: any) => {
            const cleanState = st.name ? st.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : st.name;
            return {
              label: cleanState,
              value: cleanState,
            };
          });
          setStateOptions(mappedStates);
        }
      }
    } catch (error) {
      console.error("Master State Fetch Network Failure:", error);
    } finally {
      setLoadingStates(false);
    }
  };

  // Fetch Cities with Fallback Mechanism
  const fetchCitiesForSelectedState = async (stateName: string) => {
    if (localCityCache[stateName]) {
      setCityOptions(localCityCache[stateName]);
      return;
    }

    setLoadingCities(true);
    try {
      const response = await axios.post("https://countriesnow.space/api/v0.1/countries/state/cities", {
        country: "India",
        state: stateName,
      });

      let fetchedCities: string[] = response.data?.data || [];

      const mappedCities = fetchedCities.map((city: string) => {
        const cleanCity = city ? city.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : city;
        return {
          label: cleanCity,
          value: cleanCity,
        };
      });

      localCityCache[stateName] = mappedCities;
      setCityOptions(mappedCities);
    } catch (error) {
      console.error("City fetching error:", error);
      setCityOptions([]);
    } finally {
      setLoadingCities(false);
    }
  };

  const handleClearForm = () => {
    setName("");
    setContactNo("");
    setEmail("");
    setBusinessName("");
    setService("");
    setStatus("");
    setMessage("");
    setSelectedState("");
    setSelectedCity("");
    setCityOptions([]);
    setIsEnquiry(false);
  };

  const getServiceId = (name: string | null): number | null => {
    if (!name) return null;
    return serviceOptions.find((i: any) => i.value === name)?.id ?? null;
  };
  const getStatusId = (name: string | null): number | null => {
    if (!name) return null;
    return statusOptions.find((i: any) => i.value === name)?.id ?? null;
  };

  const handleFormSubmit = async () => {
    if (!name || !contactNo  || !service) {
      Alert.alert("Validation Error", "Please fill in all mandatory inputs to save this lead profile.");
      return;
    }

    const currentSource = isEnquiry ? "send_whatsapp" : "ENQ";

    const normalizeAscii = (str: string | null | undefined) => {
      if (!str) return str;
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    const payload = {
      name: name.trim() || null,
      email: email.trim() || null,
      phone: contactNo.trim() || null,
      city: normalizeAscii(selectedCity) || null,
      state: normalizeAscii(selectedState) || null,
      message: message ? (message.trim() || null) : null,
      sources: currentSource,
      send_whatsapp: isEnquiry ? 1 : 0,
      commend: message ? (message.trim() || null) : null,
      service: getServiceId(service) || null,
      // status: getStatusId(status),
    };

    console.log("AddLeadsForm Saving payload:", JSON.stringify(payload, null, 2));

    setIsSaving(true);
    try {
      const response = await api.post("/contacts/addenquiry", payload);

      if (response.status >= 200 && response.status < 300) {
        if (Platform.OS === "android") {
          ToastAndroid.show("New Lead Profile Record tracked successfully.", ToastAndroid.SHORT);
        } else {
          Toast.show({
            type: "blueToast",
            text1: "Success",
            text2: "New Lead Profile Record tracked successfully.",
          });
        }
        handleClearForm();
        navigation.goBack();
        // navigation.navigate("MainTabs", { screen: "HomeTab", params: { category: "contact", refresh: Date.now() } });
      } else {
        Alert.alert("Error", "Server rejected form inputs during submission.");
      }
    } catch (error) {
      console.error("Form Submit Error:", error);
      Alert.alert("Error", "Failed to transfer form collection data payload.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StackHeader
        navigation={navigation as any}
        route={{ name: "EditEnquiryForm" } as any}
        options={{ title: "Add Lead Profile" } as any}
      />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView
          style={styles.scrollViewStyle}
          contentContainerStyle={styles.formScrollContainer}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formCardWrapper}>
            <Text style={styles.formSectionMainTitle}>Create New Lead Profile</Text>

            {/* Name Field */}
            <View style={styles.inputFieldGroup}>
              <Text style={styles.fieldInputLabel}>Name <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.formTextInputElement, focusedField === "name" && styles.activeFocusedBorder]}
                placeholder="Enter lead individual name"
                placeholderTextColor="#64748B"
                value={name}
                onChangeText={(t) => setName(t.trimStart())}
                onFocus={() => setFocusedField("name")}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Contact No Field */}
            <View style={styles.inputFieldGroup}>
              <Text style={styles.fieldInputLabel}>Contact No <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.formTextInputElement, focusedField === "contactNo" && styles.activeFocusedBorder]}
                placeholder="e.g. 9876543210"
                placeholderTextColor="#64748B"
                keyboardType="phone-pad"
                value={contactNo}
                maxLength={10}
                onChangeText={(t) => setContactNo(t.replace(/\s/g, ''))}
                onFocus={() => setFocusedField("contactNo")}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Email Field */}
            <View style={styles.inputFieldGroup}>
              <Text style={styles.fieldInputLabel}>Email</Text>
              <TextInput
                style={[styles.formTextInputElement, focusedField === "email" && styles.activeFocusedBorder]}
                placeholder="e.g. example@gmail.com"
                placeholderTextColor="#64748B"
                keyboardType="email-address"
                value={email}
                onChangeText={(t) => setEmail(t.replace(/\s/g, ''))}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Business Name Field */}
            {/* <View style={styles.inputFieldGroup}>
              <Text style={styles.fieldInputLabel}>Business Name</Text>
              <TextInput
                style={[styles.formTextInputElement, focusedField === "businessName" && styles.activeFocusedBorder]}
                placeholder="Enter organization identity"
                placeholderTextColor="#64748B"
                value={businessName}
                onChangeText={setBusinessName}
                onFocus={() => setFocusedField("businessName")}
                onBlur={() => setFocusedField(null)}
              />
            </View> */}

            {/* Service Selection */}
            <View style={[styles.inputFieldGroup, Platform.OS === "android" && { zIndex: 4000 }]}>
              <Text style={styles.fieldInputLabel}>Service <Text style={styles.required}>*</Text></Text>
              <Dropdown
                style={[styles.formInlineDropdown, serviceOpen && styles.activeFocusedDropdownBorder]}
                containerStyle={styles.dropdownMenuFloatingCard}
                placeholderStyle={styles.dropdownPlaceholderStyle}
                selectedTextStyle={styles.dropdownSelectedTextStyle}
                inputSearchStyle={styles.searchTextInputStyle}
                itemTextStyle={styles.dropdownSelectedTextStyle}
                data={serviceOptions}
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder={serviceOptions.length === 0 ? "Loading Services..." : "Select service"}
                value={service}
                flatListProps={{ nestedScrollEnabled: true }}
                onFocus={() => setServiceOpen(true)}
                onBlur={() => setServiceOpen(false)}
                onChange={item => {
                  setService(item.value);
                  setServiceOpen(false);
                }}
              />
            </View>

            {/* State Dropdown */}
            <View style={[styles.inputFieldGroup, Platform.OS === "android" && { zIndex: 3000, elevation: 3000 }]}>
              <Text style={styles.fieldInputLabel}>State</Text>
              <Dropdown
                style={[styles.formInlineDropdown, stateOpen && styles.activeFocusedDropdownBorder]}
                containerStyle={styles.dropdownMenuFloatingCard}
                placeholderStyle={styles.dropdownPlaceholderStyle}
                selectedTextStyle={styles.dropdownSelectedTextStyle}
                inputSearchStyle={styles.searchTextInputStyle}
                itemTextStyle={styles.dropdownSelectedTextStyle}
                data={stateOptions}
                search
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder={loadingStates ? "Loading States..." : "Select State"}
                searchPlaceholder="Search state..."
                value={selectedState}
                flatListProps={{ nestedScrollEnabled: true }}
                onFocus={() => setStateOpen(true)}
                onBlur={() => setStateOpen(false)}
                onChange={item => {
                  setSelectedState(item.value);
                  setSelectedCity("");
                  setCityOptions([]);
                  if (item.value) fetchCitiesForSelectedState(item.value);
                  setStateOpen(false);
                }}
              />
            </View>

            {/* City Dropdown */}
            <View style={[styles.inputFieldGroup, Platform.OS === "android" && { zIndex: 2000, elevation: 2000 }]}>
              <Text style={styles.fieldInputLabel}>City</Text>
              <Dropdown
                style={[
                  styles.formInlineDropdown,
                  cityOpen && styles.activeFocusedDropdownBorder,
                  (!selectedState || loadingCities) && styles.disabledInputBackground,
                ]}
                disable={!selectedState || loadingCities}
                containerStyle={styles.dropdownMenuFloatingCard}
                placeholderStyle={styles.dropdownPlaceholderStyle}
                selectedTextStyle={styles.dropdownSelectedTextStyle}
                selectedTextProps={{ numberOfLines: 1 }}
                inputSearchStyle={styles.searchTextInputStyle}
                itemTextStyle={styles.dropdownSelectedTextStyle}
                data={cityOptions}
                search
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder={loadingCities ? "Loading cities..." : selectedState ? "Select City" : "Select State first"}
                searchPlaceholder="Search city..."
                value={selectedCity}
                flatListProps={{ nestedScrollEnabled: true }}
                onFocus={() => setCityOpen(true)}
                onBlur={() => setCityOpen(false)}
                onChange={item => {
                  setSelectedCity(item.value);
                  setCityOpen(false);
                }}
              />
            </View>

            {/* Status Dropdown */}
            {/* <View style={[styles.inputFieldGroup, Platform.OS === "android" && { zIndex: 1000 }]}>
              <Text style={styles.fieldInputLabel}>Status</Text>
              <Dropdown
                style={[styles.formInlineDropdown, statusOpen && styles.activeFocusedDropdownBorder]}
                containerStyle={styles.dropdownMenuFloatingCard}
                placeholderStyle={styles.dropdownPlaceholderStyle}
                selectedTextStyle={styles.dropdownSelectedTextStyle}
                inputSearchStyle={styles.searchTextInputStyle}
                itemTextStyle={styles.dropdownSelectedTextStyle}
                data={statusOptions}
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder={statusOptions.length === 0 ? "Loading Statuses..." : "Select status"}
                value={status}
                flatListProps={{ nestedScrollEnabled: true }}
                onFocus={() => setStatusOpen(true)}
                onBlur={() => setStatusOpen(false)}
                onChange={item => {
                  setStatus(item.value);
                  setStatusOpen(false);
                }}
              />
            </View> */}

            {/* Message Field */}
            <View style={styles.inputFieldGroup}>
              <Text style={styles.fieldInputLabel}>Message</Text>
              <TextInput
                style={[
                  styles.formTextInputElement,
                  styles.formMessageInputElement,
                  focusedField === "message" && styles.activeFocusedBorder,
                ]}
                placeholder="Type additional details or user requirements..."
                placeholderTextColor="#64748B"
                value={message}
                onChangeText={(t) => setMessage(t.trimStart())}
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
                onFocus={() => setFocusedField("message")}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Checkbox */}
            <TouchableOpacity
              style={styles.checkboxWrapperContainer}
              activeOpacity={0.8}
              onPress={() => setIsEnquiry(!isEnquiry)}
            >
              <View style={[styles.checkboxInputDisplay, isEnquiry && styles.checkboxActiveCheckedState]}>
                {isEnquiry && <MaterialIcons name="check" size={16} color="#FFFFFF" />}
              </View>
              <Text style={styles.checkboxLabelContentText}> This Enquiry to Customer via Whatsapp </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Action Buttons Row */}
      <View style={[styles.actionRow, { paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 16 }]}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} activeOpacity={0.7} disabled={isSaving}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.submitButton, isSaving && { opacity: 0.7 }]} onPress={handleFormSubmit} activeOpacity={0.8} disabled={isSaving}>
          {isSaving ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Processing...</Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>Create Lead</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AddLeadsForm;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollViewStyle: {
    flex: 1,
  },
  formScrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 50,
  },
  formCardWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 20,
  },
  formSectionMainTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 20,
    letterSpacing: -0.2,
  },
  inputFieldGroup: {
    width: "100%",
    marginBottom: 16,
  },
  required: {
    color: 'red',
  },
  fieldInputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 6,
  },
  formTextInputElement: {
    width: "100%",
    height: 44,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 13,
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
  },
  formMessageInputElement: {
    height: 100,
    paddingTop: 12,
    paddingBottom: 12,
  },
  formInlineDropdown: {
    width: "100%",
    height: 44,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
  },
  disabledInputBackground: {
    backgroundColor: "#F1F5F9",
    borderColor: "#E2E8F0",
  },
  activeFocusedBorder: {
    borderColor: "#2563EB",
    backgroundColor: "#FFFFFF",
  },
  activeFocusedDropdownBorder: {
    borderColor: "#2563EB",
    backgroundColor: "#FFFFFF",
  },
  dropdownPlaceholderStyle: {
    fontSize: 13,
    color: "#64748B",
  },
  dropdownSelectedTextStyle: {
    fontSize: 13,
    color: "#0F172A",
  },
  dropdownMenuFloatingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: -28,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
    maxHeight: 200,
  },
  searchContainerStyle: {
    borderBottomColor: "#E2E8F0",
    borderBottomWidth: 1,
    paddingVertical: 4,
    backgroundColor: "#FFFFFF",
  },
  searchTextInputStyle: {
    borderWidth: 0,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
    fontSize: 13,
    color: "#0F172A",
    backgroundColor: "#FFFFFF",
    height: 38,
  },
  listItemLabelStyle: {
    fontSize: 14,
    color: "#0F172A",
  },
  selectedItemLabelStyle: {
    color: "#2563EB",
    fontWeight: "600",
  },
  selectedItemContainerStyle: {
    backgroundColor: "#EFF6FF",
  },
  checkboxWrapperContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 4,
  },
  checkboxInputDisplay: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    borderRadius: 4,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  checkboxActiveCheckedState: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  checkboxLabelContentText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#334155",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
  },
  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4B5563",
  },
  submitButton: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
});
