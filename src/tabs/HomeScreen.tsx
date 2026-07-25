import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ScrollView, Platform, StatusBar, ActivityIndicator, Modal, TextInput, RefreshControl, TouchableWithoutFeedback, ToastAndroid, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LandingPageCard, { LandingPageLead, LeadHeaderControls } from '../component/LandingPageCard';
import ContactEnquiryCard, { ContactEnquiryLead } from '../component/ContactEnquiryCard';
import DMLeadCard, { DMLeadData } from '../component/DMLeadCard';
import GraphicDesignCard, { GraphicDesignLead } from '../component/GraphicDesignCard';
import MetaLeadCard, { MetaLead } from '../component/MetaLeadCard';
import { COLORS } from '../theme/colors';
import DropDownPicker from 'react-native-dropdown-picker';
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute, DrawerActions, useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import api from '../config/apiConfig';
import * as XLSX from 'xlsx';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { PermissionsAndroid, Clipboard } from 'react-native';
import RNBlobUtil from 'react-native-blob-util';
import * as RNHTMLtoPDFModule from 'react-native-html-to-pdf';
import RNPrint from 'react-native-print';

// Safe wrapper — bypasses the broken TS default-export types on this package

const RNHTMLtoPDF: any = (RNHTMLtoPDFModule as any)?.default ?? RNHTMLtoPDFModule;

let isExportingPdf = false;

// Top-level lead source category tabs
type CategoryKey = 'landing' | 'contact' | 'dm' | 'graphic' | 'media';

const CATEGORY_TABS: { key: CategoryKey; label: string; icon: string }[] = [
  { key: 'landing', label: 'Landing', icon: 'web' },
  { key: 'contact', label: 'Contact', icon: 'contact-page' },
  { key: 'dm', label: 'Insta DM', icon: 'chat' },
  { key: 'graphic', label: 'Graphic', icon: 'brush' },
  { key: 'media', label: 'Media', icon: 'campaign' },
];

// Sub-filter pills shown only for the Contact Page category
const CONTACT_SOURCE_OPTIONS = [
  'All',
  'Enquiry',
  'Contact',
  'Whatsapp',
  'Facebook',
  'DM',
  'Graphic Design',
];

const PAGE_SIZE = 10;

// ---- Maps a raw API contact record into the shape ContactEnquiryCard expects ----
const mapApiContact = (item: any): ContactEnquiryLead => ({
  id: item.id?.toString() || Math.random().toString(),
  assignedName: item.assigned_user?.name || 'Unassigned',
  source: item.sources || 'Unknown',
  dateTime: item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A',
  name: item.name || 'Unknown',
  email: item.email || 'N/A',
  phone: item.phone || 'N/A',
  location: item.city || 'N/A',
  message: item.message || 'No message',
  status: item.fb_status === '1' || item.fb_status === 1 ? 'Resolved' : 'New',
});

// ---- Landing Page API mapper ----
const mapApiLanding = (item: any): LandingPageLead => ({
  id: item.id?.toString() || Math.random().toString(),
  dateTime: item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A',
  name: item.name || 'Unknown',
  email: item.email || 'N/A',
  phone: item.country_code ? `${item.country_code} ${item.phone}` : (item.phone || 'N/A'),
  message: item.msg || item.description || 'No message',
  websiteType: item.website_type || 'N/A',
  verified: item.verified === '1' || item.verified === 1,
  status: item.status || '',
});

// ---- Insta DM API mapper ----
const mapApiDM = (item: any): DMLeadData => ({
  id: item.id?.toString() || Math.random().toString(),
  dateTime: item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A',
  name: item.name || 'Unknown',
  email: item.email || 'N/A',
  phone: item.country_code ? `${item.country_code} ${item.phone}` : (item.phone || 'N/A'),
  message: item.message || item.msg || item.description || 'No message',
  assignedName: item.assigned_user?.name || 'Unassigned',
});

// ---- Graphic Design API mapper ----
const mapApiGraphic = (item: any): GraphicDesignLead => ({
  id: item.id?.toString() || Math.random().toString(),
  dateTime: item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A',
  name: item.name || 'Unknown',
  email: item.email || 'N/A',
  phone: item.country_code ? `${item.country_code} ${item.phone}` : (item.phone || 'N/A'),
  message: item.message || item.msg || item.description || 'No message',
  assignedName: item.assigned_user?.name || 'Unassigned',
});

const HomeScreen = () => {
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const [activeCategory, setActiveCategory] = useState<CategoryKey>('landing');
  const [contactSource, setContactSource] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const [isRefreshing, setIsRefreshing] = useState(false);

  // ---- Dynamic Contact Leads State (fully API-driven, no mock fallback) ----
  const [dynamicContactLeads, setDynamicContactLeads] = useState<ContactEnquiryLead[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const contactsRequestRef = useRef(0);

  // ---- Dynamic Landing Page Leads State (fully API-driven, no mock fallback) ----
  const [dynamicLandingLeads, setDynamicLandingLeads] = useState<LandingPageLead[]>([]);
  const [isLoadingLanding, setIsLoadingLanding] = useState(false);
  const landingRequestRef = useRef(0);

  // ---- Dynamic Insta DM Leads State (fully API-driven, no mock fallback) ----
  const [dynamicDMLeads, setDynamicDMLeads] = useState<DMLeadData[]>([]);
  const [isLoadingDM, setIsLoadingDM] = useState(false);
  const dmRequestRef = useRef(0);

  // ---- Dynamic Graphic Design Leads State (fully API-driven, no mock fallback) ----
  const [dynamicGraphicLeads, setDynamicGraphicLeads] = useState<GraphicDesignLead[]>([]);
  const [isLoadingGraphic, setIsLoadingGraphic] = useState(false);
  const graphicRequestRef = useRef(0);


  useEffect(() => {
    const requestedCategory = route.params?.category as CategoryKey | undefined;
    if (requestedCategory && requestedCategory !== activeCategory) {
      setActiveCategory(requestedCategory);
      setCurrentPage(1);
      setSelectedIds(new Set());
    }
  }, [route.params?.category, activeCategory]);




  useFocusEffect(
    useCallback(() => {
      if (activeCategory === 'contact') fetchContacts(contactSource, searchQuery);
      else if (activeCategory === 'landing') fetchLandingLeads(searchQuery);
      else if (activeCategory === 'dm') fetchDMLeads(searchQuery);
      else if (activeCategory === 'graphic') fetchGraphicLeads(searchQuery);
    }, [activeCategory, contactSource])
  );

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchContacts = async (source: string, query: string = searchQuery) => {
    const requestId = ++contactsRequestRef.current;

    setIsLoadingContacts(true);
    setDynamicContactLeads([]);
    try {

      let url = '/contacts/';
      if (query) {
        url = `/contact/search?name=${encodeURIComponent(query)}`;
      } else if (source !== 'All') {
        // Maps each visible pill label to the value the backend expects
        const SOURCE_MAP: Record<string, string> = {
          Enquiry: 'ENQ',
          Contact: 'Website',
          Whatsapp: 'Whatsapp',
          Facebook: 'Facebook',
          DM: 'DM',
          'Graphic Design': 'Graphic Design',
        };
        const apiSource = SOURCE_MAP[source] || source;
        url = `/contacts/source/${encodeURIComponent(apiSource)}`;
      }

      console.log('Search API Called for Contacts:', api.defaults.baseURL + url);
      const response = await api.get(url);


      if (requestId !== contactsRequestRef.current) return;

      // Different endpoints shape the payload slightly differently:

      const rawList = Array.isArray(response.data?.data)
        ? response.data.data
        : response.data?.data?.contacts;

      if (response.data && (response.data.status || response.data.success) && Array.isArray(rawList)) {
        setDynamicContactLeads(rawList.map(mapApiContact));
      } else {
        setDynamicContactLeads([]);
      }
    } catch (error) {
      if (requestId !== contactsRequestRef.current) return; // stale, ignore
      console.error('Failed to fetch contacts', error);
      setDynamicContactLeads([]);
    } finally {
      if (requestId === contactsRequestRef.current) {
        setIsLoadingContacts(false);
      }
    }
  };


  //fetchLandingLeads
  const fetchLandingLeads = async (query: string = searchQuery) => {
    const requestId = ++landingRequestRef.current;

    setIsLoadingLanding(true);
    setDynamicLandingLeads([]);
    try {
      let url = '/landing-pages';
      if (query) {
        url = `/landing/search?name=${encodeURIComponent(query)}`;
      }
      console.log('Search API Called for Landing Pages:', api.defaults.baseURL + url);
      const response = await api.get(url);

      if (requestId !== landingRequestRef.current) return;

      const rawList = Array.isArray(response.data?.data) ? response.data.data : [];

      if ((response.data?.success || response.data?.status) && Array.isArray(rawList)) {
        setDynamicLandingLeads(rawList.map(mapApiLanding));
      } else {
        setDynamicLandingLeads([]);
      }
    } catch (error) {
      if (requestId !== landingRequestRef.current) return;
      console.error('Failed to fetch landing leads', error);
      setDynamicLandingLeads([]);
    } finally {
      if (requestId === landingRequestRef.current) {
        setIsLoadingLanding(false);
      }
    }
  };

  // Filter landing leads by status via API
  const fetchLandingLeadsByStatus = async (status: string) => {
    const requestId = ++landingRequestRef.current;

    setIsLoadingLanding(true);
    setDynamicLandingLeads([]);
    try {
      console.log('Filter by Status API Called:', api.defaults.baseURL + '/landing-pages/status', { status });
      const payload = {
        status: status
      }
      const response = await api.get('/landing-pages/status', {
        params: { status },
      });

      if (requestId !== landingRequestRef.current) return;

      const rawList = Array.isArray(response.data?.data) ? response.data.data : [];

      if ((response.data?.success || response.data?.status) && Array.isArray(rawList)) {
        setDynamicLandingLeads(rawList.map(mapApiLanding));
      } else {
        setDynamicLandingLeads([]);
      }
    } catch (error) {
      if (requestId !== landingRequestRef.current) return;
      console.error('Failed to filter landing leads by status', error);
      setDynamicLandingLeads([]);
    } finally {
      if (requestId === landingRequestRef.current) {
        setIsLoadingLanding(false);
      }
    }
  };

  //fetchDMLeads
  const fetchDMLeads = async (query: string = searchQuery) => {
    const requestId = ++dmRequestRef.current;

    setIsLoadingDM(true);
    setDynamicDMLeads([]); // clear stale rows immediately so the spinner shows right away
    try {
      let url = '/dm-enquiries';
      if (query) {
        url = `/dm/search?name=${encodeURIComponent(query)}`;
      }
      console.log('Search API Called for DM:', api.defaults.baseURL + url);
      const response = await api.get(url);

      if (requestId !== dmRequestRef.current) return;

      const rawList = Array.isArray(response.data?.data) ? response.data.data : [];

      if ((response.data?.success || response.data?.status) && Array.isArray(rawList)) {
        setDynamicDMLeads(rawList.map(mapApiDM));
      } else {
        setDynamicDMLeads([]);
      }
    } catch (error) {
      if (requestId !== dmRequestRef.current) return;
      console.error('Failed to fetch DM leads', error);
      setDynamicDMLeads([]);
    } finally {
      if (requestId === dmRequestRef.current) {
        setIsLoadingDM(false);
      }
    }
  };

  //fetchGraphicLeads
  const fetchGraphicLeads = async (query: string = searchQuery) => {
    const requestId = ++graphicRequestRef.current;

    setIsLoadingGraphic(true);
    setDynamicGraphicLeads([]); // clear stale rows immediately so the spinner shows right away
    try {
      let url = '/graphic-design-enquiries';
      if (query) {
        url = `/graphic-design/search?name=${encodeURIComponent(query)}`;
      }
      console.log('Search API Called for Graphic Design:', api.defaults.baseURL + url);
      const response = await api.get(url);

      if (requestId !== graphicRequestRef.current) return;

      const rawList = Array.isArray(response.data?.data) ? response.data.data : [];

      if ((response.data?.success || response.data?.status) && Array.isArray(rawList)) {
        setDynamicGraphicLeads(rawList.map(mapApiGraphic));
      } else {
        setDynamicGraphicLeads([]);
      }
    } catch (error) {
      if (requestId !== graphicRequestRef.current) return;
      console.error('Failed to fetch graphic leads', error);
      setDynamicGraphicLeads([]);
    } finally {
      if (requestId === graphicRequestRef.current) {
        setIsLoadingGraphic(false);
      }
    }
  };

  //fetchStatus 
  const fetchStaff = async () => {
    try {
      const response = await api.get("/contacts/user");

      if (response.data?.success) {
        const staffList = response.data.data.map((item: any) => ({
          label: item.name,
          value: item.id.toString(),
        }));

        setStaffOptions(staffList);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (activeCategory === 'contact') await fetchContacts(contactSource, searchQuery);
      else if (activeCategory === 'landing') await fetchLandingLeads(searchQuery);
      else if (activeCategory === 'dm') await fetchDMLeads(searchQuery);
      else if (activeCategory === 'graphic') await fetchGraphicLeads(searchQuery);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Bulk select for Landing Page
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Status filter for Landing Page
  const [selectedLandingStatus, setSelectedLandingStatus] = useState<string | null>(null);

  const [activeDateType, setActiveDateType] = useState<"startDate" | "endDate" | null>(null);
  const [showNativeDatePicker, setShowNativeDatePicker] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Assign Staff Modal State
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [assignTargetId, setAssignTargetId] = useState<string | null>(null);
  const [selectedStaffToAssign, setSelectedStaffToAssign] = useState<string | null>(null);
  const [staffDropdownOpen, setStaffDropdownOpen] = useState(false);

  const [staffOptions, setStaffOptions] = useState<
    { label: string; value: string }[]
  >([]);

  // Edit Enquiry Navigation
  const handleOpenEditModal = (item: any) => {
    navigation.navigate('EditEnquiryForm', { leadData: item });
  };

  const handleOpenAssignModal = (item: any) => {
    setAssignTargetId(item.id);
    setSelectedStaffToAssign(null);
    setIsAssignModalVisible(true);
  };

  const handleAssignSubmit = async () => {
    if (!selectedStaffToAssign || !assignTargetId) return;

    try {
      const payload = {
        enquiry_id: Number(assignTargetId),
        user_id: Number(selectedStaffToAssign)
      };

      const response = await api.post('/contacts/assign', payload);

      if (response.data) {
        ToastAndroid.show('Staff assigned successfully', ToastAndroid.SHORT);

        if (activeCategory === 'contact') {
          setDynamicContactLeads(prev => prev.map(lead => {
            if (lead.id === assignTargetId) {
              const assignedStaffLabel = staffOptions.find(opt => opt.value === selectedStaffToAssign)?.label || lead.assignedName;
              return { ...lead, assignedName: assignedStaffLabel };
            }
            return lead;
          }));
        }
      }
    } catch (error) {
      console.error('Failed to assign staff:', error);
      ToastAndroid.show('Failed to assign staff', ToastAndroid.SHORT);
    } finally {
      setIsAssignModalVisible(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowNativeDatePicker(false);
    }
    if (event.type === "dismissed") {
      setActiveDateType(null);
      return;
    }
    if (selectedDate) {
      if (activeDateType === "startDate") setStartDate(selectedDate);
      if (activeDateType === "endDate") setEndDate(selectedDate);
    }
    setActiveDateType(null);
  };


  const handleOpenDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const requestStoragePermission = async () => {
    if (Platform.OS !== 'android' || Platform.Version >= 29) return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission',
          message: 'App needs access to storage to save the Excel file.',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };



  // Helper: save base64 to file + share
  const saveAndShare = async (base64Data: string, fileName: string, mimeType: string) => {
    let finalFilePath = '';
    if (Platform.OS === 'android') {
      if (Platform.Version >= 29) {
        const tempPath = `${RNBlobUtil.fs.dirs.CacheDir}/${fileName}`;
        await RNBlobUtil.fs.writeFile(tempPath, base64Data, 'base64');
        await RNBlobUtil.MediaCollection.copyToMediaStore(
          { name: fileName, parentFolder: '', mimeType },
          'Download',
          tempPath
        );
        finalFilePath = tempPath;
      } else {
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) { ToastAndroid.show('Storage permission denied', ToastAndroid.SHORT); return; }
        finalFilePath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
        await RNFS.writeFile(finalFilePath, base64Data, 'base64');
      }
      ToastAndroid.show('Downloaded successfully', ToastAndroid.SHORT);
    } else {
      finalFilePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      await RNFS.writeFile(finalFilePath, base64Data, 'base64');
    }
    await Share.open({ url: `file://${finalFilePath}`, type: mimeType, filename: fileName, failOnCancel: false });
  };

  // Helper: save utf8 text + share
  const saveTextAndShare = async (content: string, fileName: string, mimeType: string) => {
    let finalFilePath = '';
    if (Platform.OS === 'android') {
      if (Platform.Version >= 29) {
        const tempPath = `${RNBlobUtil.fs.dirs.CacheDir}/${fileName}`;
        await RNBlobUtil.fs.writeFile(tempPath, content, 'utf8');
        await RNBlobUtil.MediaCollection.copyToMediaStore(
          { name: fileName, parentFolder: '', mimeType },
          'Download',
          tempPath
        );
        finalFilePath = tempPath;
      } else {
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) { ToastAndroid.show('Storage permission denied', ToastAndroid.SHORT); return; }
        finalFilePath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
        await RNFS.writeFile(finalFilePath, content, 'utf8');
      }
      ToastAndroid.show('Downloaded successfully', ToastAndroid.SHORT);
    } else {
      finalFilePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      await RNFS.writeFile(finalFilePath, content, 'utf8');
    }
    await Share.open({ url: `file://${finalFilePath}`, type: mimeType, filename: fileName, failOnCancel: false });
  };

  // Per-category field mapping — returns { headers, rows, title, accent }
  const getExportConfig = () => {
    switch (activeCategory) {
      case 'landing': {
        const data = dynamicLandingLeads;
        return {
          data,
          title: 'Landing Page Leads',
          accent: '#1D4ED8',
          headers: ['#', 'Name', 'Email', 'Phone', 'Website Type', 'Message', 'Status', 'Verified', 'Date/Time'],
          toExcelRow: (l: typeof data[0]) => ({
            'Name': l.name,
            'Email': l.email,
            'Phone': l.phone,
            'Website Type': l.websiteType,
            'Message': l.message,
            'Status': l.status,
            'Verified': l.verified ? 'Yes' : 'No',
            'Date/Time': l.dateTime,
          }),
          toCsvCells: (l: typeof data[0]) => [l.name, l.email, l.phone, l.websiteType, l.message, l.status, l.verified ? 'Yes' : 'No', l.dateTime],
          toCopyLine: (l: typeof data[0], i: number) =>
            `#${i + 1}\nName: ${l.name}\nEmail: ${l.email}\nPhone: ${l.phone}\nWebsite Type: ${l.websiteType}\nMessage: ${l.message}\nStatus: ${l.status}\nVerified: ${l.verified ? 'Yes' : 'No'}\nDate: ${l.dateTime}`,
          toPrintCells: (l: typeof data[0], i: number) =>
            `<td>${i + 1}</td><td>${l.name || '-'}</td><td>${l.email || '-'}</td><td>${l.phone || '-'}</td><td>${l.websiteType || '-'}</td><td>${l.message || '-'}</td><td>${l.status || '-'}</td><td>${l.verified ? 'Yes' : 'No'}</td><td>${l.dateTime || '-'}</td>`,
        };
      }
      case 'contact': {
        const data = dynamicContactLeads;
        return {
          data,
          title: 'Contact Page Leads',
          accent: '#6D28D9',
          headers: ['#', 'Name', 'Email', 'Phone', 'Location', 'Source', 'Status', 'Assigned To', 'Message', 'Date/Time'],
          toExcelRow: (l: typeof data[0]) => ({
            'Name': l.name,
            'Email': l.email,
            'Phone': l.phone,
            'Location': l.location,
            'Source': l.source,
            'Status': l.status,
            'Assigned To': l.assignedName,
            'Message': l.message,
            'Date/Time': l.dateTime,
          }),
          toCsvCells: (l: typeof data[0]) => [l.name, l.email, l.phone, l.location, l.source, l.status, l.assignedName, l.message, l.dateTime],
          toCopyLine: (l: typeof data[0], i: number) =>
            `#${i + 1}\nName: ${l.name}\nEmail: ${l.email}\nPhone: ${l.phone}\nLocation: ${l.location}\nSource: ${l.source}\nStatus: ${l.status}\nAssigned To: ${l.assignedName}\nMessage: ${l.message}\nDate: ${l.dateTime}`,
          toPrintCells: (l: typeof data[0], i: number) =>
            `<td>${i + 1}</td><td>${l.name || '-'}</td><td>${l.email || '-'}</td><td>${l.phone || '-'}</td><td>${l.location || '-'}</td><td>${l.source || '-'}</td><td>${l.status || '-'}</td><td>${l.assignedName || '-'}</td><td>${l.message || '-'}</td><td>${l.dateTime || '-'}</td>`,
        };
      }
      case 'dm': {
        const data = dynamicDMLeads;
        return {
          data,
          title: 'Insta DM Leads',
          accent: '#DB2777',
          headers: ['#', 'Name', 'Email', 'Phone', 'Assigned To', 'Message', 'Date/Time'],
          toExcelRow: (l: typeof data[0]) => ({
            'Name': l.name,
            'Email': l.email,
            'Phone': l.phone,
            'Assigned To': l.assignedName || 'Unassigned',
            'Message': l.message,
            'Date/Time': l.dateTime,
          }),
          toCsvCells: (l: typeof data[0]) => [l.name, l.email, l.phone, l.assignedName || 'Unassigned', l.message, l.dateTime],
          toCopyLine: (l: typeof data[0], i: number) =>
            `#${i + 1}\nName: ${l.name}\nEmail: ${l.email}\nPhone: ${l.phone}\nAssigned To: ${l.assignedName || 'Unassigned'}\nMessage: ${l.message}\nDate: ${l.dateTime}`,
          toPrintCells: (l: typeof data[0], i: number) =>
            `<td>${i + 1}</td><td>${l.name || '-'}</td><td>${l.email || '-'}</td><td>${l.phone || '-'}</td><td>${l.assignedName || 'Unassigned'}</td><td>${l.message || '-'}</td><td>${l.dateTime || '-'}</td>`,
        };
      }
      case 'graphic': {
        const data = dynamicGraphicLeads;
        return {
          data,
          title: 'Graphic Design Leads',
          accent: '#7C3AED',
          headers: ['#', 'Name', 'Email', 'Phone', 'Assigned To', 'Message', 'Date/Time'],
          toExcelRow: (l: typeof data[0]) => ({
            'Name': l.name,
            'Email': l.email,
            'Phone': l.phone,
            'Assigned To': l.assignedName || 'Unassigned',
            'Message': l.message,
            'Date/Time': l.dateTime,
          }),
          toCsvCells: (l: typeof data[0]) => [l.name, l.email, l.phone, l.assignedName || 'Unassigned', l.message, l.dateTime],
          toCopyLine: (l: typeof data[0], i: number) =>
            `#${i + 1}\nName: ${l.name}\nEmail: ${l.email}\nPhone: ${l.phone}\nAssigned To: ${l.assignedName || 'Unassigned'}\nMessage: ${l.message}\nDate: ${l.dateTime}`,
          toPrintCells: (l: typeof data[0], i: number) =>
            `<td>${i + 1}</td><td>${l.name || '-'}</td><td>${l.email || '-'}</td><td>${l.phone || '-'}</td><td>${l.assignedName || 'Unassigned'}</td><td>${l.message || '-'}</td><td>${l.dateTime || '-'}</td>`,
        };
      }
      default:
        return null;
    }
  };

  // ---- COPY ----
  const handleExportCopy = () => {
    try {
      const cfg = getExportConfig();
      if (!cfg || cfg.data.length === 0) { ToastAndroid.show('No records to copy', ToastAndroid.SHORT); return; }

      let filteredData: any[] = cfg.data;
      // For contact page, filter by active source pill
      if (activeCategory === 'contact' && contactSource !== 'All') {
        const SOURCE_MAP: Record<string, string> = { Enquiry: 'ENQ', Contact: 'Website', Whatsapp: 'Whatsapp', Facebook: 'Facebook', DM: 'DM', 'Graphic Design': 'Graphic Design' };
        const apiSource = SOURCE_MAP[contactSource] || contactSource;
        filteredData = (cfg.data as typeof dynamicContactLeads).filter(l => l.source === apiSource || l.source === contactSource);
        if (filteredData.length === 0) { ToastAndroid.show('No records for this filter', ToastAndroid.SHORT); return; }
      }

      const text = filteredData.map((item, i) => cfg.toCopyLine(item as any, i)).join('\n\n---\n\n');
      Clipboard.setString(text);
      ToastAndroid.show(`Copied ${filteredData.length} record(s) to clipboard`, ToastAndroid.SHORT);
    } catch (e) {
      console.error('Copy error:', e);
      ToastAndroid.show('Failed to copy', ToastAndroid.SHORT);
    }
  };

  // ---- EXCEL ----
  const handleExportExcel = async () => {
    try {
      const cfg = getExportConfig();
      if (!cfg || cfg.data.length === 0) { ToastAndroid.show('No records to export', ToastAndroid.SHORT); return; }

      const exportData = cfg.data.map((item) => cfg.toExcelRow(item as any));
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, cfg.title);
      const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
      const fileName = `${cfg.title.replace(/ /g, '_')}_${Date.now()}.xlsx`;
      await saveAndShare(wbout, fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    } catch (e) {
      console.error('Excel error:', e);
      ToastAndroid.show('Failed to export Excel', ToastAndroid.SHORT);
    }
  };

  // ---- CSV ----
  const handleExportCSV = async () => {
    try {
      const cfg = getExportConfig();
      if (!cfg || cfg.data.length === 0) { ToastAndroid.show('No records to export', ToastAndroid.SHORT); return; }

      const escapeCSV = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const headerRow = cfg.headers.slice(1).join(','); // skip '#' column
      const dataRows = cfg.data.map((item) => cfg.toCsvCells(item as any).map(escapeCSV).join(','));
      const csvContent = [headerRow, ...dataRows].join('\n');
      const fileName = `${cfg.title.replace(/ /g, '_')}_${Date.now()}.csv`;
      await saveTextAndShare(csvContent, fileName, 'text/csv');
    } catch (e) {
      console.error('CSV error:', e);
      ToastAndroid.show('Failed to export CSV', ToastAndroid.SHORT);
    }
  };

  // ---- PRINT ----
  const handleExportPrint = async () => {
    try {
      const cfg = getExportConfig();
      if (!cfg || cfg.data.length === 0) {
        ToastAndroid.show('No records to export', ToastAndroid.SHORT);
        return;
      }

      const accentColor = cfg.accent;

      const headerCells = cfg.headers.map(h => `<th>${h}</th>`).join('');
      const bodyRows = cfg.data
        .map((item, i) => `
        <tr class="${i % 2 === 0 ? 'row-even' : 'row-odd'}">
          ${cfg.toPrintCells(item as any, i)}
        </tr>`)
        .join('');

      const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    background:#f8fafc;
    padding: 28px;
  }

  /* ---- Header banner ---- */
  .report-header {
    background: linear-gradient(135deg, ${accentColor}, ${accentColor}cc);
    border-radius: 14px;
    padding: 24px 28px;
    margin-bottom: 22px;
    color: #fff;
    box-shadow: 0 4px 14px rgba(0,0,0,0.12);
  }
  .report-header .brand {
    font-size: 11px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    opacity: 0.75;
    margin-bottom: 6px;
    font-weight: 700;
  }
  .report-header h1 {
    font-size: 24px;
    font-weight: 800;
    margin-bottom: 6px;
  }
  .report-header p {
    font-size: 11.5px;
    opacity: 0.9;
  }

  /* ---- Stat cards ---- */
  .stats-row {
    display: flex;
    gap: 14px;
    margin-bottom: 22px;
  }
  .stat-card {
    flex: 1;
    background: #fff;
    border-radius: 12px;
    padding: 14px 18px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }
  .stat-label {
    font-size: 10px;
    color: #64748b;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    margin-bottom: 6px;
  }
  .stat-value {
    font-size: 22px;
    font-weight: 800;
    color: ${accentColor};
  }
  .stat-value.small {
    font-size: 14px;
    margin-top: 2px;
  }

  /* ---- Table ---- */
  .table-container {
    background: #fff;
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  }
  table { width:100%; border-collapse: collapse; }
  thead tr { background: ${accentColor}; }
  th {
    color: #fff;
    padding: 11px 10px;
    text-align: left;
    font-size: 9.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    white-space: nowrap;
  }
  td {
    padding: 10px 10px;
    font-size: 10.5px;
    color: #0f172a;
    vertical-align: top;
    word-break: break-word;
    border-bottom: 1px solid #f1f5f9;
  }
  .row-even td { background: #f8fafc; }
  .row-odd td  { background: #ffffff; }
  tr:last-child td { border-bottom: none; }

  /* ---- Footer ---- */
  .footer {
    margin-top: 18px;
    text-align: center;
    font-size: 9.5px;
    color: #94a3b8;
    letter-spacing: 0.3px;
  }
</style>
</head>
<body>

  <div class="report-header">
    <div class="brand">WebbiTech Lead Tracker</div>
    <h1>${cfg.title} Report</h1>
    <p>Generated on ${new Date().toLocaleString()} &nbsp;•&nbsp; Total: ${cfg.data.length} records</p>
  </div>

  <div class="stats-row">
    <div class="stat-card">
      <div class="stat-label">Total Records</div>
      <div class="stat-value">${cfg.data.length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Export Date</div>
      <div class="stat-value small">${new Date().toLocaleDateString()}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Category</div>
      <div class="stat-value small">${activeCategory.toUpperCase()}</div>
    </div>
  </div>

  <div class="table-container">
    <table>
      <thead><tr>${headerCells}</tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>
  </div>

  <div class="footer">Generated by WebbiTech Lead Tracker &nbsp;•&nbsp; Confidential</div>

</body>
</html>`;

      const fileName = `${cfg.title.replace(/ /g, '_')}_${Date.now()}`;

      // ---- Generate PDF (this returns { filePath } or throws) ----
      const pdf = await RNHTMLtoPDF.convert({ html, fileName, directory: 'Documents', base64: false });

      // ---- CRITICAL: this null-check is what was missing before, and is why it crashed ----
      if (!pdf || !pdf.filePath) {
        console.error('PDF generation returned no filePath:', pdf);
        ToastAndroid.show('Failed to generate PDF', ToastAndroid.SHORT);
        return;
      }

      const sourcePath = pdf.filePath.replace('file://', '');
      let finalUrl = `file://${sourcePath}`;

      // ---- Move/copy it into Downloads so the user can actually find it ----
      if (Platform.OS === 'android') {
        try {
          if (Platform.Version >= 29) {
            await RNBlobUtil.MediaCollection.copyToMediaStore(
              { name: `${fileName}.pdf`, parentFolder: '', mimeType: 'application/pdf' },
              'Download',
              sourcePath
            );
          } else {
            const hasPermission = await requestStoragePermission();
            if (!hasPermission) {
              ToastAndroid.show('Storage permission denied', ToastAndroid.SHORT);
              return;
            }
            const destPath = `${RNFS.DownloadDirectoryPath}/${fileName}.pdf`;
            await RNFS.copyFile(sourcePath, destPath);
            finalUrl = `file://${destPath}`;
          }
          ToastAndroid.show('PDF downloaded successfully', ToastAndroid.SHORT);
        } catch (copyErr) {
          // Even if the Downloads copy fails, we still have sourcePath to share from
          console.error('Copy to Downloads failed, sharing from cache instead:', copyErr);
        }
      }

      // ---- Final guard before Share.open — never pass a null/undefined url ----
      if (!finalUrl) {
        ToastAndroid.show('Failed to locate generated PDF', ToastAndroid.SHORT);
        return;
      }

      await Share.open({
        url: finalUrl,
        type: 'application/pdf',
        filename: `${fileName}.pdf`,
        failOnCancel: false,
      });
    } catch (e) {
      console.error('Print error:', e);
      ToastAndroid.show('Failed to export PDF', ToastAndroid.SHORT);
    }
  };
  //   const handleExportPrint = async () => {
  //     try {
  //       const cfg = getExportConfig();
  //       if (!cfg || cfg.data.length === 0) { ToastAndroid.show('No records to print', ToastAndroid.SHORT); return; }

  //       const accentColor = cfg.accent;
  //       const accentLight = accentColor + '18';

  //       const headerCells = cfg.headers.map(h => `<th>${h}</th>`).join('');
  //       const bodyRows = cfg.data.map((item, i) => `
  //       <tr class="${i % 2 === 0 ? 'row-even' : 'row-odd'}">
  //         ${cfg.toPrintCells(item as any, i)}
  //       </tr>`).join('');

  //       const html = `<!DOCTYPE html>
  // <html>
  // <head>
  //   <meta charset="utf-8"/>
  //   <style>
  //     * { margin:0; padding:0; box-sizing:border-box; }
  //     body { font-family: 'Helvetica Neue', Arial, sans-serif; background:#f8fafc; padding: 24px; }
  //     .report-header {
  //       background: linear-gradient(135deg, ${accentColor}, ${accentColor}cc);
  //       border-radius: 12px;
  //       padding: 20px 24px;
  //       margin-bottom: 20px;
  //       color: #fff;
  //     }
  //     .report-header h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
  //     .report-header p { font-size: 11px; opacity: 0.85; }
  //     .stats-row { display:flex; gap:12px; margin-bottom:20px; }
  //     .stat-card {
  //       flex:1; background:#fff; border-radius:10px; padding:12px 16px;
  //       border: 1px solid #e2e8f0;
  //     }
  //     .stat-label { font-size:10px; color:#64748b; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px; }
  //     .stat-value { font-size:22px; font-weight:700; color:${accentColor}; }
  //     .table-container { background:#fff; border-radius:12px; overflow:hidden; border:1px solid #e2e8f0; }
  //     table { width:100%; border-collapse:collapse; }
  //     thead tr { background:${accentColor}; }
  //     th { color:#fff; padding:10px 8px; text-align:left; font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.6px; }
  //     td { padding:9px 8px; font-size:10px; color:#0f172a; vertical-align:top; word-break:break-word; border-bottom:1px solid #f1f5f9; }
  //     .row-even td { background:#f8fafc; }
  //     .row-odd td { background:#ffffff; }
  //     .footer { margin-top:16px; text-align:center; font-size:9px; color:#94a3b8; }
  //   </style>
  // </head>
  // <body>
  //   <div class="report-header">
  //     <h1>${cfg.title} Report</h1>
  //     <p>Generated on ${new Date().toLocaleString()} &nbsp;•&nbsp; Total: ${cfg.data.length} records</p>
  //   </div>
  //   <div class="stats-row">
  //     <div class="stat-card">
  //       <div class="stat-label">Total Records</div>
  //       <div class="stat-value">${cfg.data.length}</div>
  //     </div>
  //     <div class="stat-card">
  //       <div class="stat-label">Export Date</div>
  //       <div class="stat-value" style="font-size:13px;margin-top:4px">${new Date().toLocaleDateString()}</div>
  //     </div>
  //     <div class="stat-card">
  //       <div class="stat-label">Category</div>
  //       <div class="stat-value" style="font-size:13px;margin-top:4px">${activeCategory.toUpperCase()}</div>
  //     </div>
  //   </div>
  //   <div class="table-container">
  //     <table>
  //       <thead><tr>${headerCells}</tr></thead>
  //       <tbody>${bodyRows}</tbody>
  //     </table>
  //   </div>
  //   <div class="footer">Generated by WebbiTech Lead Tracker &nbsp;•&nbsp; Confidential</div>
  // </body>
  // </html>`;

  //       const pdf = await generatePDF({
  //         html,
  //         fileName: `${cfg.title.replace(/ /g, '_')}_${Date.now()}`,
  //         directory: 'Documents',
  //       });

  //       if (pdf.filePath) {
  //         await Share.open({ url: `file://${pdf.filePath}`, type: 'application/pdf', filename: `${cfg.title}.pdf`, failOnCancel: false });
  //       } else {
  //         ToastAndroid.show('Failed to generate PDF', ToastAndroid.SHORT);
  //       }
  //     } catch (e) {
  //       console.error('Print error:', e);
  //       ToastAndroid.show('Failed to print', ToastAndroid.SHORT);
  //     }
  //   };

  // Keep old name as an alias for the Landing Page export button (LeadHeaderControls)
  const exportLandingLeadsToExcel = handleExportExcel;

  // ---- Shared: builds the styled HTML report WITH records table (used by both Print and PDF) ----
  const buildReportHtml = (cfg: NonNullable<ReturnType<typeof getExportConfig>>): string => {
    const accentColor = cfg.accent;

    const headerCells = cfg.headers.map(h => `<th>${h}</th>`).join('');

    // 👇 This is the actual records loop — every row of data becomes a <tr>
    const bodyRows = cfg.data
      .map((item, i) => `
      <tr class="${i % 2 === 0 ? 'row-even' : 'row-odd'}">
        ${cfg.toPrintCells(item as any, i)}
      </tr>`)
      .join('');

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; background:#f8fafc; padding: 28px; }
  .report-header {
    background: linear-gradient(135deg, ${accentColor}, ${accentColor}cc);
    border-radius: 14px; padding: 24px 28px; margin-bottom: 22px; color: #fff;
    box-shadow: 0 4px 14px rgba(0,0,0,0.12);
  }
  .report-header .brand { font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; opacity: 0.75; margin-bottom: 6px; font-weight: 700; }
  .report-header h1 { font-size: 24px; font-weight: 800; margin-bottom: 6px; }
  .report-header p { font-size: 11.5px; opacity: 0.9; }
  .stats-row { display: flex; gap: 14px; margin-bottom: 22px; }
  .stat-card { flex: 1; background: #fff; border-radius: 12px; padding: 14px 18px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
  .stat-label { font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 6px; }
  .stat-value { font-size: 22px; font-weight: 800; color: ${accentColor}; }
  .stat-value.small { font-size: 14px; margin-top: 2px; }
  .table-container { background: #fff; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
  table { width:100%; border-collapse: collapse; }
  thead tr { background: ${accentColor}; }
  th { color: #fff; padding: 11px 10px; text-align: left; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; white-space: nowrap; }
  td { padding: 10px 10px; font-size: 10.5px; color: #0f172a; vertical-align: top; word-break: break-word; border-bottom: 1px solid #f1f5f9; }
  .row-even td { background: #f8fafc; }
  .row-odd td  { background: #ffffff; }
  tr:last-child td { border-bottom: none; }
  .footer { margin-top: 18px; text-align: center; font-size: 9.5px; color: #94a3b8; letter-spacing: 0.3px; }
</style>
</head>
<body>
  <div class="report-header">
    <div class="brand">WebbiTech Lead Tracker</div>
    <h1>${cfg.title} Report</h1>
    <p>Generated on ${new Date().toLocaleString()} &nbsp;•&nbsp; Total: ${cfg.data.length} records</p>
  </div>
  <div class="stats-row">
    <div class="stat-card"><div class="stat-label">Total Records</div><div class="stat-value">${cfg.data.length}</div></div>
    <div class="stat-card"><div class="stat-label">Export Date</div><div class="stat-value small">${new Date().toLocaleDateString()}</div></div>
    <div class="stat-card"><div class="stat-label">Category</div><div class="stat-value small">${activeCategory.toUpperCase()}</div></div>
  </div>
  <div class="table-container">
    <table>
      <thead><tr>${headerCells}</tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>
  </div>
  <div class="footer">Generated by WebbiTech Lead Tracker &nbsp;•&nbsp; Confidential</div>
</body>
</html>`;
  };


  const handlePrint = async () => {
    try {
      const cfg = getExportConfig();
      if (!cfg || cfg.data.length === 0) {
        ToastAndroid.show('No records to print', ToastAndroid.SHORT);
        return;
      }

      const html = buildReportHtml(cfg);
      await RNPrint.print({ html }); // ✅ CORRECT — uses the RNPrint import
    } catch (e) {
      console.error('Print error:', e);
      ToastAndroid.show('Failed to open print dialog', ToastAndroid.SHORT);
    }
  };

  const handleExportPDF = async () => {
    if (isExportingPdf) return;
    isExportingPdf = true;
    try {
      ToastAndroid.show('Generating PDF...', ToastAndroid.SHORT);
      const cfg = getExportConfig();
      if (!cfg || cfg.data.length === 0) {
        ToastAndroid.show('No records to export', ToastAndroid.SHORT);
        isExportingPdf = false;
        return;
      }

      const html = buildReportHtml(cfg);
      const baseName = `${cfg.title.replace(/ /g, '_')}_${Date.now()}`;
      const fileName = `${baseName}.pdf`;

      // Use base64: false to skip heavy bridge serialization and make it super fast
      const options: any = { html, fileName: baseName, base64: false, forceReset: true };
      const pdf = await RNHTMLtoPDF.generatePDF(options);

      if (!pdf || !pdf.filePath) {
        ToastAndroid.show('Failed to generate PDF', ToastAndroid.SHORT);
        return;
      }

      const sourcePath = pdf.filePath.replace('file://', '');
      let finalUrl = `file://${sourcePath}`;

      if (Platform.OS === 'android') {
        try {
          if (Platform.Version >= 29) {
            await RNBlobUtil.MediaCollection.copyToMediaStore(
              { name: fileName, parentFolder: '', mimeType: 'application/pdf' },
              'Download',
              sourcePath
            );
          } else {
            const hasPermission = await requestStoragePermission();
            if (hasPermission) {
              const destPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
              await RNFS.copyFile(sourcePath, destPath);
              finalUrl = `file://${destPath}`;
            }
          }
          ToastAndroid.show('Downloaded successfully', ToastAndroid.SHORT);
        } catch (copyErr) {
          console.error('Copy to Downloads failed', copyErr);
        }
      }

      // Small timeout ensures the toast is seen and file system settles before share sheet opens
      setTimeout(async () => {
        try {
          await Share.open({
            url: finalUrl,
            type: 'application/pdf',
            filename: fileName,
            failOnCancel: false,
          });
        } catch (err) {}
      }, 300);

    } catch (e) {
      console.error('PDF export error:', e);
      ToastAndroid.show('Failed to export PDF', ToastAndroid.SHORT);
    } finally {
      isExportingPdf = false;
    }
  };
  
  // ---- Header: drawer menu on the left, active category title centered, notification icon on the right ----
  const renderHeader = () => {
    // Same labels used in the drawer (Landing, Contact, Insta DM, Graphic, Media)
    const currentLabel = CATEGORY_TABS.find(t => t.key === activeCategory)?.label || 'Leads';

    return (
      <View style={[styles.headerContainer, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : insets.top }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.menuBtn} onPress={handleOpenDrawer} activeOpacity={0.7}>
            <MaterialIcons name="menu" size={26} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Center: currently selected category title */}
          <View style={styles.headerTitleWrapper} pointerEvents="none">
            <Text style={styles.headerTitle} numberOfLines={1}>{currentLabel}</Text>
          </View>

          {/* Right: rounded notification icon */}
          <TouchableOpacity style={styles.iconBtn} onPress={() => console.log("Notification pressed")} activeOpacity={0.7}>
            <MaterialIcons name="notifications" size={22} color="#FFFFFF" />
          </TouchableOpacity>

        </View>

        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Search anything..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            returnKeyType="search"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (text === '') {
                setTimeout(() => {
                  if (activeCategory === 'contact') fetchContacts(contactSource, '');
                  else if (activeCategory === 'landing') fetchLandingLeads('');
                  else if (activeCategory === 'dm') fetchDMLeads('');
                  else if (activeCategory === 'graphic') fetchGraphicLeads('');
                }, 100);
              }
            }}
            onSubmitEditing={() => {
              if (activeCategory === 'contact') fetchContacts(contactSource, searchQuery);
              else if (activeCategory === 'landing') fetchLandingLeads(searchQuery);
              else if (activeCategory === 'dm') fetchDMLeads(searchQuery);
              else if (activeCategory === 'graphic') fetchGraphicLeads(searchQuery);
            }}
          />
        </View>

      </View>
    );
  };



  const renderContactPageBar = () => (
    <View style={styles.filterScrollWrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterHorizontalScroll}>
        {CONTACT_SOURCE_OPTIONS.map((option) => {
          const focused = contactSource === option;
          return (
            <TouchableOpacity key={option} style={[styles.filterPill, focused && styles.activePill]} activeOpacity={0.7} onPress={() => setContactSource(option)}>
              <Text style={[styles.pillText, focused && styles.activePillText]}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {renderExportBar()}
    </View>
  );

  // ---- Shared export toolbar — shown for ALL categories ----
  const renderExportBar = () => (
    <View style={styles.exportActionContainer}>
      <View style={styles.exportGroup}>
        {[
          { label: 'Copy', onPress: handleExportCopy },
          { label: 'Excel', onPress: handleExportExcel },
          { label: 'CSV', onPress: handleExportCSV },
          { label: 'Print', onPress: handlePrint },
          { label: 'PDF', onPress: handleExportPDF },
        ].map((action) => (
          <TouchableOpacity
            key={action.label}
            style={styles.exportButton}
            onPress={action.onPress}
            activeOpacity={0.7}
          >
            <Text style={styles.exportText}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCategoryFilterBar = () => {
    switch (activeCategory) {
      case 'contact': return renderContactPageBar();
      case 'landing': return null;
      // For non-contact categories, show only the export bar (no filter pills)
      default: return <View style={styles.filterScrollWrapper}>{renderExportBar()}</View>;
    }
  };

  const renderLeadsHeader = () => (
    <View style={styles.headerFormWrapper}>
      {renderCategoryFilterBar()}
    </View>
  );

  // ---- Render the correct list data per tab (paginated) ----
  const getListData = (): any[] => {
    let allData: any[] = [];
    switch (activeCategory) {
      case 'landing': allData = dynamicLandingLeads; break;
      case 'contact': allData = dynamicContactLeads; break;
      case 'dm': allData = dynamicDMLeads; break;
      case 'graphic': allData = dynamicGraphicLeads; break;
      default: allData = [];
    }
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return allData.slice(start, end);
  };

  const totalItems =
    activeCategory === 'landing'
      ? dynamicLandingLeads.length
      : activeCategory === 'contact'
        ? dynamicContactLeads.length
        : activeCategory === 'dm'
          ? dynamicDMLeads.length
          : activeCategory === 'graphic'
            ? dynamicGraphicLeads.length
            : 0;

  const totalPages = totalItems > 0 ? Math.ceil(totalItems / PAGE_SIZE) : 0;

  const currentPageData = getListData();
  const isAllSelected = currentPageData.length > 0 && currentPageData.every((item) => selectedIds.has(item.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        currentPageData.forEach((item) => next.delete(item.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        currentPageData.forEach((item) => next.add(item.id));
        return next;
      });
    }
  };

  const handleDeleteSelected = () => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete the selected landing pages?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const idsToDelete = Array.from(selectedIds);
            const response = await api.delete('/landing/delete-multiple', {
              data: { ids: idsToDelete }
            });
            if (response.data) {
              setDynamicLandingLeads(prev => prev.filter(l => !selectedIds.has(l.id)));
              setSelectedIds(new Set());
              ToastAndroid.show('Selected leads deleted successfully', ToastAndroid.SHORT);
            }
          } catch (error) {
            console.error('Failed to delete bulk', error);
            ToastAndroid.show('Failed to delete leads', ToastAndroid.SHORT);
          }
        }
      }
    ]);
  };

  const handleDeleteContact = (id: string | number) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this contact?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const response = await api.delete(`/contacts/${id}`);
            if (response.data) {
              setDynamicContactLeads(prev => prev.filter(l => l.id !== id));
              ToastAndroid.show('Contact deleted successfully', ToastAndroid.SHORT);
            }
          } catch (error) {
            console.error('Failed to delete contact', error);
            ToastAndroid.show('Failed to delete contact', ToastAndroid.SHORT);
          }
        }
      }
    ]);
  };

  const handleDeleteDM = (id: string | number) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this DM lead?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const response = await api.delete(`/dm/delete/${id}`);
            if (response.data) {
              setDynamicDMLeads(prev => prev.filter(l => l.id !== id));
              ToastAndroid.show('DM lead deleted successfully', ToastAndroid.SHORT);
            }
          } catch (error) {
            console.error('Failed to delete DM lead', error);
            ToastAndroid.show('Failed to delete DM lead', ToastAndroid.SHORT);
          }
        }
      }
    ]);
  };

  const handleDeleteGraphic = (id: string | number) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this graphic design lead?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const response = await api.delete(`/graphic-design/delete/${id}`);
            if (response.data) {
              setDynamicGraphicLeads(prev => prev.filter(l => l.id !== id));
              ToastAndroid.show('Graphic design lead deleted successfully', ToastAndroid.SHORT);
            }
          } catch (error) {
            console.error('Failed to delete graphic design lead', error);
            ToastAndroid.show('Failed to delete graphic design lead', ToastAndroid.SHORT);
          }
        }
      }
    ]);
  };

  // Whichever category is active, this tells us whether that category's data is still loading
  const isCurrentlyLoading =
    (activeCategory === 'landing' && isLoadingLanding) ||
    (activeCategory === 'contact' && isLoadingContacts) ||
    (activeCategory === 'dm' && isLoadingDM) ||
    (activeCategory === 'graphic' && isLoadingGraphic);

  const renderCard = ({ item }: { item: any }) => {
    switch (activeCategory) {
      case 'contact':
        return (
          <ContactEnquiryCard
            item={item as ContactEnquiryLead}
            onAddEnquiry={(contactItem) => {
              navigation.navigate('AddLeadsForm', { leadData: contactItem });
            }}
            onEdit={() => handleOpenEditModal(item)}
            onView={() => navigation.navigate('ViewContactLeadDetails', { leadData: item })}
            onDelete={() => handleDeleteContact(item.id)}
            onAssign={() => handleOpenAssignModal(item)}
          />
        );
      case 'dm':
        return (
          <DMLeadCard

            item={item as DMLeadData}
            onAction={() => console.log('Action DM Lead:', item.id)}
            onEdit={() => handleOpenEditModal(item)}
            onView={() => console.log('View DM Lead:', item.id)}
            onDelete={() => handleDeleteDM(item.id)}
            onAssign={() => handleOpenAssignModal(item)}
          />
        );
      case 'graphic':
        return (
          <GraphicDesignCard
            item={item as GraphicDesignLead}
            onAction={() => console.log('Action Graphic Design:', item.id)}
            onEdit={() => handleOpenEditModal(item)}
            onView={() => console.log('View Graphic Design:', item.id)}
            onDelete={() => handleDeleteGraphic(item.id)}
            onAssign={() => handleOpenAssignModal(item)}
          />
        );
      case 'media':
        return (
          <MetaLeadCard
            item={item as MetaLead}
            onAction={() => console.log('Action Meta Lead:', item.id)}
            onEdit={() => handleOpenEditModal(item)}
            onView={() => console.log('View Meta Lead:', item.id)}
            onDelete={() => console.log('Delete Meta Lead:', item.id)}
            onAssign={() => handleOpenAssignModal(item)}
          />
        );
      case 'landing':
      default:
        return (
          <LandingPageCard
            item={item as LandingPageLead}
            isSelected={selectedIds.has(item.id)}
            onSelect={() => toggleSelect(item.id)}
            onEdit={(updatedItem: any) => {
              setDynamicLandingLeads(prev => prev.map(l => l.id === updatedItem.id ? updatedItem : l));
            }}
            onView={() => navigation.navigate('ViewLeadDetails', { leadData: item })}
            onDelete={(id) => {
              setDynamicLandingLeads(prev => prev.filter(l => l.id !== id));
            }}
            onAssign={() => handleOpenAssignModal(item)}
          />
        );
    }
  }

  // Landing Page header controls: filter by status + export – only shown on Landing tab
  const renderLandingHeaderControls = () => {
    if (activeCategory !== 'landing') return null;

    const currentPageData = getListData();
    const isAllSelected =
      currentPageData.length > 0 && currentPageData.every(item => selectedIds.has(item.id));

    return (
      <LeadHeaderControls
        allSelected={isAllSelected}
        onToggleSelectAll={toggleSelectAll}
        selectedCount={selectedIds.size}
        selectedStatus={selectedLandingStatus}
        onStatusChange={(status) => {
          setSelectedLandingStatus(status);
          setCurrentPage(1);
          if (status) {
            fetchLandingLeadsByStatus(status);
          } else {
            fetchLandingLeads(searchQuery);
          }
        }}
        onExport={exportLandingLeadsToExcel}
      />
    );
  };

  // Pagination footer
  const renderPagination = () => {
    if (totalPages === 0) return null;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    return (
      <View style={styles.paginationWrapper}>
        <TouchableOpacity
          style={[styles.pageArrow, currentPage === 1 && styles.pageArrowDisabled]}
          onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          activeOpacity={0.7}
        >
          <MaterialIcons name="chevron-left" size={20} color={currentPage === 1 ? '#CBD5E1' : COLORS.accent} />
        </TouchableOpacity>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pageNumbersScroll}>
          {pages.map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.pageNumber, currentPage === p && styles.pageNumberActive]}
              onPress={() => setCurrentPage(p)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pageNumberText, currentPage === p && styles.pageNumberTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={[styles.pageArrow, currentPage === totalPages && styles.pageArrowDisabled]}
          onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          activeOpacity={0.7}
        >
          <MaterialIcons name="chevron-right" size={20} color={currentPage === totalPages ? '#CBD5E1' : COLORS.accent} />
        </TouchableOpacity>
      </View>
    );
  };

  // Select-all toolbar shown only on Landing Page
  const renderSelectAllBar = () => {
    if (activeCategory !== 'landing') return null;
    return (
      <View style={styles.selectAllBar}>
        <TouchableOpacity style={styles.selectAllBtn} onPress={toggleSelectAll} activeOpacity={0.7}>
          <View style={[styles.selectAllBox, isAllSelected && styles.selectAllBoxActive]}>
            {isAllSelected && <MaterialIcons name="check" size={13} color="#FFF" />}
          </View>
          <Text style={styles.selectAllText}>{isAllSelected ? 'Deselect All' : 'Select All'}</Text>
        </TouchableOpacity>
        {selectedIds.size > 0 && (
          <TouchableOpacity style={styles.deleteSelectedBtn} onPress={handleDeleteSelected} activeOpacity={0.8}>
            <MaterialIcons name="delete-sweep" size={16} color="#FFFFFF" />
            <Text style={styles.deleteSelectedText}>Delete ({selectedIds.size})</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

      {renderHeader()}

      {renderLandingHeaderControls()}

      <FlatList
        data={getListData()}
        ListHeaderComponent={
          <View>
            {renderLeadsHeader()}
            {renderSelectAllBar()}
          </View>
        }
        ListEmptyComponent={
          <View style={{ width: '100%', paddingVertical: 60, alignItems: 'center', justifyContent: 'center' }}>
            {isCurrentlyLoading && !isRefreshing ? (
              <ActivityIndicator size="large" color={COLORS.accent} />
            ) : (
              !isRefreshing && <Text style={{ color: '#94A3B8', fontSize: 14 }}>No records found</Text>
            )}
          </View>
        }
        keyExtractor={(item) => item.id ?? item.companyName}
        renderItem={renderCard}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[COLORS.accent]}
            tintColor={COLORS.accent}
          />
        }
        contentContainerStyle={[styles.listContainer, { flexGrow: 1 }]}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Fixed Pagination - always visible at bottom above tab bar */}
      {totalPages > 1 && (
        <View style={[styles.fixedPaginationContainer, { paddingBottom: tabBarHeight + 24, paddingTop: 16 }]}>
          {renderPagination()}
        </View>
      )}

      {showNativeDatePicker && (
        <DateTimePicker
          value={activeDateType === 'startDate' ? (startDate || new Date()) : (endDate || new Date())}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      {activeCategory === 'contact' && (
        <TouchableOpacity
          style={[styles.fab, { bottom: tabBarHeight + 55 }]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('AddLeadsForm')}
        >
          <MaterialIcons name="add" size={30} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      <Modal visible={isAssignModalVisible} transparent animationType="fade" onRequestClose={() => setIsAssignModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setIsAssignModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.assignModalCard}>
                <Text style={styles.assignModalTitle}>Assign Staff</Text>
                <View style={{ zIndex: 1000, elevation: 1 }}>
                  <DropDownPicker
                    open={staffDropdownOpen}
                    value={selectedStaffToAssign}
                    items={staffOptions}
                    setOpen={setStaffDropdownOpen}
                    setValue={setSelectedStaffToAssign}
                    setItems={setStaffOptions}
                    placeholder="Select staff"
                    style={styles.assignDropdown}
                    dropDownContainerStyle={styles.dropdownContainerStyle}
                    textStyle={{ fontSize: 14, color: '#0F172A' }}
                    placeholderStyle={{ color: '#94A3B8' }}
                    listMode="SCROLLVIEW"
                  />
                </View>
                <View style={styles.assignModalActions}>
                  <TouchableOpacity style={styles.assignCancelBtn} onPress={() => setIsAssignModalVisible(false)} activeOpacity={0.7}>
                    <Text style={styles.assignCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.assignSubmitBtn} onPress={handleAssignSubmit} activeOpacity={0.8}>
                    <Text style={styles.assignSubmitText}>Assign</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerContainer: {
    backgroundColor: COLORS.accent,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerTitleWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    // marginTop: 14,
    marginHorizontal: 12,
    paddingHorizontal: 16,
    height: 46,
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  searchInput: {
    flex: 1,
    color: "#111827",
    fontSize: 15,
    fontWeight: "500",
    marginLeft: 10,
    padding: 0,
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    elevation: 10,
  },
  listContainer: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  fixedPaginationContainer: {
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  selectAllBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 12,
    marginTop: 8,
  },
  selectAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectAllBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  selectAllBoxActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent,
  },
  selectAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  deleteSelectedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteSelectedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  headerFormWrapper: {
    width: "100%",
  },
  categoryTabWrapper: {
    paddingTop: 4,
  },
  categoryTabScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryTabPill: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  categoryTabPillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  categoryTabTextActive: {
    color: COLORS.accent,
    fontWeight: 'bold',
  },
  filterScrollWrapper: {
    marginVertical: 10,
    backgroundColor: "transparent",
  },
  filterHorizontalScroll: {
    paddingHorizontal: 6,
    gap: 10,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#EEF2FF",
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 35,
    gap: 6,
  },
  pillText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
  activePill: {
    borderColor: COLORS.accent,
    backgroundColor: "rgba(37, 99, 235, 0.04)",
  },
  activePillText: {
    color: COLORS.accent,
    fontWeight: "700",
  },
  // Pagination
  paginationWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 4,
  },
  pageArrow: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageArrowDisabled: {
    borderColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  pageNumbersScroll: {
    gap: 6,
    paddingHorizontal: 4,
  },
  pageNumber: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageNumberActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  pageNumberText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  pageNumberTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Assign staff modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  assignModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
  },
  assignModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
  },
  assignDropdown: {
    height: 44,
    borderWidth: 1.5,
    borderColor: '#EEF2FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
  },
  dropdownContainerStyle: {
    borderWidth: 1.5,
    borderColor: '#EEF2FF',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    elevation: 3,
  },
  assignModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
  },
  assignCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  assignCancelText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 13,
  },
  assignSubmitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.accent,
  },
  assignSubmitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  exportActionContainer: {
    paddingHorizontal: 16,
    alignItems: "flex-start",
    marginVertical: 2,
    marginBottom: 8,
    marginTop: 12
  },
  exportGroup: {
    flexDirection: "row",
    backgroundColor: "#64748B",
    borderRadius: 6,
    padding: 3,
    gap: 2,
  },
  exportButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  exportText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});
