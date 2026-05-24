export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className={className ?? "text-sm text-red-400 hover:text-red-300"}
      >
        Sign out
      </button>
    </form>
  );
}
