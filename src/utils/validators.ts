import { z } from "zod";

export const paperSizeSchema = z.enum(['A3', 'A4', 'A6']);
export const orientationSchema = z.enum(['portrait', 'landscape']);

export const projectMetadataSchema = z.object({
  projectName: z.string().min(3, "Proje adı en az 3 karakter olmalıdır"),
  companyName: z.string().min(2, "Şirket adı gereklidir"),
  documentNo: z.string().regex(/^[A-Z0-9]{2,6}-\d{8}-R\d{2}$/, "Format: PROJECT-YYYYMMDD-R01"),
  revision: z.string().regex(/^R\.\d{2}$/, "Format: R.01"),
  scale: z.string().default('1:1'),
  paperSize: paperSizeSchema,
  orientation: orientationSchema,
  technicalNotes: z.string().optional(),
  preparedBy: z.string().optional(),
  approvedBy: z.string().optional(),
  date: z.string().optional()
});

export type ProjectMetadataInput = z.infer<typeof projectMetadataSchema>;
