interface Props {
  message: string;
}

export default function ErrorBanner({ message }: Props) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
      <strong>Error:</strong> {message}
    </div>
  );
}
