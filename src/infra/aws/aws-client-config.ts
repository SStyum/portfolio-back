import { EnvService } from "../env/env.service";

// Config comum dos clients do SDK. Com AWS_ENDPOINT_URL (LocalStack) as chamadas vão pro container local.
export function awsClientConfig(env: EnvService) {
  const endpoint = env.get('AWS_ENDPOINT_URL')

  return {
    region: env.get('AWS_REGION'),
    ...(endpoint && { endpoint }),
  }
}
