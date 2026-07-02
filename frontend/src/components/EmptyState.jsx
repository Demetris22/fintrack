function EmptyState({ icon: Icon, title, description, children }) {
  return (
    <div className="empty-state">
      <div className="empty-state-body">
        {Icon && (
          <span className="empty-state-visual" aria-hidden="true">
            <Icon size={25} strokeWidth={1.8} />
          </span>
        )}

        <h3>{title}</h3>

        {description && <p>{description}</p>}

        {children && <div className="empty-state-extra">{children}</div>}
      </div>
    </div>
  );
}

export default EmptyState;
