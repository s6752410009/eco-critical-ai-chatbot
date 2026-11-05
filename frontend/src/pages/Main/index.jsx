import PasswordModal, { usePasswordModal } from "@/components/Modals/Password";
import { FullScreenLoader } from "@/components/Preloader";
import Classroom from "@/pages/Classroom";

export default function Main() {
  const { loading, requiresAuth, mode } = usePasswordModal();
  if (loading) return <FullScreenLoader />;
  if (requiresAuth !== false)
    return <>{requiresAuth !== null && <PasswordModal mode={mode} />}</>;
  return <Classroom />;
}
