export function DestinationSkeleton() {
  return (
    <article className="skeleton-card destination-skeleton" aria-hidden="true">
      <span className="skeleton-block skeleton-image" />
      <div className="skeleton-card-body">
        <span className="skeleton-block skeleton-short" />
        <span className="skeleton-block skeleton-title" />
        <span className="skeleton-block" />
        <span className="skeleton-block skeleton-medium" />
      </div>
    </article>
  )
}

export function TravelOptionSkeleton() {
  return (
    <article className="skeleton-card travel-skeleton" aria-hidden="true">
      <div className="travel-skeleton-copy">
        <span className="skeleton-block skeleton-short" />
        <span className="skeleton-block skeleton-title" />
        <span className="skeleton-block skeleton-medium" />
      </div>
      <span className="skeleton-block skeleton-price" />
    </article>
  )
}
