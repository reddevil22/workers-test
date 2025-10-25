import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/Api";
import { CustomerForm } from "./CustomerForm";
import styles from "./CustomerDetail.module.css";

interface Customer {
  id: string;
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
  status?: string;
  customer_number?: string;
  account_number?: string;
  created_at?: string;
  updated_at?: string;
}

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = React.useState(false);

  const {
    data: customer,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => api.get<Customer>(`/customers/${id}`),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/customers/${id}`),
    onSuccess: () => {
      navigate("/customers");
    },
    onError: (error: Error) => {
      alert(`Failed to delete customer: ${error.message}`);
    },
  });

  const handleEditSuccess = () => {
    setIsEditing(false);
    // The query will automatically refetch due to invalidation
  };

  const handleDelete = () => {
    if (
      window.confirm(
        `Are you sure you want to delete ${customer?.first_name} ${customer?.last_name}? This action cannot be undone.`
      )
    ) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        Loading customer details...
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>❌</div>
        <div>
          <h3>Error Loading Customer</h3>
          <p>{error instanceof Error ? error.message : "Customer not found"}</p>
          <button
            onClick={() => navigate("/customers")}
            className={styles.backButton}
          >
            Back to Customers
          </button>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className={styles.customerDetailContainer}>
        <CustomerForm
          customerId={id}
          onSuccess={handleEditSuccess}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  const formatAddress = () => {
    const parts = [];
    if (customer.street_number && customer.street_name) {
      parts.push(`${customer.street_number} ${customer.street_name}`);
    }
    if (customer.complex_name) {
      parts.push(customer.complex_name);
    }
    if (customer.unit_number) {
      parts.push(`Unit ${customer.unit_number}`);
    }
    if (customer.address_line1) {
      parts.push(customer.address_line1);
    }
    if (customer.suburb) {
      parts.push(customer.suburb);
    }
    parts.push(customer.city);
    parts.push(customer.province);
    parts.push(customer.postal_code);
    return parts.join(", ");
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString();
  };

  const getCustomerTypeDisplay = (type?: string) => {
    switch (type) {
      case "residential":
        return "Residential";
      case "business":
        return "Business";
      case "government":
        return "Government";
      case "education":
        return "Education";
      default:
        return type || "Not specified";
    }
  };

  const getStatusBadge = (status?: string) => {
    const statusClass =
      status === "active"
        ? styles.badgeSuccess
        : status === "inactive"
        ? styles.badgeDanger
        : styles.badgeWarning;

    return (
      <span className={`${styles.badge} ${statusClass}`}>
        {status || "Unknown"}
      </span>
    );
  };

  return (
    <div className={styles.customerDetailContainer}>
      <div className={styles.customerDetailHeader}>
        <div className={styles.headerInfo}>
          <h1>
            {customer.first_name} {customer.last_name}
          </h1>
          <div className={styles.headerMeta}>
            <span className={styles.customerNumber}>
              {customer.customer_number}
            </span>
            {getStatusBadge(customer.status)}
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            onClick={() => navigate("/customers")}
            className={styles.backButton}
          >
            ← Back to Customers
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className={styles.editButton}
          >
            Edit Customer
          </button>
          <button
            onClick={handleDelete}
            className={styles.deleteButton}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      <div className={styles.customerDetailContent}>
        {/* Personal Information */}
        <section className={styles.detailSection}>
          <h2 className={styles.sectionTitle}>Personal Information</h2>
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <label>Full Name:</label>
              <span>
                {customer.title} {customer.first_name} {customer.last_name}
              </span>
            </div>

            {customer.id_number && (
              <div className={styles.detailItem}>
                <label>ID Number:</label>
                <span>{customer.id_number}</span>
              </div>
            )}

            {customer.passport_number && (
              <div className={styles.detailItem}>
                <label>Passport Number:</label>
                <span>{customer.passport_number}</span>
              </div>
            )}

            <div className={styles.detailItem}>
              <label>Date of Birth:</label>
              <span>{formatDate(customer.date_of_birth)}</span>
            </div>

            <div className={styles.detailItem}>
              <label>Nationality:</label>
              <span>{customer.nationality || "Not specified"}</span>
            </div>

            <div className={styles.detailItem}>
              <label>Customer Type:</label>
              <span>{getCustomerTypeDisplay(customer.customer_type)}</span>
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className={styles.detailSection}>
          <h2 className={styles.sectionTitle}>Contact Information</h2>
          <div className={styles.detailGrid}>
            {customer.email && (
              <div className={styles.detailItem}>
                <label>Email:</label>
                <span>{customer.email}</span>
              </div>
            )}

            {customer.phone && (
              <div className={styles.detailItem}>
                <label>Phone:</label>
                <span>{customer.phone}</span>
              </div>
            )}

            <div className={styles.detailItem}>
              <label>Mobile:</label>
              <span>{customer.mobile}</span>
            </div>

            {customer.whatsapp_number && (
              <div className={styles.detailItem}>
                <label>WhatsApp:</label>
                <span>{customer.whatsapp_number}</span>
              </div>
            )}
          </div>
        </section>

        {/* Address Information */}
        <section className={styles.detailSection}>
          <h2 className={styles.sectionTitle}>Address Information</h2>
          <div className={styles.detailItem}>
            <label>Full Address:</label>
            <span>{formatAddress()}</span>
          </div>
        </section>

        {/* Business Information (if applicable) */}
        {(customer.company_name ||
          customer.company_registration_number ||
          customer.tax_number ||
          customer.vat_number) && (
          <section className={styles.detailSection}>
            <h2 className={styles.sectionTitle}>Business Information</h2>
            <div className={styles.detailGrid}>
              {customer.company_name && (
                <div className={styles.detailItem}>
                  <label>Company Name:</label>
                  <span>{customer.company_name}</span>
                </div>
              )}

              {customer.company_registration_number && (
                <div className={styles.detailItem}>
                  <label>Registration Number:</label>
                  <span>{customer.company_registration_number}</span>
                </div>
              )}

              {customer.tax_number && (
                <div className={styles.detailItem}>
                  <label>Tax Number:</label>
                  <span>{customer.tax_number}</span>
                </div>
              )}

              {customer.vat_number && (
                <div className={styles.detailItem}>
                  <label>VAT Number:</label>
                  <span>{customer.vat_number}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Preferences */}
        <section className={styles.detailSection}>
          <h2 className={styles.sectionTitle}>Communication Preferences</h2>
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <label>Preferred Language:</label>
              <span>{customer.preferred_language || "English"}</span>
            </div>

            <div className={styles.detailItem}>
              <label>Communication Method:</label>
              <span>{customer.communication_preference || "SMS"}</span>
            </div>

            <div className={styles.detailItem}>
              <label>Marketing Consent:</label>
              <span>{customer.marketing_consent ? "Yes" : "No"}</span>
            </div>
          </div>
        </section>

        {/* Account Information */}
        <section className={styles.detailSection}>
          <h2 className={styles.sectionTitle}>Account Information</h2>
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <label>Account Number:</label>
              <span>{customer.account_number}</span>
            </div>

            <div className={styles.detailItem}>
              <label>Registration Date:</label>
              <span>{formatDate(customer.created_at)}</span>
            </div>

            <div className={styles.detailItem}>
              <label>Last Updated:</label>
              <span>{formatDate(customer.updated_at)}</span>
            </div>

            {customer.credit_limit && (
              <div className={styles.detailItem}>
                <label>Credit Limit:</label>
                <span>R {customer.credit_limit.toLocaleString()}</span>
              </div>
            )}

            {customer.payment_method && (
              <div className={styles.detailItem}>
                <label>Payment Method:</label>
                <span>{customer.payment_method}</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
