-- A coluna "role" guardava o plano (FREE/PAID). Vira "plan" sem perder dados,
-- e "role" passa a ser permissão de acesso (USER/ADMIN).

-- Plano
ALTER TYPE "UserRole" RENAME TO "UserPlan";
ALTER TABLE "users" RENAME COLUMN "role" TO "plan";

-- Permissão
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
ALTER TABLE "users" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';
