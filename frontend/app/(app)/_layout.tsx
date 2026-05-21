import { useAuthStore } from '../../store/authStore';

export default function AppLayout() {
  const { user } = useAuthStore();

  if (user?.role === 'patient') {
    return require('./(patient)/_layout').default();
  }

  return require('./(caregiver)/_layout').default();
}
