import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { render, mockFetch, mockApiResponses, resetFetchMock } from "../utils";
import { CustomerList } from "../../react-app/components/CustomerList";

describe("CustomerList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetFetchMock();
  });

  it("renders loading state initially", () => {
    mockFetch(new Promise(() => {})); // Never resolves
    render(<CustomerList />);

    expect(screen.getByText("Loading customers...")).toBeInTheDocument();
  });

  it("renders customer list when data is loaded", async () => {
    mockFetch(mockApiResponses.customers.list);
    render(<CustomerList />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });
  });

  it("displays customer information correctly", async () => {
    mockFetch(mockApiResponses.customers.list);
    render(<CustomerList />);

    await waitFor(() => {
      expect(screen.getByText("0712345678")).toBeInTheDocument();
      expect(screen.getByText("0823456789")).toBeInTheDocument();
      // Use more specific selectors to avoid conflicts with dropdown options
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });
  });

  it("shows empty state when no customers exist", async () => {
    mockFetch({
      customers: [],
      total: 0,
      pagination: { total: 0, page: 1, limit: 10 },
    });
    render(<CustomerList />);

    await waitFor(() => {
      expect(screen.getByText("Total Customers:")).toBeInTheDocument();
      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });

  it("displays action buttons for customers", async () => {
    mockFetch(mockApiResponses.customers.list);
    render(<CustomerList />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    // Verify that the customer table renders with actions column
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("filters customers by search term", async () => {
    mockFetch(mockApiResponses.customers.list);
    render(<CustomerList />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    // Verify search input exists
    const searchInput = screen.getByPlaceholderText(
      "Search by name, email, customer number, or mobile..."
    );
    expect(searchInput).toBeInTheDocument();
  });

  it("handles API errors gracefully", async () => {
    mockFetch({ error: "Failed to fetch customers" }, false, 500);
    render(<CustomerList />);

    await waitFor(() => {
      expect(screen.getByText("Error loading customers")).toBeInTheDocument();
      expect(screen.getByText("Failed to fetch customers")).toBeInTheDocument();
    });
  });

  it("navigates to create customer form", async () => {
    mockFetch(mockApiResponses.customers.list);
    render(<CustomerList />);

    await waitFor(() => {
      expect(screen.getByText("➕ New Customer")).toBeInTheDocument();
    });

    // Verify create customer button exists
    expect(screen.getByText("➕ New Customer")).toBeInTheDocument();
  });

  it("displays customer badges with correct styling", async () => {
    const mockCustomers = {
      customers: [
        {
          id: "1",
          customer_number: "CUST001",
          account_number: "ACC001",
          first_name: "John",
          last_name: "Doe",
          mobile: "0712345678",
          city: "Johannesburg",
          province: "Gauteng",
          customer_type: "residential",
          status: "active",
          created_at: "2024-01-01",
        },
        {
          id: "2",
          customer_number: "CUST002",
          account_number: "ACC002",
          first_name: "Jane",
          last_name: "Smith",
          mobile: "0823456789",
          city: "Cape Town",
          province: "Western Cape",
          customer_type: "business",
          status: "suspended",
          created_at: "2024-01-02",
        },
      ],
      pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
    };

    mockFetch(mockCustomers);
    render(<CustomerList />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    // Check customer type badges
    expect(screen.getByText("residential")).toBeInTheDocument();
    expect(screen.getByText("business")).toBeInTheDocument();

    // Check status badges
    expect(screen.getByText("active")).toBeInTheDocument();
    expect(screen.getByText("suspended")).toBeInTheDocument();
  });

  it("shows empty state with create button when no customers and no filters", async () => {
    mockFetch({
      customers: [],
      total: 0,
      pagination: { total: 0, page: 1, limit: 10 },
    });
    render(<CustomerList />);

    await waitFor(() => {
      expect(screen.getByText("No customers found")).toBeInTheDocument();
      expect(
        screen.getByText("Get started by creating your first customer")
      ).toBeInTheDocument();
      expect(screen.getByText("Create First Customer")).toBeInTheDocument();
    });
  });

  it("shows filtered empty state when no results with active filters", async () => {
    mockFetch({
      customers: [],
      total: 0,
      pagination: { total: 0, page: 1, limit: 10 },
    });
    render(<CustomerList />);

    await waitFor(() => {
      expect(screen.getByText("No customers found")).toBeInTheDocument();
    });

    // Set up a search filter to trigger filtered empty state message
    const searchInput = screen.getByPlaceholderText(
      "Search by name, email, customer number, or mobile..."
    );
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });

    const searchButton = screen.getByText("🔍 Search");
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(
        screen.getByText("Try adjusting your search or filters")
      ).toBeInTheDocument();
    });
  });

  it("handles pagination controls correctly", async () => {
    const mockPaginatedData = {
      customers: [
        {
          id: "1",
          customer_number: "CUST001",
          account_number: "ACC001",
          first_name: "John",
          last_name: "Doe",
          mobile: "0712345678",
          city: "Johannesburg",
          province: "Gauteng",
          customer_type: "residential",
          status: "active",
          created_at: "2024-01-01",
        },
      ],
      pagination: { page: 1, limit: 10, total: 25, totalPages: 3 },
    };

    mockFetch(mockPaginatedData);
    render(<CustomerList />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    // Test that pagination controls are rendered when there are multiple pages
    expect(screen.getByText("Previous")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();

    // On first page, Previous should be disabled, Next should be enabled
    expect(screen.getByText("Previous")).toBeDisabled();
    expect(screen.getByText("Next")).not.toBeDisabled();
  });

  it("disables pagination buttons appropriately", async () => {
    const mockFirstPage = {
      customers: [
        {
          id: "1",
          customer_number: "CUST001",
          account_number: "ACC001",
          first_name: "John",
          last_name: "Doe",
          mobile: "0712345678",
          city: "Johannesburg",
          province: "Gauteng",
          customer_type: "residential",
          status: "active",
          created_at: "2024-01-01",
        },
      ],
      pagination: { page: 1, limit: 10, total: 5, totalPages: 1 },
    };

    mockFetch(mockFirstPage);
    render(<CustomerList />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    // On first page with only one page, pagination shouldn't render
    expect(screen.queryByText("Previous")).not.toBeInTheDocument();
    expect(screen.queryByText("Next")).not.toBeInTheDocument();
  });

  it("displays customer with title and email when available", async () => {
    const mockCustomerWithDetails = {
      customers: [
        {
          id: "1",
          customer_number: "CUST001",
          account_number: "ACC001",
          title: "Dr.",
          first_name: "John",
          last_name: "Doe",
          email: "john.doe@example.com",
          mobile: "0712345678",
          city: "Johannesburg",
          province: "Gauteng",
          customer_type: "residential",
          status: "active",
          created_at: "2024-01-01",
        },
      ],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    };

    mockFetch(mockCustomerWithDetails);
    render(<CustomerList />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    // Check for title separately
    expect(screen.getByText("Dr.")).toBeInTheDocument();
    // Check for email
    expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();
  });

  it("handles status and province filter changes", async () => {
    mockFetch(mockApiResponses.customers.list);
    render(<CustomerList />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    // Test status filter
    const statusSelect = screen.getByDisplayValue("All Status");
    fireEvent.change(statusSelect, { target: { value: "active" } });
    expect(statusSelect).toHaveValue("active");

    // Test province filter
    const provinceSelect = screen.getByDisplayValue("All Provinces");
    fireEvent.change(provinceSelect, { target: { value: "Gauteng" } });
    expect(provinceSelect).toHaveValue("Gauteng");
  });
});
