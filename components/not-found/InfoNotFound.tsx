"use client";
import React from "react";
import MediaDetailLayout from "../layout/MediaDetailLayout";
import { Button } from "../ui/button";
import Link from "next/link";

interface InfoNotFoundProps {
  type?: "movie" | "tv";
}

const InfoNotFound = ({ type = "movie" }: InfoNotFoundProps) => {
  return (
    <MediaDetailLayout className="pt-16">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-400">404</h1>
          <h2 className="text-xl md:text-2xl font-semibold text-white">
            {type === "movie" ? "Кино" : "Цуврал"} олдсонгүй
          </h2>
          <p className="text-gray-400 max-w-md mx-auto">
            Таны хайсан {type === "movie" ? "кино" : "цуврал"} байхгүй эсвэл манай сангаас хасагдсан байна.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-theme-primary text-black font-medium rounded-lg hover:bg-theme-primary/90 transition-colors"
          >
            Буцах
          </Button>
          <Link href={type === "movie" ? "/movie" : "/series"}>
            <Button className="px-6 py-3 border border-gray-600 text-white font-medium rounded-lg bg-gray-400/20 hover:bg-gray-600/20 transition-colors">
              {type === "movie" ? "Кинонууд" : "Цувралууд"} үзэх
            </Button>
          </Link>
        </div>
      </div>
    </MediaDetailLayout>
  );
};

export default InfoNotFound;
