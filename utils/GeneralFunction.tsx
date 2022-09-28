import { useEffect } from "react";

export const TabTitle = (title: string) => {
  return useEffect(() => {
    document.title = title;
  }, [])
}