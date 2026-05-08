export const TRANSACTION_CATEGORIES = [
  'Don',
  'Cotisations',
  'Subsides',
  'Vente de services',
  'Remboursements reçus',
  'Autres revenus',
  'Salaires et charges',
  'Loyer et charges',
  'Matériel et équipement',
  'Frais de déplacement',
  'Défraiement bénévole',
  'Déplacement kilométrique',
  'Communication et marketing',
  'Frais bancaires',
  'Assurances',
  'Honoraires',
  'Formations',
  'Événements',
  'Fournitures de bureau',
  'Informatique',
  'Autres dépenses'
];

export const CAT_ALLOWANCE = 'Défraiement bénévole';
export const CAT_KM        = 'Déplacement kilométrique';

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'both';
  color?: string;
}
