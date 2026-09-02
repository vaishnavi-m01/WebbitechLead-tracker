

import api from '../config/apiConfig';

export interface TrackerCategory {
  id: number;
  name: string;
  status: string | null;           
  created_at?: string;
  updated_at?: string;
}

export interface TrackerAmount {
  id: number;
  name: string;
  category_id: number | null;      
  category_name?: string | null;
  amount: number | string;
  income_date?: string | null;     
  expensive_date?: string | null;  
  description?: string | null;
  status: string | null;           
  project_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryPayload {
  name: string;
  status: 'active' | 'inactive';
}

export interface IncomeAmountPayload {
  name: string;
  category_id: number;
  amount: number;
  income_date: string;       
  description?: string;
  status: 'active' | 'inactive';
}

export interface ExpenseAmountPayload {
  name: string;
  category_id: number;
  amount: number;
  expensive_date: string;    
  description?: string;
  status: 'active' | 'inactive';
}

export interface MyBill {
  id: number;
  name: string;
  amount: number | string;
  bill_date?: string | null;
  description?: string | null;
  status: string | null;
}

export interface MyBillPayload {
  name: string;
  amount: number;
  bill_date: string;
  description?: string;
  status: 'active' | 'inactive';
}

export const getMyBills = () => api.get<MyBill[]>('/tracker/my-bills');
export const createMyBill = (data: MyBillPayload) => api.post<MyBill>('/tracker/my-bills/store', data);
export const getMyBillForEdit = (id: number | string) => api.get<MyBill>(`/tracker/my-bills/${id}/edit`);
export const updateMyBill = (id: number | string, data: Partial<MyBillPayload>) => api.put<MyBill>(`/tracker/my-bills/${id}`, data);
export const deleteMyBill = (id: number | string) => api.delete(`/tracker/my-bills/${id}`);


/**  /tracker/income-categories – all income categories */
export const getIncomeCategories = () => {
  console.log('[API] GET /tracker/income-categories');
  return api.get<TrackerCategory[]>('/tracker/income-categories');
};

/** GET  /tracker/income-categories/:id – one income category */
export const getIncomeCategory = (id: number | string) => {
  console.log(`[API] GET /tracker/income-categories/${id}`);
  return api.get<TrackerCategory>(`/tracker/income-categories/${id}`);
};

/** POST /tracker/income-categories/create – create income category */
export const createIncomeCategory = (data: CategoryPayload) => {
  console.log('[API] POST /tracker/income-categories/create', data);
  return api.post<TrackerCategory>('/tracker/income-categories/create', data);
};

/** PUT  /tracker/income-categories/:id – update income category */
export const updateIncomeCategory = (id: number | string, data: CategoryPayload) => {
  console.log(`[API] PUT /tracker/income-categories/${id}`, data);
  return api.put<TrackerCategory>(`/tracker/income-categories/${id}`, data);
};

/**  DELETE /tracker/income-categories/:id – delete income category */
export const deleteIncomeCategory = (id: number | string) => {
  console.log(`[API] DELETE /tracker/income-categories/${id}`);
  return api.delete(`/tracker/income-categories/${id}`);
};



/** 1. GET  /tracker/income-amount – all income amounts */
export const getIncomeAmounts = () => {
  console.log('[API] GET /tracker/income-amount');
  return api.get<TrackerAmount[]>('/tracker/income-amount');
};

/** 2. GET  /tracker/income-amount/:id – one income amount */
export const getIncomeAmount = (id: number | string) => {
  console.log(`[API] GET /tracker/income-amount/${id}`);
  return api.get<TrackerAmount>(`/tracker/income-amount/${id}`);
};

/** POST /tracker/income-amount/create – create income amount */
export const createIncomeAmount = (data: IncomeAmountPayload) => {
  console.log('[API] POST /tracker/income-amount/create', data);
  return api.post<TrackerAmount>('/tracker/income-amount/create', data);
};

/** PUT  /tracker/income-amount/:id – update income amount */
export const updateIncomeAmount = (id: number | string, data: Partial<IncomeAmountPayload>) => {
  console.log(`[API] PUT /tracker/income-amount/${id}`, data);
  return api.put<TrackerAmount>(`/tracker/income-amount/${id}`, data);
};

/**  DELETE /tracker/income-amount/:id – delete income amount */
export const deleteIncomeAmount = (id: number | string) => {
  console.log(`[API] DELETE /tracker/income-amount/${id}`);
  return api.delete(`/tracker/income-amount/${id}`);
};



/** GET  /tracker/expenses-categories – all expense categories */
export const getExpenseCategories = () => {
  console.log('[API] GET /tracker/expenses-categories');
  return api.get<TrackerCategory[]>('/tracker/expenses-categories');
};

/** GET  /tracker/expenses-categories/:id – one expense category */
export const getExpenseCategory = (id: number | string) => {
  console.log(`[API] GET /tracker/expenses-categories/${id}`);
  return api.get<TrackerCategory>(`/tracker/expenses-categories/${id}`);
};

/**  POST /tracker/expenses-categories/create – create expense category */
export const createExpenseCategory = (data: CategoryPayload) => {
  console.log('[API] POST /tracker/expenses-categories/create', data);
  return api.post<TrackerCategory>('/tracker/expenses-categories/create', data);
};

/** PUT  /tracker/expenses-categories/:id – update expense category */
export const updateExpenseCategory = (id: number | string, data: CategoryPayload) => {
  console.log(`[API] PUT /tracker/expenses-categories/${id}`, data);
  return api.put<TrackerCategory>(`/tracker/expenses-categories/${id}`, data);
};

/** DELETE /tracker/expenses-categories/:id – delete expense category */
export const deleteExpenseCategory = (id: number | string) => {
  console.log(`[API] DELETE /tracker/expenses-categories/${id}`);
  return api.delete(`/tracker/expenses-categories/${id}`);
};


/**  GET  /tracker/expenses-amount – all expense amounts */
export const getExpenseAmounts = () => {
  console.log('[API] GET /tracker/expenses-amount');
  return api.get<TrackerAmount[]>('/tracker/expenses-amount');
};

/**  GET  /tracker/expenses-amount/:id – one expense amount */
export const getExpenseAmount = (id: number | string) => {
  console.log(`[API] GET /tracker/expenses-amount/${id}`);
  return api.get<TrackerAmount>(`/tracker/expenses-amount/${id}`);
};

/** POST /tracker/expenses-amount/create – create expense amount */
export const createExpenseAmount = (data: ExpenseAmountPayload) => {
  console.log('[API] POST /tracker/expenses-amount/create', data);
  return api.post<TrackerAmount>('/tracker/expenses-amount/create', data);
};

/** PUT  /tracker/expenses-amount/:id – update expense amount */
export const updateExpenseAmount = (id: number | string, data: Partial<ExpenseAmountPayload>) => {
  console.log(`[API] PUT /tracker/expenses-amount/${id}`, data);
  return api.put<TrackerAmount>(`/tracker/expenses-amount/${id}`, data);
};

/**  DELETE /tracker/expenses-amount/:id – delete expense amount */
export const deleteExpenseAmount = (id: number | string) => {
  console.log(`[API] DELETE /tracker/expenses-amount/${id}`);
  return api.delete(`/tracker/expenses-amount/${id}`);
};

/** SEARCH /tracker/income-amount/search – search income amount */
export const searchIncomeAmount = (name: string) => {
  console.log(`[API] GET /tracker/income-amount/search?name=${name}`);
  return api.post<TrackerAmount[]>(`/tracker/income-amount/search?name=${encodeURIComponent(name)}`);
};

/** SEARCH /tracker/expenses-amount/search – search expense amount */
export const searchExpenseAmount = (name: string) => {
  console.log(`[API] GET /tracker/expenses-amount/search?name=${name}`);
  return api.post<TrackerAmount[]>(`/tracker/expenses-amount/search?name=${encodeURIComponent(name)}`);
};

/** FILTER /tracker/income-amount/filter – filter income amount */
export const filterIncomeAmount = (params: { start_date?: string, end_date?: string, category_id?: string | number }) => {
  const query = new URLSearchParams();
  if (params.start_date) query.append('start_date', params.start_date);
  if (params.end_date) query.append('end_date', params.end_date);
  if (params.category_id && params.category_id !== 'All') query.append('category_id', String(params.category_id));
  
  const queryString = query.toString();
  console.log(`[API] POST /tracker/income-amount/filter?${queryString}`);
  return api.post<TrackerAmount[]>(`/tracker/income-amount/filter?${queryString}`);
};

/** FILTER /tracker/expenses-amount/filter – filter expense amount */
export const filterExpenseAmount = (params: { start_date?: string, end_date?: string, category_id?: string | number }) => {
  const query = new URLSearchParams();
  if (params.start_date) query.append('start_date', params.start_date);
  if (params.end_date) query.append('end_date', params.end_date);
  if (params.category_id && params.category_id !== 'All') query.append('category_id', String(params.category_id));
  
  const queryString = query.toString();
  console.log(`[API] POST /tracker/expenses-amount/filter?${queryString}`);
  return api.post<TrackerAmount[]>(`/tracker/expenses-amount/filter?${queryString}`);
};