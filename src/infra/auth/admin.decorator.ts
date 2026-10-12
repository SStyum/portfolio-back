import { SetMetadata } from '@nestjs/common';

export const ADMINISTRATOR_ACCESS_KEY = 'adm_access';
// Rota só pra role ADMIN (checado no JwtAuthGuard)
export const AdminitratorAccess = () => SetMetadata(ADMINISTRATOR_ACCESS_KEY, true);
