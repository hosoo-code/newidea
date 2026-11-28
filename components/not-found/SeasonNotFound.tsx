import React from "react";
import RefreshButton from "@/components/ui/RefreshButton";

interface SeasonNotFoundProps {
  seasonId: string;
}

const SeasonNotFound = ({ seasonId }: SeasonNotFoundProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      <div className="glass-container text-center max-w-md w-full">
        <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-yellow-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.5-.98-6.084-2.709"
            />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-white mb-2">
          Улирал олдсонгүй
        </h1>
        <p className="text-sm text-gray-400 mb-3">
          Энэ цувралын {seasonId}-р улирал олдсонгүй.
        </p>
        <p className="text-xs text-gray-500 mb-4">
          Хаягаа шалгах эсвэл түр хүлээгээд дахин оролдоно уу. Заримдаа сервертэй холбоотой саатал гардаг.
        </p>
        <RefreshButton className="px-4 py-2 bg-primary hover:bg-primary/90 text-black font-medium rounded-lg transition-colors duration-200">
          Дахин оролдох
        </RefreshButton>
      </div>
    </div>
  );
};
export default SeasonNotFound;
