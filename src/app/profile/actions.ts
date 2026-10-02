"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type ProfileActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
  confirmPassword: z.string().min(8).max(128),
}).superRefine((value, context) => {
  if (value.newPassword !== value.confirmPassword) {
    context.addIssue({
      code: "custom",
      path: ["confirmPassword"],
      message: "passwords_mismatch",
    });
  }

  if (value.currentPassword === value.newPassword) {
    context.addIssue({
      code: "custom",
      path: ["newPassword"],
      message: "password_unchanged",
    });
  }
});

const unauthenticatedState: ProfileActionState = {
  status: "error",
  message: "Session หมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง",
};

export async function updateProfile(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName"),
  });

  if (!parsed.success) {
    return { status: "error", message: "ชื่อต้องมีความยาว 1–120 ตัวอักษร" };
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;

  if (userError || !user) return unauthenticatedState;

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data.displayName })
    .eq("id", user.id);

  if (error) {
    return { status: "error", message: "บันทึกข้อมูลส่วนตัวไม่สำเร็จ กรุณาลองใหม่" };
  }

  revalidatePath("/");
  revalidatePath("/profile");

  return { status: "success", message: "บันทึกข้อมูลส่วนตัวแล้ว" };
}

export async function changePassword(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message;
    if (issue === "passwords_mismatch") {
      return { status: "error", message: "รหัสผ่านใหม่และการยืนยันไม่ตรงกัน" };
    }
    if (issue === "password_unchanged") {
      return { status: "error", message: "รหัสผ่านใหม่ต้องต่างจากรหัสผ่านปัจจุบัน" };
    }
    return { status: "error", message: "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร" };
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) return unauthenticatedState;

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
    current_password: parsed.data.currentPassword,
  });

  if (error) {
    if (error.code === "invalid_credentials") {
      return { status: "error", message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" };
    }
    if (error.code === "weak_password") {
      return { status: "error", message: "รหัสผ่านใหม่ยังไม่ผ่านนโยบายความปลอดภัย" };
    }
    if (error.code === "same_password") {
      return { status: "error", message: "รหัสผ่านใหม่ต้องต่างจากรหัสผ่านปัจจุบัน" };
    }
    if (error.code === "reauthentication_needed") {
      return { status: "error", message: "กรุณาออกจากระบบและเข้าสู่ระบบใหม่ก่อนเปลี่ยนรหัสผ่าน" };
    }
    return { status: "error", message: "เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาลองใหม่" };
  }

  return { status: "success", message: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว" };
}
