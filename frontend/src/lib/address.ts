import type { ApiAddress } from "@/types/auth";

export type AddressDraft = {
  full_name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

export type AddressFieldErrors = Partial<Record<keyof AddressDraft, string>>;

export function emptyAddress(customer?: { full_name: string; phone: string } | null): AddressDraft {
  return {
    full_name: customer?.full_name ?? "",
    phone: customer?.phone ?? "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  };
}

export function fromSavedAddress(address: ApiAddress): AddressDraft {
  return {
    full_name: address.full_name,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2 ?? "",
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    country: address.country || "India",
  };
}

export function validateAddress(draft: AddressDraft): AddressFieldErrors {
  const errors: AddressFieldErrors = {};
  if (draft.full_name.trim().length < 2) {
    errors.full_name = "Enter the recipient's full name.";
  }
  const phone = draft.phone.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
  if (!/^[6-9]\d{9}$/.test(phone)) {
    errors.phone = "Enter a valid 10-digit Indian mobile number.";
  }
  if (draft.line1.trim().length < 5) {
    errors.line1 = "Enter a complete house or street address.";
  }
  if (draft.city.trim().length < 2) {
    errors.city = "Enter a city.";
  }
  if (draft.state.trim().length < 2) {
    errors.state = "Select a state.";
  }
  if (!/^\d{6}$/.test(draft.pincode.trim())) {
    errors.pincode = "Enter a valid 6-digit PIN code.";
  }
  if (draft.country.trim().length < 2) {
    errors.country = "Enter a country.";
  }
  return errors;
}
