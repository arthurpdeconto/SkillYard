import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

import { deleteProfile, updateProfile } from "./actions";
import { ProfileClient } from "./profile-client";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <ProfileClient
      user={{
        name: session.user.name ?? "",
        email: session.user.email ?? "",
        role: session.user.role,
      }}
      onUpdate={updateProfile}
      onDelete={deleteProfile}
    />
  );
}
