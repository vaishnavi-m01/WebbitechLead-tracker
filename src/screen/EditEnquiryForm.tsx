import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ToastAndroid,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import DropDownPicker from 'react-native-dropdown-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import api from '../config/apiConfig';
import { COLORS } from '../theme/colors';
import StackHeader from '../utils/StackHeader';
import Toast from 'react-native-toast-message';

interface DropdownItem {
  label: string;
  value: string;
  id?: number; // backend id for this option (service/status), used when building the save payload
}

interface FollowUpRecord {
  followup_date: string;
  commend: string | null;
  created_at: string;
  status_relation: {
    name: string;
  } | null;
}

interface ApiStateItem {
  name: string;
  state_code: string;
}

interface DynamicFollowUp {
  id: string;
  date: Date | null;
  service: string | null;
  status: string | null;
  commend: string; // per-row comment, previously (bug) shared a single top-level `comments` state
  serviceOpen: boolean;
  statusOpen: boolean;
}

const MAIN_SOURCE_OPTIONS: DropdownItem[] = [
  { label: 'Website', value: 'Website' },
  { label: 'Facebook', value: 'Facebook' },
  { label: 'DM', value: 'DM' },
  { label: 'Whatsapp', value: 'Whatsapp' },
  { label: 'Direct', value: 'Direct' },
];

// Fallback only — real status items now come from /status (see fetchStatuses)
const STATUS_OPTIONS: DropdownItem[] = [
  { label: 'Follow Ups', value: 'Follow Ups' },
  { label: 'Qualified', value: 'Qualified' },
  { label: 'New', value: 'New' },
  { label: 'ORDER CONFIRMED', value: 'ORDER CONFIRMED' },
];

const makeEmptyRow = (): DynamicFollowUp => ({
  id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
  date: null,
  service: null,
  status: null,
  commend: '',
  serviceOpen: false,
  statusOpen: false,
});

// Formats a Date as YYYY-MM-DD for the API (e.g. "2026-07-25")
const formatDateForApi = (d: Date | null): string | null => {
  if (!d) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const EditEnquiryForm = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const leadData = route.params?.leadData;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sendWhatsapp, setSendWhatsapp] = useState(false);
  const [followupsList, setFollowupsList] = useState<FollowUpRecord[]>([]);
  const [isFetchingData, setIsFetchingData] = useState(false);

  const [serviceItems, setServiceItems] = useState<DropdownItem[]>([]);

  // Dropdown Open States (top-level fields only — Service & Status live per-row now)
  const [serviceOpen, setServiceOpen] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  const [followUpRows, setFollowUpRows] = useState<DynamicFollowUp[]>([makeEmptyRow()]);
  const [openDateId, setOpenDateId] = useState<string | null>(null);

  // Dynamic API Location states
  const [stateOptions, setStateOptions] = useState<DropdownItem[]>([]);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [cityOptions, setCityOptions] = useState<DropdownItem[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [loadingLocations, setLoadingLocations] = useState(false);

  const [statusItems, setStatusItems] = useState<DropdownItem[]>(STATUS_OPTIONS);

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize fields and fetch dynamic data
  useEffect(() => {
    if (leadData?.id) {
      if (stateOptions.length === 0) {
        fetchAllStatesAndCities();
      }
      if (serviceItems.length === 0) {
        fetchServices();
      }
      fetchStatuses();
      fetchContactDetails(leadData.id);
    } else if (leadData) {
      // Fallback if no ID but data passed
      setName(leadData.name || '');
      setEmail(leadData.email || '');
      setPhone(leadData.phone || '');
      setService(leadData.service || null);
      setMessage(leadData.message || '');
      setSelectedState(leadData.location || null);
    }
  }, [leadData]);

  const fetchContactDetails = async (id: number | string) => {
    setIsFetchingData(true);
    console.log(`[EditEnquiryForm] Fetching contact details for ID: ${id}`);
    try {
      const response = await api.get(`/contacts/${id}/followups`);
      console.log(`[EditEnquiryForm] API Response Status:`, response.status);
      console.log(`[EditEnquiryForm] API Response Data:`, JSON.stringify(response.data));
      if (response.data && response.data.status && response.data.data) {
        const data = response.data.data;
        setName(data.name || '');
        setEmail(data.email || '');
        setPhone(data.phone || '');
        setService(data.service || null);
        setMessage(data.message || '');
        setSelectedState(data.state || null);
        // Handle city setup (if state is present, we must fetch cities first before setting selectedCity)
        if (data.state) {
          fetchCitiesForSelectedState(data.state).then(() => {
            setSelectedCity(data.city || null);
          });
        }

        setFollowupsList(data.followups || []);
        console.log(`[EditEnquiryForm] Form state populated successfully.`);
      } else {
        console.log(`[EditEnquiryForm] Validation failed for API response.`);
      }
    } catch (error: any) {
      console.error("[EditEnquiryForm] Failed to fetch contact details:", error?.response?.data || error.message);
      Alert.alert("Error", "Could not fetch the complete contact details.");
    } finally {
      setIsFetchingData(false);
    }
  };

  // Fetch Location Data on Component Mount
  const fetchAllStatesAndCities = async () => {
    setLoadingLocations(true);
    try {
      const response = await axios.get('https://countriesnow.space/api/v0.1/countries/states');
      const json = response.data;

      if (json && !json.error) {
        const indiaData = json.data.find((c: any) => c.name.toLowerCase() === 'india');
        if (indiaData && indiaData.states) {
          const mappedStates = indiaData.states.map((st: ApiStateItem) => ({
            label: st.name,
            value: st.name,
          }));
          setStateOptions(mappedStates);
        }
      }
    } catch (error) {
      console.error('API Network Error:', error);
    } finally {
      setLoadingLocations(false);
    }
  };

  const fetchCitiesForSelectedState = async (stateName: string) => {
    setLoadingLocations(true);
    try {
      const response = await axios.post('https://countriesnow.space/api/v0.1/countries/state/cities', {
        country: 'India',
        state: stateName,
      });
      const json = response.data;

      if (json && !json.error && json.data) {
        const mappedCities = json.data.map((city: string) => ({
          label: city,
          value: city,
        }));
        setCityOptions(mappedCities);
      } else {
        setCityOptions([]);
      }
    } catch (error) {
      console.error('City fetch error:', error);
      setCityOptions([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  // fetchServices — keeps the backend id on each item so we can send numeric ids in the save payload
  const fetchServices = async () => {
    try {
      const response = await api.get("/service");

      if (response.data?.status) {
        const services = response.data.data.map((item: any) => ({
          label: item.name,
          value: item.name,
          id: item.id,
        }));

        setServiceItems(services);
      }
    } catch (error) {
      console.log("Service API Error:", error);
    }
  };

  // fetchStatuses — same shape as /service, returns [{id, name}]
  const fetchStatuses = async () => {
    try {
      const response = await api.get("/status");

      if (response.data?.status) {
        const statuses = response.data.data.map((item: any) => ({
          label: item.name,
          value: item.name,
          id: item.id,
        }));

        setStatusItems(statuses);
      }
    } catch (error) {
      console.log("Status API Error:", error);
    }
  };

  // Looks up the backend id for a selected service/status name
  const getServiceId = (name: string | null): number | null => {
    if (!name) return null;
    return serviceItems.find((i) => i.value === name)?.id ?? null;
  };
  const getStatusId = (name: string | null): number | null => {
    if (!name) return null;
    return statusItems.find((i) => i.value === name)?.id ?? null;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate && openDateId) {
      setFollowUpRows(prev => prev.map(row => row.id === openDateId ? { ...row, date: selectedDate } : row));
    }
  };

  const handleSave = async () => {
    if (!name || !phone) {
      Alert.alert('Validation Error', 'Name and Phone are required.');
      return;
    }

    const leadId = leadData?.id;
    if (!leadId) {
      Alert.alert('Error', 'Missing lead ID.');
      return;
    }

    setIsSaving(true);
    try {
      // One entry per Follow-Up row: row 1 -> index 0 of each array, row 2 -> index 1, etc.
      const payload = {
        name,
        email,
        phone,
        city: selectedCity,
        state: selectedState,
        message,
        sources: service,
        send_whatsapp: sendWhatsapp,
        follow_up_date: followUpRows.map(r => formatDateForApi(r.date)),
        source: followUpRows.map(r => getServiceId(r.service)),
        status: followUpRows.map(r => getStatusId(r.status)),
        commend: followUpRows.map(r => r.commend || ''),
      };

      console.log("EditEnquiryForm Saving payload:", JSON.stringify(payload));

      const response = await api.put(`/contacts/${leadId}/update`, payload);

      setIsSaving(false);

      if (response.data?.status) {
        if (Platform.OS === 'android') {
          ToastAndroid.show('Enquiry updated successfully.', ToastAndroid.SHORT);
        } else {
          Toast.show({
            type: 'blueToast',
            text1: 'Success',
            text2: 'Enquiry updated successfully'
          });
        }
        navigation.goBack();
      } else {
        Alert.alert('Error', response.data?.message || 'Failed to save the enquiry.');
      }
    } catch (error: any) {
      console.error("Save Follow Up Error:", error?.response?.data || error.message);
      setIsSaving(false);
      Alert.alert('Error', 'Failed to save the enquiry.');
    }
  };

  // Closes every per-row Service/Status dropdown (used whenever a top-level dropdown opens)
  const closeAllRowDropdowns = () => {
    setFollowUpRows(prev => prev.map(row => ({ ...row, serviceOpen: false, statusOpen: false })));
  };

  // Close all other dropdowns when one opens
  const handleServiceOpen = (open: boolean | ((prevState: boolean) => boolean)) => {
    const isOpen = typeof open === 'function' ? open(serviceOpen) : open;
    if (isOpen) { setStateOpen(false); setCityOpen(false); closeAllRowDropdowns(); }
    setServiceOpen(isOpen);
  };
  const handleStateOpen = (open: boolean | ((prevState: boolean) => boolean)) => {
    const isOpen = typeof open === 'function' ? open(stateOpen) : open;
    if (isOpen) { setServiceOpen(false); setCityOpen(false); closeAllRowDropdowns(); }
    setStateOpen(isOpen);
  };
  const handleCityOpen = (open: boolean | ((prevState: boolean) => boolean)) => {
    const isOpen = typeof open === 'function' ? open(cityOpen) : open;
    if (isOpen) { setServiceOpen(false); setStateOpen(false); closeAllRowDropdowns(); }
    setCityOpen(isOpen);
  };

  // Opens a specific row's Service dropdown, closing every other dropdown (top-level + other rows)
  const handleRowServiceOpen = (rowId: string, open: boolean | ((prevState: boolean) => boolean)) => {
    const current = followUpRows.find(r => r.id === rowId)?.serviceOpen || false;
    const isOpen = typeof open === 'function' ? open(current) : open;
    if (isOpen) { setServiceOpen(false); setStateOpen(false); setCityOpen(false); }
    setFollowUpRows(prev => prev.map(row =>
      row.id === rowId
        ? { ...row, serviceOpen: isOpen, statusOpen: false }
        : { ...row, serviceOpen: false, statusOpen: false }
    ));
  };

  // Opens a specific row's Status dropdown, closing every other dropdown (top-level + other rows)
  const handleRowStatusOpen = (rowId: string, open: boolean | ((prevState: boolean) => boolean)) => {
    const current = followUpRows.find(r => r.id === rowId)?.statusOpen || false;
    const isOpen = typeof open === 'function' ? open(current) : open;
    if (isOpen) {
      setServiceOpen(false);
      setStateOpen(false);
      setCityOpen(false);
    }
    setFollowUpRows(prev => prev.map(row =>
      row.id === rowId
        ? { ...row, statusOpen: isOpen, serviceOpen: false }
        : { ...row, serviceOpen: false, statusOpen: false }
    ));
  };

  const addFollowUpRow = () => {
    setFollowUpRows(prev => [...prev, makeEmptyRow()]);
  };

  const removeFollowUpRow = (id: string) => {
    setFollowUpRows(prev => prev.filter(row => row.id !== id));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.pageContent}>
          <StackHeader
            navigation={navigation as any}
            route={{ name: 'AddLeadsForm' } as any}
            options={{ title: 'Edit Lead Profile' } as any}
          />

          <ScrollView
            style={styles.pageBody}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          >
            {/* Section Label */}
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionAccentBar} />
              <Text style={styles.sectionLabel}>BASIC INFORMATION</Text>
            </View>

            <View style={styles.inputFieldGroup}>
              <Text style={styles.fieldInputLabel}>Name <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.formTextInputElement, focusedField === 'name' && styles.activeFocusedBorder]}
                placeholder="Enter Name"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <View style={styles.inputFieldGroup}>
              <Text style={styles.fieldInputLabel}>Email</Text>
              <TextInput
                style={[styles.formTextInputElement, focusedField === 'email' && styles.activeFocusedBorder]}
                placeholder="Enter Email"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <View style={styles.inputFieldGroup}>
              <Text style={styles.fieldInputLabel}>Phone <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.formTextInputElement, focusedField === 'phone' && styles.activeFocusedBorder]}
                placeholder="Enter Phone"
                placeholderTextColor="#94A3B8"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Service Dropdown - inline, zIndex 5000 */}
            <View style={[styles.inputFieldGroup, { zIndex: 5000, elevation: Platform.OS === 'android' ? 5000 : 0 }]}>
              <Text style={styles.fieldInputLabel}>Services</Text>
              <DropDownPicker
                open={serviceOpen}
                value={service}
                items={serviceItems}
                setOpen={handleServiceOpen}
                setValue={setService}
                setItems={setServiceItems}
                zIndex={5000}
                zIndexInverse={1000}
                style={[styles.formInlineDropdown, serviceOpen && styles.activeFocusedDropdownBorder]}
                dropDownContainerStyle={styles.dropdownMenuFloatingCard}
                textStyle={styles.dropdownSelectedTextStyle}
                placeholderStyle={styles.dropdownPlaceholderStyle}
                listItemLabelStyle={styles.listItemLabelStyle}
                selectedItemLabelStyle={styles.selectedItemLabelStyle}
                selectedItemContainerStyle={styles.selectedItemContainerStyle}
                placeholder="Select Service"
                listMode="SCROLLVIEW"
                scrollViewProps={{ nestedScrollEnabled: true }}
                ArrowDownIconComponent={() => <MaterialIcons name="keyboard-arrow-down" size={20} color="#64748B" />}
                ArrowUpIconComponent={() => <MaterialIcons name="keyboard-arrow-up" size={20} color="#64748B" />}
              />
            </View>

            {/* State Dropdown - inline, zIndex 4000 */}
            <View style={[styles.inputFieldGroup, { zIndex: 4000, elevation: Platform.OS === 'android' ? 4000 : 0 }]}>
              <Text style={styles.fieldInputLabel}>State</Text>
              <DropDownPicker
                open={stateOpen}
                value={selectedState}
                items={stateOptions}
                setOpen={handleStateOpen}
                setValue={(val) => {
                  const value = typeof val === 'function' ? val(selectedState) : val;
                  setSelectedState(value);
                  setSelectedCity(null);
                  if (value) fetchCitiesForSelectedState(value);
                }}
                setItems={setStateOptions}
                zIndex={4000}
                zIndexInverse={2000}
                searchable={true}
                searchPlaceholder="Search state..."
                style={[styles.formInlineDropdown, stateOpen && styles.activeFocusedDropdownBorder]}
                dropDownContainerStyle={styles.dropdownMenuFloatingCard}
                textStyle={styles.dropdownSelectedTextStyle}
                placeholderStyle={styles.dropdownPlaceholderStyle}
                searchContainerStyle={styles.searchContainerStyle}
                searchTextInputStyle={styles.searchTextInputStyle}
                listItemLabelStyle={styles.listItemLabelStyle}
                selectedItemLabelStyle={styles.selectedItemLabelStyle}
                selectedItemContainerStyle={styles.selectedItemContainerStyle}
                placeholder={loadingLocations && stateOptions.length === 0 ? "Loading..." : "Select State"}
                listMode="SCROLLVIEW"
                scrollViewProps={{ nestedScrollEnabled: true }}
                ArrowDownIconComponent={() =>
                  loadingLocations && stateOptions.length === 0
                    ? <ActivityIndicator size="small" color={COLORS.accent} />
                    : <MaterialIcons name="keyboard-arrow-down" size={20} color="#64748B" />
                }
                ArrowUpIconComponent={() => <MaterialIcons name="keyboard-arrow-up" size={20} color="#64748B" />}
              />
            </View>

            {/* City Dropdown - inline, zIndex 3000 */}
            <View style={[styles.inputFieldGroup, { zIndex: 3000, elevation: Platform.OS === 'android' ? 3000 : 0 }]}>
              <Text style={styles.fieldInputLabel}>City</Text>
              <DropDownPicker
                open={cityOpen}
                value={selectedCity}
                items={cityOptions}
                setOpen={handleCityOpen}
                setValue={setSelectedCity}
                setItems={setCityOptions}
                zIndex={3000}
                zIndexInverse={3000}
                searchable={true}
                searchPlaceholder="Search city..."
                disabled={!selectedState || loadingLocations}
                style={[
                  styles.formInlineDropdown,
                  cityOpen && styles.activeFocusedDropdownBorder,
                  (!selectedState || loadingLocations) && styles.disabledInputBackground,
                ]}
                dropDownContainerStyle={styles.dropdownMenuFloatingCard}
                textStyle={styles.dropdownSelectedTextStyle}
                placeholderStyle={styles.dropdownPlaceholderStyle}
                searchContainerStyle={styles.searchContainerStyle}
                searchTextInputStyle={styles.searchTextInputStyle}
                listItemLabelStyle={styles.listItemLabelStyle}
                selectedItemLabelStyle={styles.selectedItemLabelStyle}
                selectedItemContainerStyle={styles.selectedItemContainerStyle}
                placeholder={loadingLocations && selectedState ? "Loading cities..." : selectedState ? "Select City" : "Select State first"}
                listMode="SCROLLVIEW"
                scrollViewProps={{ nestedScrollEnabled: true }}
                ArrowDownIconComponent={() =>
                  loadingLocations && selectedState
                    ? <ActivityIndicator size="small" color={COLORS.accent} />
                    : <MaterialIcons name="keyboard-arrow-down" size={20} color={!selectedState ? "#CBD5E1" : "#64748B"} />
                }
                ArrowUpIconComponent={() => <MaterialIcons name="keyboard-arrow-up" size={20} color="#64748B" />}
              />
            </View>

            {/* Message */}
            <View style={styles.inputFieldGroup}>
              <Text style={styles.fieldInputLabel}>Message</Text>
              <TextInput
                style={[styles.formTextInputElement, styles.formMessageInputElement, focusedField === 'message' && styles.activeFocusedBorder]}
                placeholder="Enter message description..."
                placeholderTextColor="#94A3B8"
                value={message}
                onChangeText={setMessage}
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
                onFocus={() => setFocusedField('message')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <View style={styles.sectionDivider} />
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionAccentBar} />
              <Text style={styles.sectionLabel}>FOLLOW UP DETAILS</Text>
            </View>

            {/* Dynamic Follow-Up Rows */}
            {followUpRows.map((row, index) => {
              const rowBaseZ = 2000 - index * 40;
              return (
                <View key={row.id} style={[styles.dynamicRowCard, { zIndex: rowBaseZ }]}>
                  <View style={styles.dynamicRowHeader}>
                    <Text style={styles.dynamicRowTitle}>Follow Up Entry #{index + 1}</Text>
                    {followUpRows.length > 1 && (
                      <TouchableOpacity onPress={() => removeFollowUpRow(row.id)} activeOpacity={0.7} style={styles.dynamicRowDeleteBtn}>
                        <Feather name="trash-2" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Date */}
                  <View style={styles.inputFieldGroup}>
                    <Text style={styles.fieldInputLabel}>Follow Up Date</Text>
                    <TouchableOpacity
                      style={[styles.formTextInputElement, styles.datePickerBtn, focusedField === `date_${row.id}` && styles.activeFocusedBorder]}
                      activeOpacity={0.7}
                      onPress={() => {
                        setFocusedField(`date_${row.id}`);
                        setOpenDateId(row.id);
                        setShowDatePicker(true);
                      }}
                    >
                      <Text style={{ color: row.date ? '#0F172A' : '#94A3B8', fontSize: 13, fontWeight: '500' }}>
                        {row.date ? row.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Select Date'}
                      </Text>
                      <Feather name="calendar" size={14} color="#64748B" />
                    </TouchableOpacity>
                  </View>

                  {/* Service - inline dropdown */}
                  <View style={[styles.inputFieldGroup, { zIndex: rowBaseZ, elevation: Platform.OS === 'android' ? rowBaseZ : 0 }]}>
                    <Text style={styles.fieldInputLabel}>Service</Text>
                    <DropDownPicker
                      open={row.serviceOpen}
                      value={row.service}
                      items={serviceItems}
                      setOpen={(val) => handleRowServiceOpen(row.id, val)}
                      setValue={(callback) => {
                        setFollowUpRows(prev => prev.map(r => r.id === row.id ? { ...r, service: typeof callback === 'function' ? callback(r.service) : callback } : r));
                      }}
                      setItems={setServiceItems}
                      zIndex={rowBaseZ}
                      zIndexInverse={rowBaseZ}
                      style={[styles.formInlineDropdown, row.serviceOpen && styles.activeFocusedDropdownBorder]}
                      dropDownContainerStyle={styles.dropdownMenuFloatingCard}
                      textStyle={styles.dropdownSelectedTextStyle}
                      placeholderStyle={styles.dropdownPlaceholderStyle}
                      listItemLabelStyle={styles.listItemLabelStyle}
                      selectedItemLabelStyle={styles.selectedItemLabelStyle}
                      selectedItemContainerStyle={styles.selectedItemContainerStyle}
                      placeholder="Select Service"
                      listMode="SCROLLVIEW"
                      scrollViewProps={{ nestedScrollEnabled: true }}
                      ArrowDownIconComponent={() => <MaterialIcons name="keyboard-arrow-down" size={20} color="#64748B" />}
                      ArrowUpIconComponent={() => <MaterialIcons name="keyboard-arrow-up" size={20} color="#64748B" />}
                    />
                  </View>

                  {/* Status - inline dropdown */}
                  <View style={[styles.inputFieldGroup, { zIndex: rowBaseZ - 10, elevation: Platform.OS === 'android' ? rowBaseZ - 10 : 0 }]}>
                    <Text style={styles.fieldInputLabel}>Status</Text>
                    <DropDownPicker
                      open={row.statusOpen}
                      value={row.status}
                      items={statusItems}
                      setOpen={(val) => handleRowStatusOpen(row.id, val)}
                      setValue={(callback) => {
                        setFollowUpRows(prev => prev.map(r => r.id === row.id ? { ...r, status: typeof callback === 'function' ? callback(r.status) : callback } : r));
                      }}
                      setItems={setStatusItems}
                      zIndex={rowBaseZ - 10}
                      zIndexInverse={rowBaseZ - 10}
                      style={[styles.formInlineDropdown, row.statusOpen && styles.activeFocusedDropdownBorder]}
                      dropDownContainerStyle={styles.dropdownMenuFloatingCard}
                      textStyle={styles.dropdownSelectedTextStyle}
                      placeholderStyle={styles.dropdownPlaceholderStyle}
                      listItemLabelStyle={styles.listItemLabelStyle}
                      selectedItemLabelStyle={styles.selectedItemLabelStyle}
                      selectedItemContainerStyle={styles.selectedItemContainerStyle}
                      placeholder="Select Status"
                      listMode="SCROLLVIEW"
                      scrollViewProps={{ nestedScrollEnabled: true }}
                      ArrowDownIconComponent={() => <MaterialIcons name="keyboard-arrow-down" size={20} color="#64748B" />}
                      ArrowUpIconComponent={() => <MaterialIcons name="keyboard-arrow-up" size={20} color="#64748B" />}
                    />
                  </View>

                  {/* Comments - now per-row (row.commend), not a shared global field */}
                  <View style={styles.inputFieldGroup}>
                    <Text style={styles.fieldInputLabel}>Comments</Text>
                    <TextInput
                      style={[styles.formTextInputElement, styles.formMessageInputElement, focusedField === `comments_${row.id}` && styles.activeFocusedBorder]}
                      placeholder="Enter summary or notes..."
                      placeholderTextColor="#94A3B8"
                      value={row.commend}
                      onChangeText={(text) => setFollowUpRows(prev => prev.map(r => r.id === row.id ? { ...r, commend: text } : r))}
                      multiline={true}
                      numberOfLines={4}
                      textAlignVertical="top"
                      onFocus={() => setFocusedField(`comments_${row.id}`)}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>
              );
            })}

            {showDatePicker && (
              <DateTimePicker
                value={followUpRows.find(r => r.id === openDateId)?.date || new Date()}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setFocusedField(null);
                  handleDateChange(event, date);
                }}
              />
            )}

            <TouchableOpacity style={styles.addFollowUpRowBtn} activeOpacity={0.8} onPress={addFollowUpRow}>
              <Feather name="plus-circle" size={18} color="#10B981" />
              <Text style={styles.addFollowUpRowBtnText}>Add Another Follow Up Entry</Text>
            </TouchableOpacity>

            {/* Previous Follow-Ups History */}
            {followupsList.length > 0 && (
              <View style={styles.inputFieldGroup}>
                <Text style={styles.fieldInputLabel}>Follow-up History</Text>
                <View style={styles.followupHistoryCard}>
                  {followupsList.map((f, index) => {
                    // format date safely
                    const dt = new Date(f.created_at);
                    const formattedDate = !isNaN(dt.getTime()) ? dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Unknown Date';

                    return (
                      <View key={index} style={[styles.followupItem, index < followupsList.length - 1 && styles.followupItemBorder]}>
                        <View style={styles.followupHeaderRow}>
                          <Text style={styles.followupStatusText}>{f.status_relation?.name || 'Status Updated'}</Text>
                          <Text style={styles.followupDateText}>{formattedDate}</Text>
                        </View>
                        {f.commend && <Text style={styles.followupCommentText}>{f.commend}</Text>}
                        {f.followup_date && (
                          <Text style={styles.followupNextDateText}>Next: {f.followup_date.split(' ')[0]}</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Whatsapp Checkbox */}
            <TouchableOpacity
              style={styles.checkboxWrapperContainer}
              activeOpacity={0.8}
              onPress={() => setSendWhatsapp(!sendWhatsapp)}
            >
              <View style={[styles.checkboxInputDisplay, sendWhatsapp && styles.checkboxActiveCheckedState]}>
                {sendWhatsapp && <MaterialIcons name="check" size={14} color="#FFFFFF" />}
              </View>
              <Text style={styles.checkboxLabelContentText}>Send updates via WhatsApp notification</Text>
            </TouchableOpacity>

            <View style={{ height: 30 }} />
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.pageFooter}>
            <TouchableOpacity
              style={styles.closeBtn}
              disabled={isSaving}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.closeBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, isSaving && { opacity: 0.7 }]} onPress={handleSave} disabled={isSaving}>
              {isSaving ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>Processing...</Text>
                </View>
              ) : (
                <Text style={styles.saveBtnText}>Save Follow Up</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditEnquiryForm;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardContainer: {
    flex: 1,
  },
  pageContent: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  pageBody: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  sectionAccentBar: {
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: COLORS.accent || '#2563EB',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  inputFieldGroup: {
    marginBottom: 14,
    width: '100%',
  },
  required: {
    color: '#EF4444',
  },
  fieldInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  formTextInputElement: {
    width: '100%',
    height: 46,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    fontWeight: '500',
  },
  formMessageInputElement: {
    height: 90,
    paddingTop: 12,
    paddingBottom: 12,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  formInlineDropdown: {
    width: '100%',
    height: 46,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
  },
  standaloneActionAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#10B981',
    gap: 6,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  disabledInputBackground: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  activeFocusedBorder: {
    borderColor: COLORS.accent || '#2563EB',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
  },
  activeFocusedDropdownBorder: {
    borderColor: COLORS.accent || '#2563EB',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
  },
  dropdownPlaceholderStyle: {
    fontSize: 14,
    color: '#94A3B8',
  },
  dropdownSelectedTextStyle: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  dropdownMenuFloatingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 2,
    maxHeight: 220,
  },
  searchContainerStyle: {
    borderBottomColor: '#E2E8F0',
    borderBottomWidth: 1,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
  },
  searchTextInputStyle: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    height: 38,
  },
  listItemLabelStyle: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '400',
  },
  selectedItemLabelStyle: {
    fontSize: 14,
    color: COLORS.accent || '#2563EB',
    fontWeight: '600',
  },
  selectedItemContainerStyle: {
    backgroundColor: `${COLORS.accent || '#2563EB'}0D`,
  },
  dropdownInnerRowItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#334155',
  },
  checkboxWrapperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingVertical: 6,
  },
  checkboxInputDisplay: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 5,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxActiveCheckedState: {
    backgroundColor: COLORS.accent || '#2563EB',
    borderColor: COLORS.accent || '#2563EB',
  },
  followupHistoryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  followupItem: {
    padding: 12,
  },
  followupItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  followupHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  followupStatusText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  followupDateText: {
    fontSize: 12,
    color: '#64748B',
  },
  followupCommentText: {
    fontSize: 13,
    color: '#334155',
    marginTop: 4,
  },
  followupNextDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accent || '#0F172A',
    marginTop: 6,
  },
  checkboxLabelContentText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
  },
  pageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 12,
    paddingBottom: Platform.OS === 'android' ? 45 : 24,
  },
  closeBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  closeBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    height: 46,
    borderRadius: 10,
    backgroundColor: COLORS.accent || '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dynamicRowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dynamicRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dynamicRowTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  dynamicRowDeleteBtn: {
    padding: 4,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
  },
  addFollowUpRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
    marginBottom: 16,
    gap: 8,
  },
  addFollowUpRowBtnText: {
    color: '#10B981',
    fontWeight: '600',
    fontSize: 14,
  },
});
