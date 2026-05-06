export default function FieldRenderer({
  field,
  value,
  error,
  onChange,
  disabled = false,
}) {
  const isDisabled = disabled || field.ui?.disabled || field.ui?.readOnly;
  const commonProps = {
    id: field.key,
    name: field.key,
    disabled: isDisabled,
    value:
      field.type === "checkbox" || field.type === "switch"
        ? undefined
        : value ?? "",
    onChange: (event) => {
      if (field.type === "checkbox" || field.type === "switch") {
        onChange(field.key, event.target.checked);
        return;
      }

      if (field.type === "multiselect") {
        const selected = Array.from(event.target.selectedOptions).map((option) => option.value);
        onChange(field.key, selected);
        return;
      }

      onChange(field.key, event.target.value);
    },
    placeholder: field.placeholder || "",
  };

  let control = null;

  if (field.type === "textarea") {
    control = <textarea className="dynamic-form__textarea" rows="4" {...commonProps} />;
  } else if (field.type === "select") {
    control = (
      <select className="dynamic-form__select" {...commonProps}>
        <option value="">Select an option</option>
        {(field.options || []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  } else if (field.type === "multiselect") {
    control = (
      <select
        className="dynamic-form__select dynamic-form__select--multi"
        multiple
        value={Array.isArray(value) ? value : []}
        name={field.key}
        id={field.key}
        disabled={isDisabled}
        onChange={commonProps.onChange}
      >
        {(field.options || []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  } else if (field.type === "radio") {
    control = (
      <div className="dynamic-form__choice-group">
        {(field.options || []).map((option) => (
          <label key={option.value} className="dynamic-form__choice">
            <input
              type="radio"
              name={field.key}
              value={option.value}
              checked={value === option.value}
              disabled={isDisabled}
              onChange={() => onChange(field.key, option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    );
  } else if (field.type === "checkbox" || field.type === "switch") {
    control = (
      <label className="dynamic-form__choice">
        <input
          type="checkbox"
          name={field.key}
          id={field.key}
          checked={Boolean(value)}
          disabled={isDisabled}
          onChange={commonProps.onChange}
        />
        <span>{field.helperText || "Toggle this option"}</span>
      </label>
    );
  } else if (field.type === "file") {
    control = (
      <input
        className="dynamic-form__input"
        type="text"
        readOnly
        disabled
        value="File uploads are schema-ready and can be extended with a storage pipeline."
      />
    );
  } else {
    control = (
      <input
        className="dynamic-form__input"
        type={field.type === "datetime" ? "datetime-local" : field.type}
        {...commonProps}
      />
    );
  }

  return (
    <div className={`dynamic-form__field ${error ? "has-error" : ""}`}>
      <div className="dynamic-form__field-head">
        <label className="dynamic-form__label" htmlFor={field.key}>
          {field.label}
          {field.validations?.required ? <span className="dynamic-form__required"> *</span> : null}
        </label>
        {field.ui?.readOnly ? <span className="dynamic-form__flag">Read only</span> : null}
      </div>
      {control}
      {field.helperText && field.type !== "checkbox" && field.type !== "switch" ? (
        <p className="dynamic-form__helper">{field.helperText}</p>
      ) : null}
      {error ? <p className="dynamic-form__error">{error}</p> : null}
    </div>
  );
}
