
import { User } from '../types';

export const ADMIN_PHONE = '0705052632';

export const isAdmin = (user: User | null): boolean => {
  if (!user) return false;
  return user.phone === ADMIN_PHONE || user.role === 'Admin 225';
};

export const getCardType = (role: string | undefined): 'service' | 'pro' => {
  if (!role) return 'pro';
  const isServiceType = role === 'Propriété' || 
                       role === 'Agence' || 
                       role === 'Propriétaire d’équipement' || 
                       role === 'Agence immobilière' ||
                       role === 'Propriétaire d’équipements';
  return isServiceType ? 'service' : 'pro';
};
