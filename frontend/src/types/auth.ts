export interface ApiAddress {
  id: string;
  full_name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default: boolean;
}

export interface ApiCustomer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  is_staff?: boolean;
  addresses?: ApiAddress[];
}

export interface AuthPayload {
  token: string;
  customer: ApiCustomer;
  is_staff?: boolean;
  admin_url?: string;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  full_name: string;
  phone: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export interface PasswordResetConfirmPayload {
  uid: string;
  token: string;
  new_password: string;
}
