import { Loader2 } from "lucide-react";

export const LoadingSpinner = ({
  height = 64,
  margin = 0,
}: {
  height?: number;
  margin?: number;
}) => (
  <div
    className={`flex justify-center items-center h-${height} w-${height} m-${margin}`}
  >
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);
