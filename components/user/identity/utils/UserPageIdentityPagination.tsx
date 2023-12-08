export default function UserPageIdentityPagination({
  currentPage,
  setCurrentPage,
  totalPages,
}: {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
}) {
  return (
    <div>
      <div>
        {currentPage}/{totalPages}
      </div>
      {currentPage > 1 && (
        <button onClick={() => setCurrentPage(currentPage - 1)}>
          Previous
        </button>
      )}
      {currentPage < totalPages && (
        <button onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
      )}
    </div>
  );
}
