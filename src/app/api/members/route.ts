import { createMemberAccount } from "@/lib/members/create-account";

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({ ok: false, error: "คำขอไม่ถูกต้อง" }, { status: 403 });
  }

  try {
    const result = await createMemberAccount(await request.json());
    return Response.json(result, {
      status: result.ok ? 200 : 400,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { ok: false, error: "สร้างบัญชีผู้ใช้ไม่สำเร็จ กรุณาลองใหม่" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
