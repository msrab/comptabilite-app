export type ContactRole = 'client' | 'member';

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  roles: ContactRole[];           // peut être client ET membre
  organization?: string;          // entreprise/asbl partenaire
  memberRole?: string;            // rôle au sein de l'ASBL (trésorier, président…)
  joinDate?: Date;                // date d'adhésion si membre
  memberActive?: boolean;         // actif si membre
  notes?: string;
  createdAt: Date;
}
