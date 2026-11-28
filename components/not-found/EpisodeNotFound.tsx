import Link from "next/link";
import React from "react";

interface EpisodeNotFoundProps {
  seriesId: string;
  seasonId: string;
  episodeId: string;
}

const EpisodeNotFound = ({
  seriesId,
  seasonId,
  episodeId,
}: EpisodeNotFoundProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
      <div className="glass-container text-center max-w-lg">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-400">404</h1>
        <h1 className="text-2xl font-bold text-white mb-4">
          Анги олдсонгүй
        </h1>
        <p className="text-gray-300 mb-4">
          Could not find episode S{seasonId}E{episodeId} for this series.
        </p>
        <div className="space-y-2 text-sm text-gray-500">
          <p>Шалтгаан нь дараахын нэг байж болно:</p>
          <ul className="text-left space-y-1">
            <li>• Анги хараахан гараагүй</li>
            <li>• Ангийн дугаар буруу</li>
            <li>• Интернэт холболтын асуудал</li>
            <li>• Серверийн түр зуурын саатал</li>
          </ul>
        </div>
        <div className="mt-6">
          <Link
            href={`/series/${seriesId}/season/${seasonId}`}
            className="bg-primary hover:bg-primary/90 text-black font-semibold px-4 py-2 rounded smooth-transition inline-block"
          >
            Улирал руу буцах
          </Link>
        </div>
      </div>
    </div>
  );
};
export default EpisodeNotFound;
