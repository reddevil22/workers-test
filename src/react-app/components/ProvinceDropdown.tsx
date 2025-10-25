interface ProvinceDropdownProps {
  value?: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function ProvinceDropdown({
  value = "",
  onChange,
  required = false,
  disabled = false,
  placeholder = "Select province...",
  className = "",
}: ProvinceDropdownProps) {
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

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      disabled={disabled}
      className={className}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {provinces.map((province) => (
        <option key={province} value={province}>
          {province}
        </option>
      ))}
    </select>
  );
}
