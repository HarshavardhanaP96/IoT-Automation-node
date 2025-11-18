//src/types/company.ts

export interface Company {
  id: string;
  name: string;
  address?: string;
  pinCode?: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
}
