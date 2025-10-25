import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../services/Api";
import { ProvinceDropdown } from "./ProvinceDropdown";
import styles from "./CustomerForm.module.css";

interface Customer {
  id?: string;
  title?: string;
  first_name: string;
  last_name: string;
  id_number?: string;
  passport_number?: string;
  date_of_birth?: string;
  nationality?: string;
  email?: string;
  phone?: string;
  mobile: string;
  whatsapp_number?: string;
  address_line1?: string;
  address_line2?: string;
  suburb?: string;
  city: string;
  province: string;
  postal_code: string;
  complex_name?: string;
  unit_number?: string;
  street_number?: string;
  street_name?: string;
  company_name?: string;
  company_registration_number?: string;
  tax_number?: string;
  vat_number?: string;
  customer_type?: string;
  credit_limit?: number;
  payment_method?: string;
  banking_details?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  preferred_language?: string;
  communication_preference?: string;
  marketing_consent?: boolean;
}

interface CustomerFormProps {
  customerId?: string;
  onSuccess?: (customer: Customer) => void;
  onCancel?: () => void;
}

export function CustomerForm({
  customerId,
  onSuccess,
  onCancel,
}: CustomerFormProps) {
  const [formData, setFormData] = useState<Customer>({
    first_name: "",
    last_name: "",
    mobile: "",
    city: "",
    province: "",
    postal_code: "",
    customer_type: "residential",
    nationality: "South African",
    preferred_language: "english",
    communication_preference: "sms",
    marketing_consent: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load customer data if editing
  const { data: customerData, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ["customer", customerId],
    queryFn: () => api.get<Customer>(`/customers/${customerId}`),
    enabled: !!customerId,
  });

  useEffect(() => {
    if (customerData && customerId) {
      setFormData(customerData);
    }
  }, [customerData, customerId]);

  const createMutation = useMutation({
    mutationFn: (customer: Customer) =>
      api.post<{ customer: Customer }>(
        "/customers",
        customer as unknown as Record<string, unknown>
      ),
    onSuccess: (data) => {
      onSuccess?.(data.customer);
    },
    onError: (error: Error) => {
      setErrors({ submit: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (customer: Customer) =>
      api.put<{ customer: Customer }>(
        `/customers/${customerId}`,
        customer as unknown as Record<string, unknown>
      ),
    onSuccess: (data) => {
      onSuccess?.(data.customer);
    },
    onError: (error: Error) => {
      setErrors({ submit: error.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Basic validation
    const newErrors: Record<string, string> = {};

    if (!formData.first_name?.trim()) {
      newErrors.first_name = "First name is required";
    }

    if (!formData.last_name?.trim()) {
      newErrors.last_name = "Last name is required";
    }

    if (!formData.mobile?.trim()) {
      newErrors.mobile = "Mobile number is required";
    }

    if (!formData.city?.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.province?.trim()) {
      newErrors.province = "Province is required";
    }

    if (!formData.postal_code?.trim()) {
      newErrors.postal_code = "Postal code is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (customerId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (field: keyof Customer, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (customerId && isLoadingCustomer) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        Loading customer data...
      </div>
    );
  }

  return (
    <div className={styles.customerFormContainer}>
      <div className={styles.customerFormHeader}>
        <h2>{customerId ? "Edit Customer" : "Create New Customer"}</h2>
        <p className={styles.subtitle}>
          {customerId
            ? "Update customer information"
            : "Add a new customer to your South African database"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.customerForm}>
        {/* Personal Information */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Personal Information</h3>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="title">Title</label>
              <select
                id="title"
                value={formData.title || ""}
                onChange={(e) => handleChange("title", e.target.value)}
                className={errors.title ? styles.error : ""}
              >
                <option value="">Select title</option>
                <option value="Mr">Mr</option>
                <option value="Mrs">Mrs</option>
                <option value="Miss">Miss</option>
                <option value="Dr">Dr</option>
                <option value="Prof">Prof</option>
              </select>
              {errors.title && (
                <span className={styles.errorMessage}>{errors.title}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="first_name">First Name *</label>
              <input
                type="text"
                id="first_name"
                value={formData.first_name || ""}
                onChange={(e) => handleChange("first_name", e.target.value)}
                className={errors.first_name ? styles.error : ""}
                required
              />
              {errors.first_name && (
                <span className={styles.errorMessage}>{errors.first_name}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="last_name">Last Name *</label>
              <input
                type="text"
                id="last_name"
                value={formData.last_name || ""}
                onChange={(e) => handleChange("last_name", e.target.value)}
                className={errors.last_name ? styles.error : ""}
                required
              />
              {errors.last_name && (
                <span className={styles.errorMessage}>{errors.last_name}</span>
              )}
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="id_number">ID Number</label>
              <input
                type="text"
                id="id_number"
                value={formData.id_number || ""}
                onChange={(e) => handleChange("id_number", e.target.value)}
                placeholder="13-digit SA ID number"
              />
              {errors.id_number && (
                <span className={styles.errorMessage}>{errors.id_number}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="passport_number">Passport Number</label>
              <input
                type="text"
                id="passport_number"
                value={formData.passport_number || ""}
                onChange={(e) =>
                  handleChange("passport_number", e.target.value)
                }
                placeholder="For non-SA citizens"
              />
              {errors.passport_number && (
                <span className={styles.errorMessage}>
                  {errors.passport_number}
                </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="date_of_birth">Date of Birth</label>
              <input
                type="date"
                id="date_of_birth"
                value={formData.date_of_birth || ""}
                onChange={(e) => handleChange("date_of_birth", e.target.value)}
              />
              {errors.date_of_birth && (
                <span className={styles.errorMessage}>
                  {errors.date_of_birth}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Contact Information</h3>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={formData.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
                className={errors.email ? styles.error : ""}
              />
              {errors.email && (
                <span className={styles.errorMessage}>{errors.email}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                value={formData.phone || ""}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="Landline number"
              />
              {errors.phone && (
                <span className={styles.errorMessage}>{errors.phone}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="mobile">Mobile Number *</label>
              <input
                type="tel"
                id="mobile"
                value={formData.mobile || ""}
                onChange={(e) => handleChange("mobile", e.target.value)}
                className={errors.mobile ? styles.error : ""}
                required
                placeholder="07X XXX XXXX"
              />
              {errors.mobile && (
                <span className={styles.errorMessage}>{errors.mobile}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="whatsapp_number">WhatsApp Number</label>
              <input
                type="tel"
                id="whatsapp_number"
                value={formData.whatsapp_number || ""}
                onChange={(e) =>
                  handleChange("whatsapp_number", e.target.value)
                }
                placeholder="Same as mobile if different"
              />
              {errors.whatsapp_number && (
                <span className={styles.errorMessage}>
                  {errors.whatsapp_number}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Address Information</h3>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="street_number">Street Number</label>
              <input
                type="text"
                id="street_number"
                value={formData.street_number || ""}
                onChange={(e) => handleChange("street_number", e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="street_name">Street Name</label>
              <input
                type="text"
                id="street_name"
                value={formData.street_name || ""}
                onChange={(e) => handleChange("street_name", e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="complex_name">Complex/Building Name</label>
              <input
                type="text"
                id="complex_name"
                value={formData.complex_name || ""}
                onChange={(e) => handleChange("complex_name", e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="unit_number">Unit/Flat Number</label>
              <input
                type="text"
                id="unit_number"
                value={formData.unit_number || ""}
                onChange={(e) => handleChange("unit_number", e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="address_line1">Address Line 1</label>
              <input
                type="text"
                id="address_line1"
                value={formData.address_line1 || ""}
                onChange={(e) => handleChange("address_line1", e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="address_line2">Address Line 2</label>
              <input
                type="text"
                id="address_line2"
                value={formData.address_line2 || ""}
                onChange={(e) => handleChange("address_line2", e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="suburb">Suburb</label>
              <input
                type="text"
                id="suburb"
                value={formData.suburb || ""}
                onChange={(e) => handleChange("suburb", e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="city">City *</label>
              <input
                type="text"
                id="city"
                value={formData.city || ""}
                onChange={(e) => handleChange("city", e.target.value)}
                className={errors.city ? styles.error : ""}
                required
              />
              {errors.city && (
                <span className={styles.errorMessage}>{errors.city}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="province">Province *</label>
              <ProvinceDropdown
                value={formData.province || ""}
                onChange={(value) => handleChange("province", value)}
                required
                className={errors.province ? styles.error : ""}
              />
              {errors.province && (
                <span className={styles.errorMessage}>{errors.province}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="postal_code">Postal Code *</label>
              <input
                type="text"
                id="postal_code"
                value={formData.postal_code || ""}
                onChange={(e) => handleChange("postal_code", e.target.value)}
                className={errors.postal_code ? styles.error : ""}
                required
                placeholder="4-digit postal code"
              />
              {errors.postal_code && (
                <span className={styles.errorMessage}>
                  {errors.postal_code}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Customer Type */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Customer Type</h3>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="customer_type">Customer Type</label>
              <select
                id="customer_type"
                value={formData.customer_type || ""}
                onChange={(e) => handleChange("customer_type", e.target.value)}
              >
                <option value="residential">Residential</option>
                <option value="business">Business</option>
                <option value="government">Government</option>
                <option value="education">Education</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="nationality">Nationality</label>
              <select
                id="nationality"
                value={formData.nationality || ""}
                onChange={(e) => handleChange("nationality", e.target.value)}
              >
                <option value="South African">South African</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Additional Options */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Communication Preferences</h3>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="preferred_language">Preferred Language</label>
              <select
                id="preferred_language"
                value={formData.preferred_language || ""}
                onChange={(e) =>
                  handleChange("preferred_language", e.target.value)
                }
              >
                <option value="english">English</option>
                <option value="afrikaans">Afrikaans</option>
                <option value="zulu">Zulu</option>
                <option value="xhosa">Xhosa</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="communication_preference">
                Communication Method
              </label>
              <select
                id="communication_preference"
                value={formData.communication_preference || ""}
                onChange={(e) =>
                  handleChange("communication_preference", e.target.value)
                }
              >
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="phone">Phone Call</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                id="marketing_consent"
                checked={formData.marketing_consent || false}
                onChange={(e) =>
                  handleChange("marketing_consent", e.target.checked)
                }
              />
              I consent to receive marketing communications
            </label>
          </div>
        </div>

        {/* Error Display */}
        {errors.submit && (
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>⚠️</div>
            <div>{errors.submit}</div>
          </div>
        )}

        {/* Form Actions */}
        <div className={styles.formActions}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={styles.cancelButton}
              disabled={isLoading}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className={styles.loadingSpinner}></div>
                {customerId ? "Updating..." : "Creating..."}
              </>
            ) : customerId ? (
              "Update Customer"
            ) : (
              "Create Customer"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
