import { SetMetadata } from '@nestjs/common';

export const ADMINISTRATOR_ACCESS_KEY = 'adm_access';
export const AdminitratorAccess = () => SetMetadata(ADMINISTRATOR_ACCESS_KEY, true);
