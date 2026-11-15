import {useEffect, useState} from "react";
import {getImageObjectUrl} from "../helpers/getImageObjectUrl";

export function useImageObjectUrl(imageUrls: string[]) {
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    let isCancelled = false;
    let objectUrls: string[] = [];

    async function load() {
      try {
        const results = await Promise.all(
          imageUrls.map(async (r) => await getImageObjectUrl(r))
        );

        if (!isCancelled) {
          setUrls(results);
          objectUrls = results;
        }
      } catch (err) {
        console.error("Błąd podczas pobierania obrazków:", err);
      }
    }

    load();

    return () => {
      // czyszczenie pamięci
      isCancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageUrls]);

  return urls;
}
