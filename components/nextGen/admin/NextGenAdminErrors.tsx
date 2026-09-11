export function printAdminErrors(errors: string[]) {
  const occurrences = new Map<string, number>();

  return (
    <div className="tw-mb-4">
      <ul>
        {errors.map((error) => {
          const occurrence = (occurrences.get(error) ?? 0) + 1;
          occurrences.set(error, occurrence);

          return (
            <li key={`${error}-${occurrence}`} className="tw-text-error">
              {error}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
