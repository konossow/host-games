export async function getImageObjectUrl(url: string): Promise<string> {
  const response = await fetch(url, { cache: "force-cache" });
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
