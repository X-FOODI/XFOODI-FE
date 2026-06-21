import { NextResponse } from 'next/server';

const isFoodPlace = (r: { title?: string; type?: string; address?: string }) => {
  const type = String(r.type || '').toLowerCase();
  const name = String(r.title || '').toLowerCase();
  const addr = String(r.address || '').toLowerCase();

  const foodKeywords = [
    'restaurant', 'cafe', 'coffee', 'food', 'bakery', 'bistro', 'diner', 'eatery',
    'bar', 'pub', 'buffet', 'grill', 'noodle', 'sushi', 'pizza', 'burger', 'fast food',
    'nhà hàng', 'quán ăn', 'quán cà phê', 'cà phê', 'bánh mì', 'phở', 'bún', 'cơm',
    'lẩu', 'nướng', 'ăn vặt', 'trà sữa', 'ẩm thực', 'fastfood'
  ];

  return foodKeywords.some(
    (kw) => type.includes(kw) || name.includes(kw) || addr.includes(kw)
  );
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json(
        { success: false, message: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    // Server-only secret — never fall back to a NEXT_PUBLIC_ var (would leak the
    // key into the client bundle).
    const apiKey = process.env.SERPAPI_KEY;
    
    if (!apiKey) {
      console.warn('SerpApi API key is not configured on the server.');
      return NextResponse.json(
        { success: false, message: 'SerpApi is not configured on the server' },
        { status: 500 }
      );
    }
    
    const url = new URL('https://serpapi.com/search');
    url.searchParams.append('engine', 'google');
    url.searchParams.append('tbm', 'lcl');
    url.searchParams.append('q', query);
    url.searchParams.append('location', 'Vietnam');
    url.searchParams.append('api_key', apiKey);

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: 'SerpApi upstream error', status: res.status },
        { status: 502 }
      );
    }

    const data = await res.json();
    const list = Array.isArray(data.local_results) ? data.local_results : [];
    
    // Prioritize food/restaurant places
    const foodList = list.filter(isFoodPlace);
    const targetList = foodList.length > 0 ? foodList : list;

    const results = targetList
      .filter((r: any) => r.gps_coordinates || (data.local_map && data.local_map.gps_coordinates))
      .map((r: any, idx: number) => {
        const gps = r.gps_coordinates || data.local_map.gps_coordinates;
        return {
          id: `serp-${idx}-${gps.latitude}-${gps.longitude}`,
          name: r.title || query,
          address: r.address || 'Vietnam',
          lat: gps.latitude,
          lng: gps.longitude,
        };
      });

    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    console.error('Error in SerpApi Route Handler:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

