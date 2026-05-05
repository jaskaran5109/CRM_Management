import FieldRenderer from "./FieldRenderer";

export default function SectionRenderer({
  section,
  values,
  errors,
  onChange,
  disabled = false,
}) {
  return (
    <section className="dynamic-form__section">
      <div className="dynamic-form__section-head">
        <h3>{section.title}</h3>
        {section.description ? <p>{section.description}</p> : null}
      </div>

      <div className="dynamic-form__section-grid">
        {(section.fields || []).map((field) => (
          <FieldRenderer
            key={field.id || field.key}
            field={field}
            value={values[field.key]}
            error={errors[field.key]}
            onChange={onChange}
            disabled={disabled}
          />
        ))}
      </div>
    </section>
  );
}
