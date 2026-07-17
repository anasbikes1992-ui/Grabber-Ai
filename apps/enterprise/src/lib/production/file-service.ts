import { getSupabaseAdminClient } from "@/lib/production/supabase";
import { getProductionEnv } from "@/lib/production/env";

export type FileUploadInput = {
  path: string;
  contentType: string;
  data: Buffer | ArrayBuffer | Uint8Array;
  upsert?: boolean;
};

/**
 * Single abstraction for executive PDFs, contracts, invoices, and deliverables.
 */
export async function uploadFile(input: FileUploadInput) {
  const env = getProductionEnv();
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase.storage
    .from(env.storageBucket)
    .upload(input.path, input.data, {
      contentType: input.contentType,
      upsert: input.upsert || false,
    });

  if (error) {
    throw new Error(`file upload failed: ${error.message}`);
  }

  return data;
}

export async function getSignedFileUrl(path: string, expiresInSeconds = 3600) {
  const env = getProductionEnv();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(env.storageBucket)
    .createSignedUrl(path, expiresInSeconds);

  if (error) {
    throw new Error(`signed url failed: ${error.message}`);
  }
  return data.signedUrl;
}
