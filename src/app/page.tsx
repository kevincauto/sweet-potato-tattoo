import { kv } from '@vercel/kv';
import NewsletterSection from '@/components/NewsletterSection';
import FlashGrid from '@/components/FlashGrid';
import FlashCTA from '@/components/FlashCTA';
import { stripCloudinaryVersion } from '@/lib/cloudinaryUrl';

// Cache this page for a short window to drastically reduce KV command usage.
// Admin mutations explicitly call `revalidatePath('/')` so updates show up quickly.
export const revalidate = 300; // 5 minutes

export default async function Home() {
  // Get flash images in the correct order
  let imageUrls = await kv.lrange('flash-images', 0, -1);

  // Fallback: if flash is empty, pull from any previous designs key (read-only; no migration here)
  if (imageUrls.length === 0) {
    const designsUrls = await kv.lrange('designs-images', 0, -1);
    if (designsUrls.length > 0) {
      imageUrls = designsUrls;
    }
  }

  // Legacy fallback (very old key)
  if (imageUrls.length === 0) {
    imageUrls = await kv.lrange('images', 0, -1);
  }
  
  // Pull per-image revision cache-busters (used to force Next/Image to refetch after Cloudinary overwrite)
  const revRaw = (await kv.hgetall('flash-image-rev')) as Record<string, string> | null;
  const revMap = revRaw ?? {};

  // Convert URLs to BlobData format
  const existingBlobs = imageUrls.map((url) => {
    const stableUrl = stripCloudinaryVersion(url);
    const rev = revMap[stableUrl];
    return { url, rev };
  });
  
  // Get captions
  const captionsRaw = (await kv.hgetall('captions')) as Record<string, string> | null;
  const captionsRawMap = captionsRaw ?? {};
  
  // Create a normalized captions map that handles URL encoding variations
  // This ensures captions can be found regardless of encoding differences
  const captionsMap: Record<string, string> = {};
  
  // For each URL in the list, try to find its caption in all encoding variations
  existingBlobs.forEach(blob => {
    // Try direct match first
    if (captionsRawMap[blob.url]) {
      captionsMap[blob.url] = captionsRawMap[blob.url];
      return;
    }
    
    // Try URL encoding variations
    const urlVariations = [
      decodeURIComponent(blob.url),
      encodeURI(blob.url),
      blob.url.replace(/%20/g, '%2520'),
      blob.url.replace(/%2520/g, '%20'),
    ];
    
    for (const variation of urlVariations) {
      if (captionsRawMap[variation]) {
        captionsMap[blob.url] = captionsRawMap[variation];
        return;
      }
    }
  });

  // Get categories for flash images (url -> category)
  const categoriesRaw = (await kv.hgetall('flash-categories')) as Record<string, string> | null;
  const categoriesMap = categoriesRaw ?? {};

  // Get schedules for flash images (url -> schedule ISO string)
  const schedulesRaw = (await kv.hgetall('flash-schedules')) as Record<string, string> | null;
  const schedulesMap = schedulesRaw ?? {};

  // Get hidden status for flash images (url -> 'true' or true if hidden)
  // Note: Vercel KV may return boolean true or string 'true'
  const hiddenRaw = (await kv.hgetall('flash-hidden')) as Record<string, string | boolean> | null;
  const hiddenMap = hiddenRaw ?? {};

  // Get claimed status for flash images (url -> 'true' or true if claimed)
  const claimedRaw = (await kv.hgetall('flash-claimed')) as Record<string, string | boolean> | null;
  const claimedMap = claimedRaw ?? {};

  // NOTE: We intentionally avoid "self-heal" KV writes during page renders to keep command usage low.
  // The claim/replace flows set revs explicitly, and admin can refresh/reclaim if an older asset needs it.
  const isClaimedValue = (v: unknown) => v === true || v === 'true';

  existingBlobs.forEach((blob) => {
    const url = blob.url;
    const stableUrl = stripCloudinaryVersion(url);

    // Determine claimed status using a few URL variations (encoding mismatches happen in KV keys).
    const variants = new Set<string>([url, stableUrl]);
    try {
      variants.add(decodeURIComponent(url));
    } catch {}
    try {
      variants.add(encodeURI(url));
    } catch {}
    try {
      variants.add(url.replace(/%20/g, '%2520'));
    } catch {}
    try {
      variants.add(url.replace(/%2520/g, '%20'));
    } catch {}

    const isClaimed = Array.from(variants).some((k) => isClaimedValue(claimedMap[k]));

    // If claimed but missing rev, we still render without rev. (Worst case: a stale cached image until next overwrite.)
  });

  // Create a comprehensive hidden map that handles all URL encoding variations
  // This ensures we can match URLs regardless of encoding differences
  const comprehensiveHiddenMap: Record<string, boolean> = {};
  
  Object.keys(hiddenMap).forEach(key => {
    // Check if value indicates hidden (handles both boolean true and string 'true')
    const value = hiddenMap[key];
    if (value === true || value === 'true') {
      // Store the original key
      comprehensiveHiddenMap[key] = true;
      
      // Generate all encoding variations
      const variations = new Set<string>();
      variations.add(key);
      
      // Try decoding variations (handles %20 -> space, %2520 -> %20)
      try {
        const decoded1 = decodeURIComponent(key);
        variations.add(decoded1);
        // Encode the decoded version to get single-encoded
        try {
          const encoded1 = encodeURI(decoded1);
          variations.add(encoded1);
        } catch {}
        
        // Try double-decoding (handles %2520 -> %20 -> space)
        try {
          const decoded2 = decodeURIComponent(decoded1);
          variations.add(decoded2);
          // Encode twice to get double-encoded
          try {
            const encoded2 = encodeURI(encodeURI(decoded2));
            variations.add(encoded2);
          } catch {}
        } catch {}
      } catch {}
      
      // Try encoding the original key to get double-encoded version
      // This handles the case where key is "spotted%20bucking%20horse" and we need "spotted%2520bucking%2520horse"
      try {
        // Replace %20 with %2520 to get double-encoded version
        const doubleEncoded = key.replace(/%20/g, '%2520');
        variations.add(doubleEncoded);
        // Also try triple-encoded
        const tripleEncoded = doubleEncoded.replace(/%20/g, '%2520');
        variations.add(tripleEncoded);
      } catch {}
      
      // Mark all variations as hidden
      variations.forEach(variation => {
        comprehensiveHiddenMap[variation] = true;
      });
    }
  });

  // Filter images based on schedule and hidden status
  // Get current time in ET - use a reliable method that works in all environments
  // Note: 'America/New_York' timezone automatically handles DST transitions (EST/EDT)
  const now = new Date();
  // Get current ET time as ISO string for comparison
  const nowETISO = now.toLocaleString('en-US', { 
    timeZone: 'America/New_York', // Automatically handles EST (winter) and EDT (summer)
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  // Parse ET time string to create a proper date object
  // Format: "MM/DD/YYYY, HH:mm:ss"
  const [datePart, timePart] = nowETISO.split(', ');
  const [month, day, year] = datePart.split('/');
  const [hours, minutes, seconds] = timePart.split(':');
  // Create date in ET timezone by using a format that represents ET time
  // We'll compare ISO strings directly for reliability
  const nowETString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
  
  const visibleBlobs = existingBlobs.filter(blob => {
    // First check if image is hidden indefinitely
    // Generate all possible URL encoding variations for comparison
    const urlVariations = new Set<string>();
    urlVariations.add(blob.url);
    
    // Try decoding (handles double-encoding like %2520 -> %20)
    try {
      const decoded = decodeURIComponent(blob.url);
      urlVariations.add(decoded);
      // Also try encoding the decoded version
      urlVariations.add(encodeURI(decoded));
    } catch {}
    
    // Try double-decoding (handles triple-encoding)
    try {
      const doubleDecoded = decodeURIComponent(decodeURIComponent(blob.url));
      urlVariations.add(doubleDecoded);
      urlVariations.add(encodeURI(doubleDecoded));
    } catch {}
    
    // Check if any variation is hidden using the comprehensive map or direct hiddenMap
    const urlArray = Array.from(urlVariations);
    
    // Helper to check if a value indicates hidden (handles both boolean true and string 'true')
    const isHiddenValue = (value: any): boolean => {
      return value === true || value === 'true';
    };
    
    // First check the exact URL from the list (most common case)
    let isHidden = isHiddenValue(hiddenMap[blob.url]) || comprehensiveHiddenMap[blob.url] === true;
    
    // If not found, check all variations
    if (!isHidden) {
      isHidden = urlArray.some(url => {
        const inComprehensive = comprehensiveHiddenMap[url] === true;
        const inDirect = isHiddenValue(hiddenMap[url]);
        return inComprehensive || inDirect;
      });
    }
    
    if (isHidden) {
      return false; // Hidden images never show
    }
    
    // Then check schedule
    const schedule = Array.from(urlVariations)
      .map(url => schedulesMap[url])
      .find(s => s !== undefined);
    if (!schedule) return true; // No schedule = visible immediately
    
    // Compare schedule ISO string with current ET time
    // Both should be in the same format for reliable comparison
    try {
      // Parse the schedule ISO string (may have 'Z' suffix or be in UTC)
      const scheduleDate = new Date(schedule);
      if (isNaN(scheduleDate.getTime())) {
        // Invalid date, show the image
        return true;
      }
      
      // Convert schedule to ET time string for comparison
      // Note: 'America/New_York' automatically handles DST, so comparison is correct year-round
      const scheduleETStr = scheduleDate.toLocaleString('en-US', {
        timeZone: 'America/New_York', // Automatically handles EST (winter) and EDT (summer)
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      
      // Parse schedule ET time
      const [schedDatePart, schedTimePart] = scheduleETStr.split(', ');
      const [schedMonth, schedDay, schedYear] = schedDatePart.split('/');
      const [schedHours, schedMinutes, schedSeconds] = schedTimePart.split(':');
      const scheduleETString = `${schedYear}-${schedMonth.padStart(2, '0')}-${schedDay.padStart(2, '0')}T${schedHours.padStart(2, '0')}:${schedMinutes.padStart(2, '0')}:${schedSeconds.padStart(2, '0')}`;
      
      // Compare as strings (ISO format allows lexicographic comparison)
      return nowETString >= scheduleETString;
    } catch (error) {
      // If comparison fails, show the image to be safe
      return true;
    }
  });

  return (
    <>
      {/* Newsletter section - right after navigation */}
      <NewsletterSection priority />
      
      {/* Available Flash section */}
      <main className="container mx-auto p-4">
        <h1 className="text-4xl font-light text-center my-8 text-[#414141]">Available Flash Designs</h1>
        <FlashGrid 
          images={visibleBlobs}
          captionsMap={captionsMap}
          categoriesMap={categoriesMap}
          allImageUrls={imageUrls}
          claimedMap={claimedMap}
        />
      </main>
      
      {/* Flash CTA - full-bleed under flash grid, above footer */}
      <FlashCTA imageUrls={imageUrls} variant="to-booking" useStaticBackground={true} />
    </>
  );
}
