# API Library - ophim1.com Integration

Thư viện API hoàn chỉnh để tích hợp với ophim1.com API.

## Cấu trúc

```
lib/
├── api/
│   ├── ophim.ts          # API functions chính
│   ├── example.ts        # Ví dụ sử dụng
│   └── index.ts          # Export API functions
├── types/
│   └── api.ts            # TypeScript types cho API responses
├── utils/
│   └── transform.ts      # Utility functions để transform data
└── index.ts              # Export tất cả
```

## Cách sử dụng

### 1. Server Component (Next.js)

```tsx
import { getHomeData } from "@/lib/api/ophim";
import { transformOPhimMoviesToMovies } from "@/lib/utils/transform";

export default async function HomePage() {
  const homeData = await getHomeData();
  const movies = transformOPhimMoviesToMovies(homeData.data.items || []);
  
  return (
    <div>
      {movies.map(movie => (
        <div key={movie.id}>{movie.title}</div>
      ))}
    </div>
  );
}
```

### 2. Client Component

```tsx
"use client";

import { useEffect, useState } from "react";
import { fetchHomeDataClient } from "@/lib/api/ophim";
import { transformOPhimMoviesToMovies } from "@/lib/utils/transform";

export default function HomePage() {
  const [movies, setMovies] = useState([]);
  
  useEffect(() => {
    async function fetchData() {
      try {
        const homeData = await fetchHomeDataClient();
        const transformed = transformOPhimMoviesToMovies(homeData.data.items || []);
        setMovies(transformed);
      } catch (error) {
        console.error("Error:", error);
      }
    }
    fetchData();
  }, []);
  
  return (
    <div>
      {movies.map(movie => (
        <div key={movie.id}>{movie.title}</div>
      ))}
    </div>
  );
}
```

### 3. API Route (Next.js)

```tsx
import { NextResponse } from "next/server";
import { getHomeData } from "@/lib/api/ophim";
import { transformOPhimMoviesToMovies } from "@/lib/utils/transform";

export async function GET() {
  try {
    const homeData = await getHomeData();
    const movies = transformOPhimMoviesToMovies(homeData.data.items || []);
    
    return NextResponse.json({ movies });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
```

## API Functions

### `getHomeData()`

Fetch dữ liệu trang chủ từ API. Sử dụng cho Server Components.

```typescript
const homeData = await getHomeData();
// homeData.data chứa các sections: items, hot, new, etc.
```

### `fetchHomeDataClient()`

Fetch dữ liệu từ client-side. Sử dụng cho Client Components.

```typescript
const homeData = await fetchHomeDataClient();
```

### `getHomeSection(sectionKey: string)`

Lấy một section cụ thể từ home data.

```typescript
const movies = await getHomeSection("items");
```

## Transform Functions

### `transformOPhimMovieToMovie(ophimMovie: OPhimMovie): Movie`

Transform một movie từ API format sang app format.

### `transformOPhimMoviesToMovies(ophimMovies: OPhimMovie[]): Movie[]`

Transform một array movies từ API format sang app format.

## Error Handling

Tất cả các API functions đều throw errors khi có lỗi. Nên wrap trong try-catch:

```typescript
try {
  const homeData = await getHomeData();
  // Use data
} catch (error) {
  console.error("API Error:", error);
  // Handle error (show fallback UI, etc.)
}
```

## Types

Tất cả types được định nghĩa trong `lib/types/api.ts`:

- `OPhimMovie` - Movie object từ API
- `OPhimHomeResponse` - Response từ `/home` endpoint
- `OPhimHomeData` - Single section data

## Notes

- API có cache revalidation 1 giờ cho server-side fetch
- Client-side fetch không có cache
- Tất cả functions đều có TypeScript types đầy đủ
- Transform functions tự động map các fields từ API sang app format
