import { Loader2 } from "lucide-react";

export const LoadingSpinner = ({ height = 64 }: { height?: number }) => (
  <div className={`flex justify-center items-center h-${height}`}>
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);
