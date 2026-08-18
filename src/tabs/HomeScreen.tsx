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
import api, { getStoredUser } from '../config/apiConfig';
import { exportCopy, exportExcel, exportCSV, exportPrint, exportPDF } from '../utils/exportUtils';

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
];

const PAGE_SIZE = 10;

// ---- Maps a raw API contact record into the shape ContactEnquiryCard expects ----
const mapApiContact = (item: any, statusMap: Record<string, string> = {}, colorMap: Record<string, string> = {}): ContactEnquiryLead => {
  const statusId = item.latest_followup?.status || item.status;
  const strId = statusId?.toString();
  const lowerId = strId?.toLowerCase().trim();

  return {
    id: item.id?.toString() || Math.random().toString(),
    assignedName: item.assigned_user?.name || 'Unassigned',
    source: item.sources || 'Unknown',
    dateTime: item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A',
    name: item.name || 'Unknown',
    email: item.email || 'N/A',
    phone: item.phone || 'N/A',
    location: item.city || 'N/A',
    message: item.message || 'No message',
    status: (strId ? (statusMap[strId] || statusMap[lowerId]) : null) || item.latest_followup?.status_relation?.name || statusId || 'N/A',
    statusColor: (strId ? (colorMap[strId] || colorMap[lowerId]) : null) || item.latest_followup?.status_relation?.color || item.color || null,
    sendWhatsapp: item.send_whatsapp === true || item.send_whatsapp === '1' || item.send_whatsapp === 1,
    leadgen_id: item.leadgen_id,
    company_name: item.company_name,
    industry: item.industry,
    business_goal: item.business_goal,
    meta_ads: item.meta_ads,
  };
};

// ---- Landing Page API mapper ----
const mapApiLanding = (item: any, statusMap: Record<string, string> = {}, colorMap: Record<string, string> = {}): LandingPageLead => {
  const statusId = item.status?.toString();
  const lowerStatusId = statusId?.toLowerCase().trim();

  return {
    id: item.id?.toString() || Math.random().toString(),
    dateTime: item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A',
    name: item.name || 'Unknown',
    email: item.email || 'N/A',
    phone: item.country_code ? `${item.country_code} ${item.phone}` : (item.phone || 'N/A'),
    message: item.msg || item.description || 'No message',
    websiteType: item.website_type || 'N/A',
    verified: item.verified === '1' || item.verified === 1,
    status: (statusId ? (statusMap[statusId] || statusMap[lowerStatusId]) : null) || item.status_relation?.name || item.latest_followup?.status_relation?.name || statusId || '',
    statusColor: (statusId ? (colorMap[statusId] || colorMap[lowerStatusId]) : null) || item.status_relation?.color || item.latest_followup?.status_relation?.color || item.color || null,
  };
};

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

  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  useEffect(() => {
    const loadPerms = async () => {
      const user = await getStoredUser<any>();
      if (user) {
        if (user.user_type === 'super_admin') {
          setUserPermissions(['all']);
        } else if (user.website_permissions) {
          setUserPermissions(user.website_permissions);
          
          const webPerms = user.website_permissions || [];
          const hasPermission = (key: string) => {
            switch(key) {
              case 'landing': return webPerms.includes('landing_page_enquiries');
              case 'contact': return webPerms.includes('contact_page_enquiries');
              case 'dm': return webPerms.includes('dm_enquiries');
              case 'graphic': return webPerms.includes('graphic_design_enquiries');
              default: return true;
            }
          };

          if (!hasPermission('landing') && activeCategory === 'landing') {
            const availableCategories: CategoryKey[] = ['landing', 'contact', 'dm', 'graphic'];
            const firstPermitted = availableCategories.find(c => hasPermission(c));
            if (firstPermitted) {
              setActiveCategory(firstPermitted);
            }
          }
        }
      }
    };
    loadPerms();
  }, []);

  const [activeCategory, setActiveCategory] = useState<CategoryKey>('landing');
  const [contactSource, setContactSource] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchTimeoutRef = useRef<any>(null);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  
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

  // ---- Notifications State ----
  const [notificationCount, setNotificationCount] = useState(0);
  console.log("notification",notificationCount)

  // ---- Contact Counts State ----
  const [contactCounts, setContactCounts] = useState({
    total: 0,
    fb_status: 0,
    website_status: 0,
    enq_status: 0,
    whatsapp_status: 0,
  });

    // Bulk select for Landing Page
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Status filter for Landing Page
  const [selectedLandingStatus, setSelectedLandingStatus] = useState<string | null>(null);

  const [activeDateType, setActiveDateType] = useState<"startDate" | "endDate" | null>(null);
  const [showNativeDatePicker, setShowNativeDatePicker] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // New Date Dropdown State
  const [dateRangeType, setDateRangeType] = useState('all');
  const [headerPeriodDropdownOpen, setHeaderPeriodDropdownOpen] = useState(false);

  // Assign Staff Modal State
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [assignTargetId, setAssignTargetId] = useState<string | null>(null);
  const [selectedStaffToAssign, setSelectedStaffToAssign] = useState<string | null>(null);
  const [staffDropdownOpen, setStaffDropdownOpen] = useState(false);

  const [staffOptions, setStaffOptions] = useState<
    { label: string; value: string }[]
  >([]);

  const [statusesLoaded, setStatusesLoaded] = useState(false);

  const statusMapRef = useRef<Record<string, string>>({});
  const statusColorMapRef = useRef<Record<string, string>>({});



  useEffect(() => {
    const requestedCategory = route.params?.category as CategoryKey | undefined;
    if (requestedCategory && requestedCategory !== activeCategory) {
      setActiveCategory(requestedCategory);
      setCurrentPage(1);
      setSelectedIds(new Set());
    }
  }, [route.params?.category, activeCategory]);


  useEffect(() => {
    fetchStaff();
    fetchStatuses();
  }, []);

  const getDateRangeParams = () => {
    if (dateRangeType === 'all') return {};
    
    const end = new Date();
    let start = new Date();
    
    if (dateRangeType === 'today') {
      // start is already today
    } else if (dateRangeType === 'week') {
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
    } else if (dateRangeType === 'month') {
      start.setDate(1);
    } else if (dateRangeType === 'year') {
      start.setMonth(0, 1);
    }
    
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const params = {
      start_date: formatDate(start),
      end_date: formatDate(end),
    };
    console.log(`[getDateRangeParams] dateRangeType: ${dateRangeType} =>`, params);
    return params;
  };

  const getFullLogUrl = (urlPath: string, queryParams: any) => {
    const queryStr = Object.keys(queryParams || {})
      .filter(key => queryParams[key] !== undefined && queryParams[key] !== null)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
      .join('&');
    return `${api.defaults.baseURL}${urlPath}${queryStr ? (urlPath.includes('?') ? '&' : '?') + queryStr : ''}`;
  };

   useFocusEffect(
    useCallback(() => {
      fetchNotificationCount();
      if (!statusesLoaded) return;

      if (activeCategory === 'contact') {
        fetchContacts(contactSource, searchQuery);
        fetchContactCounts();
      }
      else if (activeCategory === 'landing') fetchLandingLeads(searchQuery);
      else if (activeCategory === 'dm') fetchDMLeads(searchQuery);
      else if (activeCategory === 'graphic') fetchGraphicLeads(searchQuery);
    }, [activeCategory, contactSource, statusesLoaded, dateRangeType])
  );

   //fetchContactCouts
  const fetchContactCounts = async () => {
    try {
      const params = getDateRangeParams();
      const response = await api.get('/contacts/count', { params });
      if (response.data?.status && response.data?.data) {
        setContactCounts(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch contact counts:', error);
    }
  };
 

  //fetchNotificaitonCount
  const fetchNotificationCount = async () => {
    try {
      const response = await api.get('/firebase/notifications/fb-status-count');
      if (response.data?.status && typeof response.data?.count === 'number') {
        setNotificationCount(response.data.count);
      }
    } catch (error) {
      console.error('Failed to fetch notification count:', error);
    }
  };


  //fecthStatuses
  const fetchStatuses = async () => {
    try {
      const response = await api.get('/status');
      if (response.data?.status && Array.isArray(response.data.data)) {
        const map: Record<string, string> = {};
        const colorMap: Record<string, string> = {};
        response.data.data.forEach((item: any) => {
          const id = item.id.toString();
          const color = item.color || item.color_code || item.bg_color || item.status_color;
          map[id] = item.name;
          colorMap[id] = color;
          if (item.name) {
            const lowerName = item.name.toLowerCase().trim();
            map[lowerName] = item.name;
            colorMap[lowerName] = color;
          }
        });
        statusMapRef.current = map;
        statusColorMapRef.current = colorMap;
        setStatusesLoaded(true);
      }
    } catch (error) {
      console.error('Failed to fetch statuses:', error);
      setStatusesLoaded(true); 
    }
  };

   
  const fetchContacts = async (source: string, query: string = searchQuery) => {
    const requestId = ++contactsRequestRef.current;

    setIsLoadingContacts(true);
    setDynamicContactLeads([]);
    try {

      let url = '/contacts/';
      const params = getDateRangeParams() as any;
      if (query) {
        url = `/contact/search?name=${encodeURIComponent(query)}`;
      } else if (source !== 'All') {
  
        const SOURCE_MAP: Record<string, string> = {
          Enquiry: 'ENQ',
          Contact: 'Website',
          Whatsapp: 'Whatsapp',
          Facebook: 'Facebook',
          DM: 'DM',
          'Graphic Design': 'GD',
        };
        const apiSource = SOURCE_MAP[source] || source;
        url = `/contacts/source/${encodeURIComponent(apiSource)}`;
      }

      console.log('Search API Called for Contacts:', getFullLogUrl(url, params));
      const response = await api.get(url, { params });


      if (requestId !== contactsRequestRef.current) return;

      // Different endpoints shape the payload slightly differently:

      const rawList = Array.isArray(response.data?.data)
        ? response.data.data
        : response.data?.data?.contacts;

      if (response.data && (response.data.status || response.data.success) && Array.isArray(rawList)) {
        setDynamicContactLeads(rawList.map(item => mapApiContact(item, statusMapRef.current, statusColorMapRef.current)));
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
      const params = getDateRangeParams() as any;
      if (query) {
        url = `/landing/search?name=${encodeURIComponent(query)}`;
      }
      console.log('Search API Called for Landing Pages:', getFullLogUrl(url, params));
      const response = await api.get(url, { params });

      if (requestId !== landingRequestRef.current) return;

      const rawList = Array.isArray(response.data?.data)
        ? response.data.data
        : (response.data?.data?.landing_pages || response.data?.data?.landing_page || response.data?.data?.data || []);

      if ((response.data?.success || response.data?.status) && Array.isArray(rawList)) {
        setDynamicLandingLeads(rawList.map(item => mapApiLanding(item, statusMapRef.current, statusColorMapRef.current)));
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
      const params = { ...getDateRangeParams(), status };
      console.log('Filter by Status API Called:', getFullLogUrl('/landing-pages/status', params));
      const payload = {
        status: status
      }
      const response = await api.get('/landing-pages/status', {
        params,
      });

      if (requestId !== landingRequestRef.current) return;

      const rawList = Array.isArray(response.data?.data)
        ? response.data.data
        : (response.data?.data?.landing_pages || response.data?.data?.landing_page || response.data?.data?.data || []);

      if ((response.data?.success || response.data?.status) && Array.isArray(rawList)) {
        setDynamicLandingLeads(rawList.map(item => mapApiLanding(item, statusMapRef.current, statusColorMapRef.current)));
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
    setDynamicDMLeads([]); 
    try {
      let url = '/dm-enquiries';
      const params = getDateRangeParams() as any;
      if (query) {
        url = `/dm/search?name=${encodeURIComponent(query)}`;
      }
      console.log('Search API Called for DM:', getFullLogUrl(url, params));
      const response = await api.get(url, { params });

      if (requestId !== dmRequestRef.current) return;

      const rawList = Array.isArray(response.data?.data)
        ? response.data.data
        : (response.data?.data?.dm_enquiries || response.data?.data?.dm || response.data?.data?.data || []);

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
    setDynamicGraphicLeads([]);
    try {
      let url = '/graphic-design-enquiries';
      const params = getDateRangeParams() as any;
      if (query) {
        url = `/graphic-design/search?name=${encodeURIComponent(query)}`;
      }
      console.log('Search API Called for Graphic Design:', getFullLogUrl(url, params));
      const response = await api.get(url, { params });

      if (requestId !== graphicRequestRef.current) return;

      const rawList = Array.isArray(response.data?.data)
        ? response.data.data
        : (response.data?.data?.graphic_design_enquiries || response.data?.data?.graphic_design || response.data?.data?.data || []);

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
      if (activeCategory === 'contact') {
        await fetchContacts(contactSource, searchQuery);
        await fetchContactCounts();
      }
      else if (activeCategory === 'landing') await fetchLandingLeads(searchQuery);
      else if (activeCategory === 'dm') await fetchDMLeads(searchQuery);
      else if (activeCategory === 'graphic') await fetchGraphicLeads(searchQuery);
    } finally {
      setIsRefreshing(false);
    }
  };



  // Edit Enquiry Navigation
  const handleOpenEditModal = (item: any) => {
    navigation.navigate('EditEnquiryForm', { leadData: item });
  };

  const handleOpenAssignModal = (item: any) => {
    setAssignTargetId(item.id);
    setSelectedStaffToAssign(null);
    setIsAssignModalVisible(true);
  };

  //handleAssignSubmit
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

  const getFilteredExportConfig = () => {
    const cfg = getExportConfig();
    if (!cfg) return null;

    let filteredData: any[] = cfg.data;
    if (activeCategory === 'contact' && contactSource !== 'All') {
      const SOURCE_MAP: Record<string, string> = { Enquiry: 'ENQ', Contact: 'Website', Whatsapp: 'Whatsapp', Facebook: 'Facebook', DM: 'DM', 'Graphic Design': 'GD' };
      const apiSource = SOURCE_MAP[contactSource] || contactSource;
      filteredData = (cfg.data as typeof dynamicContactLeads).filter(l => l.source === apiSource || l.source === contactSource);
    }

    return { ...cfg, data: filteredData };
  };

  // ---- COPY ----
  const handleExportCopy = () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const cfg = getFilteredExportConfig();
      if (!cfg) return;
      exportCopy(cfg);
    } catch (e) {
      console.error('Copy error:', e);
      ToastAndroid.show('Failed to copy', ToastAndroid.SHORT);
    } finally {
      setIsExporting(false);
    }
  };

  // ---- EXCEL ----
  const handleExportExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const cfg = getFilteredExportConfig();
      if (!cfg) return;
      await exportExcel(cfg);
    } catch (e) {
      console.error('Excel error:', e);
      ToastAndroid.show('Failed to export Excel', ToastAndroid.SHORT);
    } finally {
      setIsExporting(false);
    }
  };

  // ---- CSV ----
  const handleExportCSV = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const cfg = getFilteredExportConfig();
      if (!cfg) return;
      await exportCSV(cfg);
    } catch (e) {
      console.error('CSV error:', e);
      ToastAndroid.show('Failed to export CSV', ToastAndroid.SHORT);
    } finally {
      setIsExporting(false);
    }
  };

  // Keep old name as an alias for the Landing Page export button (LeadHeaderControls)
  const exportLandingLeadsToExcel = handleExportExcel;

  // ---- PRINT ----
  const handlePrint = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const cfg = getFilteredExportConfig();
      if (!cfg) return;
      await exportPrint(cfg, activeCategory);
    } catch (e) {
      console.error('Print error:', e);
      ToastAndroid.show('Failed to open print dialog', ToastAndroid.SHORT);
    } finally {
      setIsExporting(false);
    }
  };

  // ---- PDF ----
  const handleExportPDF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const cfg = getFilteredExportConfig();
      if (!cfg) return;
      await exportPDF(cfg, activeCategory);
    } catch (e) {
      console.error('PDF error:', e);
      ToastAndroid.show('Failed to export PDF', ToastAndroid.SHORT);
    } finally {
      setIsExporting(false);
    }
  };

  const renderHeader = () => {
    // Same labels used in the drawer (Landing, Contact, Insta DM, Graphic, Media)
    const currentLabel = CATEGORY_TABS.find(t => t.key === activeCategory)?.label || 'Leads';

    return (
      <View style={[styles.headerContainer, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : insets.top }]}>
        <View style={styles.headerTop}>
          {isSearchExpanded ? (
            <View style={[styles.searchContainer, { flex: 1, marginHorizontal: 0, height: 40 }]}>
              <TouchableOpacity onPress={() => {
                setIsSearchExpanded(false);
                setSearchQuery('');
                if (activeCategory === 'contact') fetchContacts(contactSource, '');
                else if (activeCategory === 'landing') fetchLandingLeads('');
                else if (activeCategory === 'dm') fetchDMLeads('');
                else if (activeCategory === 'graphic') fetchGraphicLeads('');
              }}>
                <MaterialIcons name="arrow-back" size={20} color="#9CA3AF" />
              </TouchableOpacity>
              <TextInput
                placeholder="Search anything..."
                placeholderTextColor="#9CA3AF"
                style={styles.searchInput}
                returnKeyType="search"
                value={searchQuery}
                autoFocus
                onChangeText={(text) => {
                  setSearchQuery(text);
                  if (searchTimeoutRef.current) {
                    clearTimeout(searchTimeoutRef.current);
                  }
                  searchTimeoutRef.current = setTimeout(() => {
                    if (activeCategory === 'contact') fetchContacts(contactSource, text);
                    else if (activeCategory === 'landing') fetchLandingLeads(text);
                    else if (activeCategory === 'dm') fetchDMLeads(text);
                    else if (activeCategory === 'graphic') fetchGraphicLeads(text);
                  }, 500);
                }}
                onSubmitEditing={() => {
                  if (activeCategory === 'contact') fetchContacts(contactSource, searchQuery);
                  else if (activeCategory === 'landing') fetchLandingLeads(searchQuery);
                  else if (activeCategory === 'dm') fetchDMLeads(searchQuery);
                  else if (activeCategory === 'graphic') fetchGraphicLeads(searchQuery);
                }}
              />
              {searchQuery !== '' && (
                <TouchableOpacity onPress={() => {
                  setSearchQuery('');
                  if (activeCategory === 'contact') fetchContacts(contactSource, '');
                  else if (activeCategory === 'landing') fetchLandingLeads('');
                  else if (activeCategory === 'dm') fetchDMLeads('');
                  else if (activeCategory === 'graphic') fetchGraphicLeads('');
                }}>
                  <MaterialIcons name="close" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <TouchableOpacity style={styles.menuBtn} onPress={handleOpenDrawer} activeOpacity={0.7}>
                  <MaterialIcons name="menu" size={28} color="#FFFFFF" />
                </TouchableOpacity>

                <View pointerEvents="none">
                  <Text style={styles.headerTitle} numberOfLines={1}>{currentLabel}</Text>
                </View>
              </View>
              <View style={[styles.headerRightRow, { zIndex: 10 }]}>
                {/* Period Filter Chip */}
                <View style={{ position: 'relative', zIndex: 5000 }}>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      paddingHorizontal: 12,
                      paddingVertical: 5,
                      borderRadius: 18,
                    }}
                    onPress={() => setHeaderPeriodDropdownOpen(!headerPeriodDropdownOpen)}
                  >
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '500', marginRight: 4 }}>
                      {[{ label: 'All Time', value: 'all' }, { label: 'Today', value: 'today' }, { label: 'Week', value: 'week' }, { label: 'Month', value: 'month' }, { label: 'Year', value: 'year' }].find(o => o.value === dateRangeType)?.label || 'Today'}
                    </Text>
                    <MaterialIcons name="keyboard-arrow-down" size={16} color="#fff" />
                  </TouchableOpacity>

                  {headerPeriodDropdownOpen && (
                    <>
                      <TouchableOpacity
                        style={{ position: 'absolute', top: -1000, left: -2000, width: 5000, height: 5000, zIndex: 1000 }}
                        activeOpacity={1}
                        onPress={() => setHeaderPeriodDropdownOpen(false)}
                      />
                      <View style={{
                        position: 'absolute',
                        top: 28,
                        right: 0,
                        backgroundColor: '#FFF',
                        borderRadius: 8,
                        padding: 4,
                        minWidth: 100,
                        elevation: 10,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.15,
                        shadowRadius: 10,
                        zIndex: 2000,
                      }}>
                        {[{ label: 'All Time', value: 'all' }, { label: 'Today', value: 'today' }, { label: 'Week', value: 'week' }, { label: 'Month', value: 'month' }, { label: 'Year', value: 'year' }].map((opt) => (
                          <TouchableOpacity
                            key={opt.value}
                            style={{
                              paddingVertical: 8,
                              paddingHorizontal: 12,
                              backgroundColor: dateRangeType === opt.value ? '#F1F5F9' : 'transparent',
                              borderRadius: 6,
                            }}
                            onPress={() => {
                              setDateRangeType(opt.value);
                              setHeaderPeriodDropdownOpen(false);
                            }}
                          >
                            <Text style={{ color: dateRangeType === opt.value ? COLORS.accent : '#334155', fontSize: 12, fontWeight: dateRangeType === opt.value ? '700' : '500' }}>
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  )}
                </View>

                <View style={{ position: 'relative' }}>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => (navigation as any).navigate("Notifications")} activeOpacity={0.7}>
                    <MaterialIcons name="notifications-none" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  {notificationCount > 0 && (
                    <View style={{
                      position: 'absolute',
                      top: 0,
                      right: 2,
                      backgroundColor: '#EF4444',
                      borderRadius: 10,
                      minWidth: 18,
                      height: 18,
                      justifyContent: 'center',
                      alignItems: 'center',
                      paddingHorizontal: 4,
                      borderWidth: 1,
                      borderColor: '#FFFFFF'
                    }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>
                        {notificationCount > 99 ? '99+' : notificationCount}
                      </Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity style={styles.iconBtn} onPress={() => setIsSearchExpanded(true)} activeOpacity={0.7}>
                  <MaterialIcons name="search" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    );
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

  const fullCategoryData = activeCategory === 'landing'
    ? dynamicLandingLeads
    : activeCategory === 'contact'
      ? dynamicContactLeads
      : activeCategory === 'dm'
        ? dynamicDMLeads
        : activeCategory === 'graphic'
          ? dynamicGraphicLeads
          : [];

  const totalPages = totalItems > 0 ? Math.ceil(totalItems / PAGE_SIZE) : 0;

  const renderContactPageBar = () => {
    const getCountForOption = (option: string) => {
      switch (option) {
        case 'All': return contactCounts.total;
        case 'Enquiry': return contactCounts.enq_status;
        case 'Contact': return contactCounts.website_status;
        case 'Whatsapp': return contactCounts.whatsapp_status;
        case 'Facebook': return contactCounts.fb_status;
        default: return 0;
      }
    };

    return (
      <View style={styles.filterScrollWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterHorizontalScroll}>
          {CONTACT_SOURCE_OPTIONS.map((option) => {
            const focused = contactSource === option;
            const count = getCountForOption(option);
            return (
              <TouchableOpacity key={option} style={[styles.filterPill, focused && styles.activePill]} activeOpacity={0.7} onPress={() => setContactSource(option)}>
                <Text style={[styles.pillText, focused && styles.activePillText]}>
                  {option}
                </Text>
                <View style={[styles.pillBadge, focused && styles.activePillBadge]}>
                  <Text style={[styles.pillBadgeText, focused && styles.activePillBadgeText]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {fullCategoryData.length > 0 && renderExportBar()}
      </View>
    );
  };

  // ---- Shared export toolbar — shown for ALL categories ----
  const renderExportBar = () => (
    <View style={[styles.exportActionContainer, { justifyContent: 'space-between' }]}>
      <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
      </View>
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
      default: return fullCategoryData.length > 0 ? <View style={styles.filterScrollWrapper}>{renderExportBar()}</View> : null;
    }
  };

  const renderLeadsHeader = () => (
    <View style={styles.headerFormWrapper}>
      {renderCategoryFilterBar()}
    </View>
  );

  // ---- Render the correct list data per tab (paginated for infinite scroll) ----
  const getListData = (): any[] => {
    let allData: any[] = [];
    switch (activeCategory) {
      case 'landing': allData = dynamicLandingLeads; break;
      case 'contact': allData = dynamicContactLeads; break;
      case 'dm': allData = dynamicDMLeads; break;
      case 'graphic': allData = dynamicGraphicLeads; break;
      default: allData = [];
    }
    const end = currentPage * PAGE_SIZE;
    return allData.slice(0, end);
  };

  // ---- Render the correct list data per tab (paginated for infinite scroll) ----

  const isAllSelected = fullCategoryData.length > 0 && fullCategoryData.every((item) => selectedIds.has(item.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        fullCategoryData.forEach((item) => next.delete(item.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        fullCategoryData.forEach((item) => next.add(item.id));
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
            permissions={userPermissions}
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
            permissions={userPermissions}
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
            permissions={userPermissions}
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
            permissions={userPermissions}
          />
        );
      case 'landing':
      default:
        return (
          <LandingPageCard
            item={item as LandingPageLead}
            isSelected={selectedIds.has(item.id)}
            onSelect={() => toggleSelect(item.id)}
            onDelete={(id) => {
              setDynamicLandingLeads(prev => prev.filter(l => l.id !== id));
            }}
            permissions={userPermissions}
          />
        );
    }
  }

  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // Global header controls: filter by period (all tabs), status + export (Landing only)
  const renderHeaderControls = () => {
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
        dateRangeType={dateRangeType}
        onDateRangeChange={setDateRangeType}
        showStatusAndExport={activeCategory === 'landing'}
        onDropdownToggle={setIsStatusDropdownOpen}
      />
    );
  };

  const renderSelectAllBar = () => {
    if (activeCategory === 'contact' || activeCategory === 'dm' || activeCategory === 'graphic') return null;
    const currentPageData = getListData();
    const isAllSelected = currentPageData.length > 0 && currentPageData.every(item => selectedIds.has(item.id));
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

      <View style={{ zIndex: 200, elevation: 200 }}>
        {renderHeader()}
      </View>
      <View style={{ zIndex: 100, elevation: 100 }}>
        {renderHeaderControls()}
      </View>

      <FlatList
        data={getListData()}
        scrollEnabled={!isStatusDropdownOpen}
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
        contentContainerStyle={[styles.listContainer, { flexGrow: 1, paddingBottom: tabBarHeight + 20 }]}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (currentPage < totalPages && !isFetchingMore) {
            setIsFetchingMore(true);
            setTimeout(() => {
              setCurrentPage(prev => prev + 1);
              setIsFetchingMore(false);
            }, 300);
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingMore ? (
            <View style={{ paddingVertical: 12, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={COLORS.accent} />
            </View>
          ) : null
        }
      />

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
    backgroundColor: '#F3F4F6',
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
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerDateRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  modernDropdown: {
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  modernPlaceholderStyle: {
    fontSize: 13,
    color: '#64748B',
  },
  modernSelectedTextStyle: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  modernIconStyle: {
    width: 20,
    height: 20,
    tintColor: '#94A3B8',
  },
  dropdownContainer: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 8,
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 40,
    elevation: 4,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    marginTop: 4,
    marginBottom: 12,
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
    // marginBottom: 10,
    marginTop: 10,
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
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  pillText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "600",
  },
  activePill: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  activePillText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  pillBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activePillBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  pillBadgeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '800',
  },
  activePillBadgeText: {
    color: '#FFFFFF',
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
    alignItems: "stretch",
    marginVertical: 2,
    marginBottom: 4,
    // marginTop: 12
  },
  exportGroup: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    padding: 4,
    justifyContent: 'space-between',
  },
  exportButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  exportText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "700",
  },
});
