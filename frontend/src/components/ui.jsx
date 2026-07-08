import { Children, cloneElement, isValidElement, useId } from "react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Button({
  children,
  className = "",
  variant = "primary",
  isLoading = false,
  disabled,
  ...props
}) {
  return (
    <button
      className={cx("ui-button", `ui-button-${variant}`, className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <span className="button-spinner" aria-hidden="true"></span>}
      {children}
    </button>
  );
}

function Card({ children, className = "", as: Component = "div", ...props }) {
  return (
    <Component className={cx("card", className)} {...props}>
      {children}
    </Component>
  );
}

function FormCard({ title, description, children, className = "" }) {
  return (
    <Card className={cx("form-card", className)}>
      <div className="form-card-header">
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>

      {children}
    </Card>
  );
}

function FormField({
  label,
  children,
  className = "",
  fullWidth = false,
  hint,
  error,
}) {
  const generatedId = useId();
  const hintId = hint ? `${generatedId}-hint` : undefined;
  const errorId = error ? `${generatedId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const childArray = Children.toArray(children);
  const firstControlIndex = childArray.findIndex((child) =>
    isValidElement(child)
  );
  const firstControl = childArray[firstControlIndex];
  const controlId =
    isValidElement(firstControl) && firstControl.props.id
      ? firstControl.props.id
      : generatedId;

  const childrenWithFieldProps = childArray.map((child, index) => {
    if (!isValidElement(child) || index !== firstControlIndex) {
      return child;
    }

    return cloneElement(child, {
      id: child.props.id || controlId,
      "aria-describedby": [child.props["aria-describedby"], describedBy]
        .filter(Boolean)
        .join(" ") || undefined,
      "aria-invalid": error ? true : child.props["aria-invalid"],
    });
  });

  return (
    <div className={cx("form-field", fullWidth && "full-width", className)}>
      {label && <label htmlFor={controlId}>{label}</label>}
      {childrenWithFieldProps}
      {hint && (
        <small className="form-helper" id={hintId}>
          {hint}
        </small>
      )}
      {error && (
        <small className="form-warning" id={errorId} role="alert">
          {error}
        </small>
      )}
    </div>
  );
}

function TextInput(props) {
  return <input {...props} />;
}

function SelectInput({ children, ...props }) {
  return <select {...props}>{children}</select>;
}

function SectionHeader({ title, description, actions, className = "" }) {
  return (
    <div className={cx("section-header", className)}>
      <div className="section-title-block">
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>

      {actions && <div className="section-actions">{actions}</div>}
    </div>
  );
}

function PageSection({ children, className = "", ...props }) {
  return (
    <section className={cx("page-section", className)} {...props}>
      {children}
    </section>
  );
}

export {
  Button,
  Card,
  FormCard,
  FormField,
  PageSection,
  SectionHeader,
  SelectInput,
  TextInput,
};
