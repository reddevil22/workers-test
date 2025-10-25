import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { render } from "../utils";
import { ProvinceDropdown } from "../../react-app/components/ProvinceDropdown";

describe("ProvinceDropdown", () => {
  const defaultProps = {
    value: "",
    onChange: vi.fn(),
    required: false,
    disabled: false,
    placeholder: "Select province...",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with all South African provinces", () => {
    render(<ProvinceDropdown {...defaultProps} />);

    const provinces = [
      "Western Cape",
      "Eastern Cape",
      "Northern Cape",
      "Free State",
      "KwaZulu-Natal",
      "Gauteng",
      "Mpumalanga",
      "Limpopo",
      "North West",
    ];

    provinces.forEach((province) => {
      expect(screen.getByText(province)).toBeInTheDocument();
    });
  });

  it("shows placeholder when no value is selected", () => {
    render(<ProvinceDropdown {...defaultProps} />);

    expect(screen.getByText("Select province...")).toBeInTheDocument();
  });

  it("calls onChange when a province is selected", async () => {
    const mockOnChange = vi.fn();
    render(<ProvinceDropdown {...defaultProps} onChange={mockOnChange} />);

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "Gauteng" } });

    expect(mockOnChange).toHaveBeenCalledWith("Gauteng");
  });

  it("displays selected value correctly", () => {
    render(<ProvinceDropdown {...defaultProps} value="Western Cape" />);

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("Western Cape");
  });

  it("applies required attribute when required is true", () => {
    render(<ProvinceDropdown {...defaultProps} required={true} />);

    const select = screen.getByRole("combobox");
    expect(select).toBeRequired();
  });

  it("applies disabled attribute when disabled is true", () => {
    render(<ProvinceDropdown {...defaultProps} disabled={true} />);

    const select = screen.getByRole("combobox");
    expect(select).toBeDisabled();
  });

  it("applies custom className when provided", () => {
    const customClass = "custom-select-class";
    render(<ProvinceDropdown {...defaultProps} className={customClass} />);

    const select = screen.getByRole("combobox");
    expect(select).toHaveClass(customClass);
  });

  it("shows placeholder even when disabled", () => {
    render(<ProvinceDropdown {...defaultProps} disabled={true} />);

    // The placeholder option should still be present but the select should be disabled
    expect(screen.getByText("Select province...")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeDisabled();
  });
});
