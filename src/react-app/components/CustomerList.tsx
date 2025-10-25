import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/Api";
import styles from "./CustomerList.module.css";

interface Customer {
  id: string;
  customer_number: string;
  account_number: string;
  title?: string;
  first_name: string;
  last_name: string;
  email?: string;
  mobile: string;
  city: string;
  province: string;
  customer_type: string;
  status: string;
  created_at: string;
}

interface CustomerListResponse {
  customers: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function CustomerList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [province, setProvince] = useState("");
  const limit = 10;

  const {
    data: customersData,
    isLoading,
    error,
    refetch,
  } = useQuery<CustomerListResponse>({
    queryKey: ["customers", page, search, status, province],
    queryFn: () =>
      api.get<CustomerListResponse>(
        `/customers?page=${page}&limit=${limit}&search=${search}&status=${status}&province=${province}`
      ),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    refetch();
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "badge-success";
      case "suspended":
        return "badge-warning";
      case "terminated":
        return "badge-danger";
      default:
        return "badge-secondary";
    }
  };

  const getCustomerTypeBadgeClass = (type: string) => {
    switch (type) {
      case "residential":
        return "badge-primary";
      case "business":
        return "badge-info";
      case "government":
        return "badge-warning";
      case "education":
        return "badge-success";
      default:
        return "badge-secondary";
    }
  };

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <div>
          <strong>Error loading customers</strong>
          <br />
          {error instanceof Error ? error.message : "Unknown error occurred"}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.customerListContainer}>
      <div className={styles.customerListHeader}>
        <h2>Customer Management</h2>
        <p className={styles.subtitle}>
          Manage your South African customer base
        </p>
      </div>

      {/* Search and Filters */}
      <div className={styles.filtersSection}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={styles.searchInputGroup}>
            <input
              type="text"
              placeholder="Search by name, email, customer number, or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchButton}>
              🔍 Search
            </button>
          </div>
        </form>

        <div className={styles.filterControls}>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className={styles.filterSelect}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="terminated">Terminated</option>
          </select>

          <select
            value={province}
            onChange={(e) => {
              setProvince(e.target.value);
              setPage(1);
            }}
            className="filter-select"
          >
            <option value="">All Provinces</option>
            <option value="Western Cape">Western Cape</option>
            <option value="Eastern Cape">Eastern Cape</option>
            <option value="Northern Cape">Northern Cape</option>
            <option value="Free State">Free State</option>
            <option value="KwaZulu-Natal">KwaZulu-Natal</option>
            <option value="Gauteng">Gauteng</option>
            <option value="Mpumalanga">Mpumalanga</option>
            <option value="Limpopo">Limpopo</option>
            <option value="North West">North West</option>
          </select>

          <button
            onClick={() => (window.location.href = "/customers/create")}
            className={styles.createCustomerButton}
          >
            ➕ New Customer
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          Loading customers...
        </div>
      )}

      {/* Customer Table */}
      {!isLoading && customersData && (
        <>
          <div className={styles.customerStats}>
            <div className={styles.statItem}>
              <strong>Total Customers:</strong> {customersData.pagination.total}
            </div>
            <div className={styles.statItem}>
              <strong>Page:</strong> {customersData.pagination.page} of{" "}
              {customersData.pagination.totalPages}
            </div>
          </div>

          <div className={styles.customerTableContainer}>
            <table className={styles.customerTable}>
              <thead>
                <tr>
                  <th>Customer #</th>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customersData.customers.map((customer) => (
                  <tr key={customer.id} className={styles.customerRow}>
                    <td>
                      <div className={styles.customerNumber}>
                        {customer.customer_number}
                      </div>
                      <div
                        className={`${styles.accountNumber} ${styles.textSmall}`}
                      >
                        {customer.account_number}
                      </div>
                    </td>
                    <td>
                      <div className={styles.customerName}>
                        {customer.title && (
                          <span className={styles.title}>
                            {customer.title}{" "}
                          </span>
                        )}
                        {customer.first_name} {customer.last_name}
                      </div>
                      {customer.email && (
                        <div
                          className={`${styles.customerEmail} ${styles.textSmall}`}
                        >
                          {customer.email}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className={styles.customerMobile}>
                        {customer.mobile}
                      </div>
                      {customer.mobile !== customer.mobile && (
                        <div
                          className={`${styles.customerPhone} ${styles.textSmall}`}
                        >
                          {customer.mobile}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className={styles.customerLocation}>
                        {customer.city}
                      </div>
                      <div
                        className={`${styles.customerProvince} ${styles.textSmall}`}
                      >
                        {customer.province}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          styles[
                            getCustomerTypeBadgeClass(customer.customer_type)
                          ]
                        }`}
                      >
                        {customer.customer_type}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          styles[getStatusBadgeClass(customer.status)]
                        }`}
                      >
                        {customer.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button
                          onClick={() =>
                            (window.location.href = `/customers/${customer.id}`)
                          }
                          className={`${styles.actionButton} ${styles.viewButton}`}
                        >
                          👁️ View
                        </button>
                        <button
                          onClick={() =>
                            (window.location.href = `/customers/${customer.id}/edit`)
                          }
                          className={`${styles.actionButton} ${styles.editButton}`}
                        >
                          ✏️ Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {customersData.pagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className={styles.paginationButton}
              >
                Previous
              </button>
              <span className={styles.paginationInfo}>
                Page {page} of {customersData.pagination.totalPages}
              </span>
              <button
                disabled={page === customersData.pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className={styles.paginationButton}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!isLoading && customersData?.customers.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>👥</div>
          <h3>No customers found</h3>
          <p>
            {search || status || province
              ? "Try adjusting your search or filters"
              : "Get started by creating your first customer"}
          </p>
          {!search && !status && !province && (
            <button
              onClick={() => (window.location.href = "/customers/create")}
              className={`${styles.createCustomerButton} ${styles.primary}`}
            >
              Create First Customer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
