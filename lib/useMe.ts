"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import useSWR from "swr";

type Me = { loggedIn: boolean; isAdmin: boolean };
const fetcher = (url: string): Promise<Me> => fetch(url, { cache: "no-store" }).then((r) => r.json());

// Header нь layout-д байдаг тул нэг удаа ачаална. Хуудас солигдох бүрд дэвсгэрт шинэчилнэ (нэвтрэх/гарах үед зөв харагдана),
// гэхдээ навигацийг хүлээлгэхгүй.
export function useMe(): Me {
  const pathname = usePathname();
  const { data, mutate } = useSWR<Me>("/api/me", fetcher, { revalidateOnFocus: false, dedupingInterval: 2000 });
  useEffect(() => {
    mutate();
  }, [pathname, mutate]);
  return data ?? { loggedIn: false, isAdmin: false };
}
