import { useAuth } from '../context/AuthContext';

export function usePoints() {
  const { points, lifetimePoints, refreshProfile } = useAuth();
  return {
    points,
    lifetimePoints,
    refreshPoints: refreshProfile,
  };
}
