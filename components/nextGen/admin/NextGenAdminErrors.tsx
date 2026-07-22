export function printAdminErrors(errors: string[]) {
  return (
    <div className="tw-mb-4">
      <ul>
        {errors.map((error) => (
          <li
            key={`error-${error.replaceAll("", " ")}`}
            className="tw-text-error"
          >
            {error}
          </li>
        ))}
      </ul>
    </div>
  );
}
