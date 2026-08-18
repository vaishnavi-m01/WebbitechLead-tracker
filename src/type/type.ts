export type RootStackParamList = {
    Splash : undefined;
    Login : undefined;
    MainTabs: undefined;
    Register : undefined;
    Home : undefined;
    Profile : undefined;
    AddLeadsForm: { leadData?: any } | undefined;
    EditEnquiryForm: { leadData: any };
    ViewContactLeadDetails: { leadData: any };
    Notifications: undefined;
}