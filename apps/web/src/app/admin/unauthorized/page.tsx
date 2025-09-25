import Link from 'next/link';

export default async function UnauthorizedPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const requiredRole = Array.isArray(params?.require) ? params.require[0] : params?.require;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-semibold">접근 권한이 필요합니다</h1>
      <p className="text-balance text-neutral-500">
        이 페이지를 열려면 최소 <strong>{requiredRole ?? 'viewer'}</strong> 이상의 권한이
        필요합니다.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/api/auth/signout"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm"
        >
          다른 계정으로 로그인
        </Link>
        <Link href="/" className="rounded-md bg-black px-4 py-2 text-sm text-white">
          홈으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
