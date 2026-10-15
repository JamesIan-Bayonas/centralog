/** Decorative alongside the visible CentraLog wordmark; one asset for both headers. */
export function CentraLogMark() {
  return (
    <img
      className="centralog-mark"
      src={`${import.meta.env.BASE_URL}brand/centralog-mark.svg`}
      width="64"
      height="64"
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}
