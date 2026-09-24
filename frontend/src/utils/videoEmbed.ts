// HTML5 <video> can only play direct media files (mp4, webm, ...). A
// YouTube/Vimeo page URL is not a media file, so it silently fails to play.
// This detects those hosts and returns an embeddable iframe URL instead.
export function getVideoEmbedUrl(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, '');

  if (host === 'youtube.com' || host === 'm.youtube.com') {
    const videoId = url.pathname.startsWith('/shorts/')
      ? url.pathname.split('/')[2]
      : url.searchParams.get('v');
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  }

  if (host === 'youtu.be') {
    const videoId = url.pathname.slice(1);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  }

  if (host === 'vimeo.com') {
    const videoId = url.pathname.slice(1);
    return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
  }

  return null;
}
